import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mediaId } = await req.json();
  if (!mediaId) {
    return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
  }

  try {
    const mediaItem = await prisma.collectionMedia.findUnique({
      where: { id: mediaId },
    });

    if (!mediaItem || !mediaItem.price) {
      return NextResponse.json({ error: 'Item not found or has no price' }, { status: 404 });
    }

    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: mediaItem.title,
          description: mediaItem.description || undefined,
          images: mediaItem.thumbnailUrl ? [mediaItem.thumbnailUrl] : [],
        },
        unit_amount: Math.round(Number(mediaItem.price) * 100),
      },
      quantity: 1,
    }];
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/collections`,
      metadata: {
        userId: user.id,
        mediaId: mediaItem.id,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
  }
} 