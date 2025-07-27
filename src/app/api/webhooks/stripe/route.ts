import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { collection_id, user_id, duration } = session.metadata || {};
  
  if (!collection_id || !user_id || !duration) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Calculate expiration time
  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt.getTime() + parseInt(duration) * 1000); // duration is in seconds

  // First, deactivate all existing active purchases for this user
  const { error: deactivateError } = await supabase
    .from('purchases')
    .update({ 
      is_active: false,
      deactivated_at: new Date().toISOString()
    })
    .eq('user_id', user_id)
    .eq('is_active', true);

  if (deactivateError) {
    console.error('Failed to deactivate existing purchases:', deactivateError);
    // Continue with new purchase creation even if deactivation fails
  }

  // Create new purchase record with active status
  const { error } = await supabase
    .from('purchases')
    .insert({
      user_id: user_id,
      collection_id: collection_id,
      stripe_session_id: session.id,
      created_at: purchasedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      deactivated_at: null
    });

  if (error) {
    console.error('Failed to create purchase record:', error);
    throw error;
  }

  console.log(`New active purchase created for user ${user_id}, collection ${collection_id}`);
  console.log(`Previous purchases for user ${user_id} have been deactivated`);
} 