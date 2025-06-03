import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil',
  });

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse('Missing Stripe signature', { status: 400 });
  }

  // Read the raw body as a buffer
  const rawBody = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    // Optionally handle post-payment logic here
    // e.g., send email, log, etc.
  }

  // Respond with 200 to acknowledge receipt
  return new NextResponse(null, { status: 200 });
} 