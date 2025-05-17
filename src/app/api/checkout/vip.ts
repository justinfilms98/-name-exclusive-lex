import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const TIER_PRICES = {
  silver: 6000, // $60/mo
  gold: 10000, // $100/mo
  platinum: 50000, // $500/mo
};

const TIER_NAMES = {
  silver: 'Silver VIP',
  gold: 'Gold VIP',
  platinum: 'Platinum VIP',
};

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json();
    if (!tier || !TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    const typedTier = tier as 'silver' | 'gold' | 'platinum';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: TIER_NAMES[typedTier],
            },
            unit_amount: TIER_PRICES[typedTier],
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/vip`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe VIP subscription error:', err);
    return NextResponse.json({ error: 'Stripe subscription failed' }, { status: 500 });
  }
} 