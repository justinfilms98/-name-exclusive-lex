// Fix specific session purchases
// Run this script to automatically create missing purchases for a specific session

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSpecificSession(sessionId, userId) {
  console.log(`🔍 Fixing session: ${sessionId} for user: ${userId}`);
  
  try {
    // Check if purchases already exist for this session
    const { data: existingPurchases, error: existingError } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_session_id', sessionId);
    
    if (existingError) {
      console.error('Error checking existing purchases:', existingError);
      return;
    }
    
    if (existingPurchases && existingPurchases.length > 0) {
      console.log('✅ Purchases already exist for this session:', existingPurchases.length);
      return existingPurchases;
    }
    
    // Retrieve the Stripe session
    console.log('🔍 Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      console.error('❌ Session not found in Stripe');
      return;
    }
    
    console.log('✅ Session found:', {
      id: session.id,
      status: session.status,
      amount_total: session.amount_total,
      currency: session.currency
    });
    
    if (session.status !== 'complete') {
      console.log('⚠️ Session is not complete:', session.status);
      return;
    }
    
    // Get line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    console.log(`🔍 Found ${lineItems.data.length} line items`);
    
    const createdPurchases = [];
    
    for (const item of lineItems.data) {
      let collectionId = item.price?.metadata?.collection_id;
      
      // If not in price metadata, try product metadata
      if (!collectionId && item.price?.product && typeof item.price.product === 'object') {
        const product = item.price.product;
        collectionId = product.metadata?.collection_id;
      }
      
      if (!collectionId) {
        console.log('⚠️ No collection_id found for item:', item.id);
        continue;
      }
      
      console.log(`🔍 Processing collection: ${collectionId}`);
      
      // Check if purchase already exists
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('collection_id', collectionId)
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      
      if (existingPurchase) {
        console.log('✅ Purchase already exists for collection:', collectionId);
        continue;
      }
      
      // Get collection details
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('price, title, description')
        .eq('id', collectionId)
        .single();
      
      if (collectionError) {
        console.error('❌ Collection not found:', collectionId);
        continue;
      }
      
      // Create purchase record
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          collection_id: collectionId,
          stripe_session_id: sessionId,
          amount_paid: collection.price ? collection.price / 100 : 0,
          currency: session.currency || 'usd',
          status: 'completed',
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating purchase:', createError);
      } else {
        console.log('✅ Created purchase:', newPurchase.id);
        createdPurchases.push(newPurchase);
      }
    }
    
    console.log(`✅ Successfully created ${createdPurchases.length} purchases`);
    return createdPurchases;
    
  } catch (error) {
    console.error('❌ Error fixing session:', error);
  }
}

// Run the fix for the specific session
const sessionId = 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8';
const userId = 'c7197642-a5eb-4f90-8632-7eb50560adad';

fixSpecificSession(sessionId, userId)
  .then((result) => {
    console.log('🎉 Fix completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 