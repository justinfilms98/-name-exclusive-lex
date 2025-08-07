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

  console.log('🔍 Webhook received:', {
    hasSignature: !!sig,
    bodyLength: rawBody.length,
    headers: Object.fromEntries(req.headers.entries())
  });

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

  console.log('🔍 Webhook event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      console.log(`🔍 DEBUG: Processing checkout session ${session.id} for user ${session.metadata?.user_id}`);
      console.log(`🔍 DEBUG: Session metadata:`, session.metadata);
      console.log(`🔍 DEBUG: Session amount_total:`, session.amount_total);
      console.log(`🔍 DEBUG: Session currency:`, session.currency);

      // Get all line items from the checkout session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      console.log(`🔍 DEBUG: Found ${lineItems.data.length} line items`);
      console.log(`🔍 DEBUG: Line items:`, JSON.stringify(lineItems.data, null, 2));

      // Extract collection IDs from session metadata first (most reliable)
      let collectionIds: string[] = [];
      if (session.metadata?.collection_ids) {
        try {
          const sessionCollectionIds = JSON.parse(session.metadata.collection_ids);
          if (Array.isArray(sessionCollectionIds)) {
            collectionIds = sessionCollectionIds;
            console.log('🔍 DEBUG: Found collection_ids in session metadata:', collectionIds);
          }
        } catch (e) {
          console.error('Error parsing collection_ids from session metadata:', e);
        }
      }

      // If no collection IDs from session metadata, extract from line items
      if (collectionIds.length === 0) {
        console.log('🔍 DEBUG: No collection_ids in session metadata, extracting from line items...');
        
        // Process each line item
        for (const item of lineItems.data) {
          let collectionId = item.price?.metadata?.collection_id;
          
          console.log('🔍 DEBUG: Processing line item:', {
            itemId: item.id,
            priceId: item.price?.id,
            priceMetadata: item.price?.metadata,
            product: item.price?.product,
            description: item.description
          });
          
          // If not in price metadata, try product metadata
          if (!collectionId && item.price?.product && typeof item.price.product === 'object') {
            const product = item.price.product as any;
            collectionId = product.metadata?.collection_id;
            console.log('🔍 DEBUG: Found collection_id in product metadata:', collectionId);
          }
          
          // If still not found, try to extract from product_data metadata
          if (!collectionId && item.price?.product && typeof item.price.product === 'object') {
            const product = item.price.product as any;
            // Check if the product has metadata or if we need to look deeper
            if (product.metadata && product.metadata.collection_id) {
              collectionId = product.metadata.collection_id;
              console.log('🔍 DEBUG: Found collection_id in product metadata (deep):', collectionId);
            }
          }
          
          if (collectionId && !collectionIds.includes(collectionId)) {
            collectionIds.push(collectionId);
            console.log('✅ Added collection_id from line item:', collectionId);
          } else if (!collectionId) {
            console.warn(`⚠️ Could not extract collection_id from line item:`, {
              itemId: item.id,
              priceId: item.price?.id,
              priceMetadata: item.price?.metadata,
              product: item.price?.product,
              description: item.description
            });
          }
        }
      }

      // If still no collection IDs, try to extract from line items more aggressively
      if (collectionIds.length === 0) {
        console.log('🔍 DEBUG: Still no collection_ids found, trying aggressive extraction from line items...');
        
        for (const item of lineItems.data) {
          // Skip tip items
          if (item.description?.toLowerCase().includes('tip')) {
            console.log('🔍 DEBUG: Skipping tip item:', item.description);
            continue;
          }
          
          let collectionId: string | null = null;
          
          // Try multiple extraction methods
          if (item.price?.metadata?.collection_id) {
            collectionId = item.price.metadata.collection_id;
          } else if (item.price?.product && typeof item.price.product === 'object') {
            const product = item.price.product as any;
            collectionId = product.metadata?.collection_id;
          }
          
          if (collectionId && !collectionIds.includes(collectionId)) {
            collectionIds.push(collectionId);
            console.log('✅ Added collection_id from aggressive extraction:', collectionId);
          }
        }
      }

      console.log('🔍 DEBUG: Final collection IDs to process:', collectionIds);

      // Process each collection ID
      const processedCollections: string[] = [];
      for (const collectionId of collectionIds) {
        try {
          console.log(`🔍 DEBUG: Processing collection ${collectionId} for user ${session.metadata?.user_id}`);
          
          // Calculate individual item amount (divide total by number of collections)
          const itemAmount = session.amount_total ? Math.round(session.amount_total / collectionIds.length) : 0;
          console.log(`🔍 DEBUG: Item amount: ${itemAmount} cents for collection ${collectionId}`);
          
          await processCollectionPurchase(
            session.metadata?.user_id, 
            collectionId, 
            session.id, 
            itemAmount,
            session.currency
          );
          
          processedCollections.push(collectionId);
          console.log(`✅ Successfully processed collection ${collectionId}`);
        } catch (error) {
          console.error(`❌ Error processing collection ${collectionId}:`, error);
          // Continue processing other collections even if one fails
        }
      }

      console.log(`✅ Successfully processed ${processedCollections.length}/${collectionIds.length} collections for user ${session.metadata?.user_id}`);
      console.log(`✅ Processed collections:`, processedCollections);
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      // Don't return error response - we want to acknowledge the webhook even if processing fails
      // The success page will handle the verification
      console.log('⚠️ Webhook processing failed, but acknowledging receipt');
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

  // Validate user_id format (should be a UUID)
  if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error(`❌ Invalid user_id format: ${userId}`);
    return;
  }

  // Validate collection_id format (should be a UUID)
  if (!collectionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error(`❌ Invalid collection_id format: ${collectionId}`);
    return;
  }

  console.log(`🔍 DEBUG: Processing collection ${collectionId} for user ${userId}`);
  console.log(`🔍 DEBUG: Validated user_id: ${userId}, collection_id: ${collectionId}`);
  
  // Check for duplicates using unique constraint
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️ Purchase already exists for collection ${collectionId} in session ${sessionId}`);
    return;
  }

  // Additional check: see if this session already has purchases for this user
  const { data: sessionPurchases, error: sessionError } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id')
    .eq('stripe_session_id', sessionId)
    .eq('user_id', userId);

  if (sessionError) {
    console.error(`❌ Error checking session purchases:`, sessionError);
  } else if (sessionPurchases && sessionPurchases.length > 0) {
    console.log(`🔍 Session ${sessionId} already has ${sessionPurchases.length} purchases for user ${userId}`);
    // Check if this specific collection is already purchased in this session
    const alreadyPurchased = sessionPurchases.find(p => p.collection_id === collectionId);
    if (alreadyPurchased) {
      console.log(`ℹ️ Collection ${collectionId} already purchased in session ${sessionId}`);
      return;
    }
  }

  // Get collection details to calculate individual price
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('price, title')
    .eq('id', collectionId)
    .single();

  if (collectionError || !collection) {
    console.error(`❌ Failed to fetch collection ${collectionId}:`, collectionError);
    // Don't throw error, just log it and continue
    console.log(`⚠️ Continuing with default price for collection ${collectionId}`);
  }

  // Convert price from cents to dollars for storage
  const amountPaid = collection?.price ? collection.price / 100 : (amountTotal ? amountTotal / 100 : 0);

  console.log(`🔍 DEBUG: Creating purchase record for collection ${collectionId} (${collection?.title || 'Unknown'}) - Amount: $${amountPaid} (from collection price: ${collection?.price || 'N/A'}, item amount: ${amountTotal || 'N/A'})`);

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
    // Try to handle specific errors
    if (error.code === '23505') { // Unique constraint violation
      console.log(`ℹ️ Purchase already exists for collection ${collectionId} (unique constraint)`);
      return;
    }
    throw error;
  }

  console.log(`✅ New purchase created for user ${userId}, collection ${collectionId} (${collection?.title || 'Unknown'}) - Purchase ID: ${newPurchase.id}`);
  
  // Verify the purchase was created correctly
  const { data: verifyPurchase, error: verifyError } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id, stripe_session_id')
    .eq('id', newPurchase.id)
    .single();

  if (verifyError || !verifyPurchase) {
    console.error(`❌ Failed to verify purchase creation:`, verifyError);
  } else {
    console.log(`✅ Purchase verified: user_id=${verifyPurchase.user_id}, collection_id=${verifyPurchase.collection_id}`);
  }
} 