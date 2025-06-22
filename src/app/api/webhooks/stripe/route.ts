import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Extract metadata
      const userId = session.metadata?.userId;
      const videoId = session.metadata?.videoId;
      
      if (!userId || !videoId) {
        console.error('Missing userId or videoId in session metadata');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Create purchase record using type assertion
      const purchase = await (prisma as any).purchase.create({
        data: {
          userId,
          videoId: parseInt(videoId),
          stripeCheckoutId: session.id,
        },
      });

      // Create timed access record (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Use type assertion since TypeScript doesn't recognize timedAccess
      await (prisma as any).timedAccess.create({
        data: {
          userId,
          videoId,
          expiresAt,
        },
      });

      console.log(`Purchase completed for user ${userId}, video ${videoId}`);
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}