import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cartItems } = await req.json();

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
  }

  const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const line_items = cartItems.map(item => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.thumbnail ? [item.thumbnail] : [],
          },
          unit_amount: Math.round(item.price * 100), // Price in cents
        },
        quantity: 1,
      };
    });

    // We'll pass the cart items as a JSON string in the metadata.
    // Stripe's metadata values are limited to 500 characters.
    // For larger carts, a different strategy (like saving the cart to the DB first) would be needed.
    const cartDetails = JSON.stringify(cartItems.map(item => ({ id: item.id, duration: 60 }))); // Assuming a default duration

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cart`,
      metadata: {
        // @ts-ignore
        user_id: session.user.id,
        cart_details: cartDetails,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Could not create Stripe Checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ redirectUrl: checkoutSession.url });

  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
} 