// =====================================================
// STRIPE CONFIGURATION AND UTILITIES
// =====================================================

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

// Helper function to create a checkout session
export async function createCheckoutSession({
  userId,
  collectionVideoId,
  title,
  price,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  collectionVideoId: string;
  title: string;
  price: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: title,
            description: `Access to ${title}`,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      collectionVideoId,
      title,
    },
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
  });

  return session;
}

// Helper function to retrieve a checkout session
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

// Helper function to create a payment intent (for custom payment flows)
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  metadata = {},
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata,
  });
}

// Helper function to verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// Helper function to format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Helper function to convert Stripe amount to dollars
export function stripeAmountToDollars(amount: number): number {
  return amount / 100;
}

// Helper function to convert dollars to Stripe amount
export function dollarsToStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
} 