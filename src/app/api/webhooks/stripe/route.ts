import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') as string;
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      console.log(`🔍 DEBUG: Processing checkout session ${session.id} for user ${session.metadata?.user_id}`);
      console.log(`🔍 DEBUG: Session metadata:`, session.metadata);

      // Handle multiple collections from metadata
      if (session.metadata?.collection_ids && session.metadata?.collection_count) {
        try {
          const collectionIds = JSON.parse(session.metadata.collection_ids);
          const count = parseInt(session.metadata.collection_count);
          
          console.log(`🔍 DEBUG: Processing ${count} collections for user ${session.metadata.user_id}:`, collectionIds);
          
          // Process each collection
          for (const collectionId of collectionIds) {
            await processCollectionPurchase(session.metadata.user_id, collectionId, session.id, session.amount_total, session.currency);
          }
          
          console.log(`✅ Successfully processed ${count} collections for user ${session.metadata.user_id}`);
        } catch (error) {
          console.error('❌ Error processing multiple collections:', error);
          throw error;
        }
      } else {
        // Fallback: try to get collection from line items
        console.log('🔍 DEBUG: No collection metadata found, attempting to process from line items');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        for (const item of lineItems.data) {
          const collectionId = item.price?.metadata?.collection_id;

          if (!collectionId) {
            console.warn(`⚠️ Missing collection_id in metadata for item ${item.id}`);
            continue;
          }

          await processCollectionPurchase(session.metadata?.user_id, collectionId, session.id, session.amount_total, session.currency);
        }
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return new NextResponse('Webhook handler failed', { status: 500 });
    }
  }

  return new NextResponse('Webhook processed', { status: 200 });
}

async function processCollectionPurchase(
  userId: string | undefined,
  collectionId: string,
  sessionId: string,
  amountTotal: number | null,
  currency: string | null
) {
  if (!userId) {
    console.error('❌ Missing user_id for collection purchase');
    return;
  }

  console.log(`🔍 DEBUG: Processing collection ${collectionId} for user ${userId}`);
  
  // Check for duplicates before inserting
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️ Purchase already exists for collection ${collectionId}`);
    return;
  }

  // Get collection details to calculate individual price
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('price, title')
    .eq('id', collectionId)
    .single();

  if (collectionError || !collection) {
    console.error(`❌ Failed to fetch collection ${collectionId}:`, collectionError);
    throw new Error(`Collection ${collectionId} not found`);
  }

  const amountPaid = collection?.price || (amountTotal ? amountTotal / 100 : 0);

  console.log(`🔍 DEBUG: Creating purchase record for collection ${collectionId} (${collection.title}) - Amount: $${amountPaid}`);

  // Create new purchase record
  const { data: newPurchase, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      collection_id: collectionId,
      stripe_session_id: sessionId,
      amount_paid: amountPaid,
      currency: currency || 'usd',
      status: 'completed',
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Failed to create purchase record for collection ${collectionId}:`, error);
    throw error;
  }

  console.log(`✅ New purchase created for user ${userId}, collection ${collectionId} (${collection.title}) - Purchase ID: ${newPurchase.id}`);
} 