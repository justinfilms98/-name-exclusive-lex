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
  const { user_id, collection_ids, collection_count } = session.metadata || {};
  
  if (!user_id) {
    console.error('Missing user_id in checkout session metadata:', session.id);
    return;
  }

  // Handle multiple collections
  if (collection_ids && collection_count) {
    try {
      const collectionIds = JSON.parse(collection_ids);
      const count = parseInt(collection_count);
      
      console.log(`Processing ${count} collections for user ${user_id}:`, collectionIds);
      
      // Process each collection
      for (const collectionId of collectionIds) {
        await processCollectionPurchase(user_id, collectionId, session.id, session.amount_total);
      }
      
      console.log(`Successfully processed ${count} collections for user ${user_id}`);
    } catch (error) {
      console.error('Error processing multiple collections:', error);
      throw error;
    }
  }
  // Handle single collection (backward compatibility)
  else if (session.metadata?.collection_id) {
    const collectionId = session.metadata.collection_id;
    await processCollectionPurchase(user_id, collectionId, session.id, session.amount_total);
  }
  // Fallback: try to get collection from line items
  else {
    console.log('No collection metadata found, attempting to process from line items');
    await processFromLineItems(session);
  }
}

async function processCollectionPurchase(
  userId: string, 
  collectionId: string, 
  sessionId: string, 
  amountTotal: number | null
) {
  console.log(`Processing collection ${collectionId} for user ${userId}`);
  
  // Check if purchase record already exists
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .eq('stripe_session_id', sessionId)
    .single();

  if (existingPurchase) {
    console.log(`Purchase record already exists for user ${userId}, collection ${collectionId}`);
    return;
  }

  // Get collection details to calculate individual price
  const { data: collection } = await supabase
    .from('collections')
    .select('price')
    .eq('id', collectionId)
    .single();

  const amountPaid = collection?.price || (amountTotal ? amountTotal / 100 : 0);

  // Create new purchase record
  const { error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      collection_id: collectionId,
      stripe_session_id: sessionId,
      created_at: new Date().toISOString(),
      amount_paid: amountPaid,
      is_active: true
    });

  if (error) {
    console.error('Failed to create purchase record:', error);
    throw error;
  }

  console.log(`New purchase created for user ${userId}, collection ${collectionId}`);
}

async function processFromLineItems(session: Stripe.Checkout.Session) {
  console.log('Processing from line items as fallback');
  
  if (!session.line_items?.data) {
    console.error('No line items found in session');
    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id found in session metadata');
    return;
  }

  // This is a fallback method - in practice, we should always have metadata
  // But this provides backward compatibility
  for (const item of session.line_items.data) {
    if (item.price?.product) {
      // Try to find collection by Stripe product ID
      const { data: collection } = await supabase
        .from('collections')
        .select('id, price')
        .eq('stripe_product_id', item.price.product)
        .single();

      if (collection) {
        await processCollectionPurchase(
          userId, 
          collection.id, 
          session.id, 
          session.amount_total
        );
      }
    }
  }
} 