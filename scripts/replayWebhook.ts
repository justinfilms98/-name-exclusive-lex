import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

// Usage: ts-node scripts/replayWebhook.ts <checkout_session_id>
(async () => {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('❌ Please provide a checkout session ID.');
    console.log('Usage: ts-node scripts/replayWebhook.ts <checkout_session_id>');
    process.exit(1);
  }

  try {
    console.log(`🔍 DEBUG: Replaying webhook for session ${sessionId}`);
    
    // Get the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`✅ Retrieved session: ${session.id}`);
    console.log(`🔍 DEBUG: Session metadata:`, session.metadata);

    // Get line items for the session
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    console.log(`🔍 DEBUG: Found ${lineItems.data.length} line items`);

    // Process the session manually (simulate webhook processing)
    if (session.metadata?.collection_ids && session.metadata?.collection_count) {
      try {
        const collectionIds = JSON.parse(session.metadata.collection_ids);
        const count = parseInt(session.metadata.collection_count);
        
        console.log(`🔍 DEBUG: Processing ${count} collections for user ${session.metadata.user_id}:`, collectionIds);
        
        // Import supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.SUPABASE_SERVICE_ROLE_KEY as string
        );
        
        // Process each collection
        for (const collectionId of collectionIds) {
          await processCollectionPurchase(supabase, session.metadata.user_id, collectionId, session.id, session.amount_total, session.currency);
        }
        
        console.log(`✅ Successfully processed ${count} collections for user ${session.metadata.user_id}`);
      } catch (error) {
        console.error('❌ Error processing multiple collections:', error);
        throw error;
      }
    } else {
      console.log('🔍 DEBUG: No collection metadata found, processing from line items');
      
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      );

      for (const item of lineItems.data) {
        const collectionId = item.price?.metadata?.collection_id;

        if (!collectionId) {
          console.warn(`⚠️ Missing collection_id in metadata for item ${item.id}`);
          continue;
        }

        await processCollectionPurchase(supabase, session.metadata?.user_id, collectionId, session.id, session.amount_total, session.currency);
      }
    }

    console.log(`✅ Successfully replayed webhook for session ${sessionId}`);
  } catch (err) {
    console.error('❌ Failed to replay webhook:', err);
    process.exit(1);
  }
})();

async function processCollectionPurchase(
  supabase: any,
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