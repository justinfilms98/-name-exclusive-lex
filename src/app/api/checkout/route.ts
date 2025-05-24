import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { cartItems, userEmail } = await req.json();
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }
    if (cartItems.some((item: any) => !item.price || item.price <= 0)) {
      return NextResponse.json({ error: 'All items must have a price greater than $0.' }, { status: 400 });
    }

    const line_items = cartItems.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: 1,
    }));

    // Collect video IDs for metadata
    const videoIds = cartItems.map((item: any) => item.id).join(',');
    console.log('Creating Stripe session with:', { userEmail, videoIds, cartItems });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      metadata: {
        video_ids: videoIds,
      },
    });

    console.log('Stripe session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Stripe checkout failed' }, { status: 500 });
  }
} 