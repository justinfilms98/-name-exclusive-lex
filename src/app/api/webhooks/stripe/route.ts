import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, mediaId } = session.metadata || {};

    if (!userId || !mediaId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    try {
      await prisma.purchase.create({
        data: {
          userId,
          mediaId,
          stripeChargeId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          // Set an expiration if needed, otherwise access is permanent
          // expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // e.g., 30 days
        },
      });
    } catch (error) {
      console.error('Failed to create purchase record:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}