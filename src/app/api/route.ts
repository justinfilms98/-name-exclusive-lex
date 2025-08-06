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
  
  // If this is a Stripe webhook (has stripe-signature header), process it
  if (signature) {
    console.log('🔍 DEBUG: Stripe webhook detected at root, processing directly');
    
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log(`🔍 DEBUG: Processing webhook event: ${event.type}`);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`🔍 DEBUG: Processing checkout session: ${session.id}`);
        
        // Get all line items from the checkout session
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        console.log(`🔍 DEBUG: Found ${lineItems.data.length} line items`);

        // Process each line item
        for (const item of lineItems.data) {
          const collectionId = item.price?.metadata?.collection_id;

          if (!collectionId) {
            console.warn(`⚠️ Missing collection_id in metadata for item ${item.id}`);
            continue;
          }

          await processCollectionPurchase(
            session.metadata?.user_id, 
            collectionId, 
            session.id, 
            session.amount_total, 
            session.currency
          );
        }

        console.log(`✅ Successfully processed ${lineItems.data.length} items for user ${session.metadata?.user_id}`);
      } else {
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  }
  
  // For non-Stripe requests, return 405 Method Not Allowed
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
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
  
  // Check for duplicates using unique constraint
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

  // Create new purchase record with completed status
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