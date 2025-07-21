import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata
        const { collectionId, userId, collectionTitle } = session.metadata || {};
        
        if (!collectionId || !userId) {
          console.error('Missing metadata in checkout session');
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Get collection details to calculate expiration
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('duration')
          .eq('id', collectionId)
          .single();

        if (collectionError || !collection) {
          console.error('Collection not found:', collectionId);
          return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Calculate expiration time (duration is in seconds)
        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt.getTime() + collection.duration * 1000);

        // Create purchase record
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            collection_id: collectionId,
            stripe_session_id: session.id,
            purchased_at: purchasedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

        if (purchaseError) {
          console.error('Failed to create purchase record:', purchaseError);
          return NextResponse.json(
            { error: 'Failed to create purchase record' },
            { status: 500 }
          );
        }

        console.log(`Purchase completed: ${collectionTitle} for user ${userId}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 