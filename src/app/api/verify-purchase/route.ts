import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    console.log(`🔍 Server-side verification for session: ${sessionId}, user: ${userId}`);

    // Method 1: Check for existing purchases
    let { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        collection_id,
        stripe_session_id,
        created_at,
        status,
        is_active,
        amount_paid
      `)
      .eq('stripe_session_id', sessionId)
      .eq('user_id', userId);

    if (purchaseError) {
      console.error('Purchase query error:', purchaseError);
    } else if (purchases && purchases.length > 0) {
      console.log('✅ Found existing purchases:', purchases.length);
      return NextResponse.json({ purchases, success: true });
    }

    // Method 2: Check Stripe session
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (stripeSession && stripeSession.status === 'complete') {
        console.log('✅ Stripe session is complete, creating purchase records...');
        
        // Get collection IDs from line items
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
        const collectionIds: string[] = [];
        
        for (const item of lineItems.data) {
          let collectionId = item.price?.metadata?.collection_id;
          if (!collectionId && item.price?.product && typeof item.price.product === 'object') {
            const product = item.price.product as any;
            collectionId = product.metadata?.collection_id;
          }
          if (collectionId && !collectionIds.includes(collectionId)) {
            collectionIds.push(collectionId);
          }
        }

        console.log('🔍 Found collection IDs:', collectionIds);

        // Create purchase records
        const createdPurchases = [];
        for (const collectionId of collectionIds) {
          const { data: collection } = await supabase
            .from('collections')
            .select('price, title, description')
            .eq('id', collectionId)
            .single();

          if (collection) {
            // Check if purchase already exists
            const { data: existingPurchase } = await supabase
              .from('purchases')
              .select('id')
              .eq('user_id', userId)
              .eq('collection_id', collectionId)
              .eq('stripe_session_id', sessionId)
              .maybeSingle();

            if (!existingPurchase) {
              const { data: newPurchase, error: createError } = await supabase
                .from('purchases')
                .insert({
                  user_id: userId,
                  collection_id: collectionId,
                  stripe_session_id: sessionId,
                  amount_paid: collection.price ? collection.price / 100 : 0,
                  currency: 'usd',
                  status: 'completed',
                  is_active: true,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (!createError && newPurchase) {
                console.log('✅ Created purchase record:', newPurchase.id);
                createdPurchases.push({
                  ...newPurchase,
                  collection: collection
                });
              } else {
                console.error('Error creating purchase record:', createError);
                // Create temporary record
                createdPurchases.push({
                  id: `temp-${collectionId}`,
                  user_id: userId,
                  collection_id: collectionId,
                  stripe_session_id: sessionId,
                  amount_paid: collection.price ? collection.price / 100 : 0,
                  currency: 'usd',
                  status: 'completed',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  collection: collection
                });
              }
            } else {
              console.log('✅ Purchase record already exists for collection:', collectionId);
              createdPurchases.push({
                ...existingPurchase,
                collection: collection
              });
            }
          } else {
            // Collection not found, create temporary record
            console.log('⚠️ Collection not found but payment succeeded - creating temporary record');
            createdPurchases.push({
              id: `temp-${collectionId}`,
              user_id: userId,
              collection_id: collectionId,
              stripe_session_id: sessionId,
              amount_paid: 0,
              currency: 'usd',
              status: 'completed',
              is_active: true,
              created_at: new Date().toISOString(),
              collection: {
                id: collectionId,
                title: 'Unknown Collection',
                description: 'Collection details not available',
                price: 0
              }
            });
          }
        }

        if (createdPurchases.length > 0) {
          return NextResponse.json({ purchases: createdPurchases, success: true });
        }
      } else {
        console.log('⚠️ Stripe session is not complete:', stripeSession.status);
      }
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
    }

    // Method 3: Check for recent purchases as last resort
    const { data: recentPurchases, error: recentError } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        collection_id,
        stripe_session_id,
        created_at,
        status,
        is_active,
        amount_paid
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentPurchases && recentPurchases.length > 0) {
      console.log('✅ Found recent purchases:', recentPurchases.length);
      return NextResponse.json({ purchases: recentPurchases, success: true });
    }

    return NextResponse.json({ error: 'No purchases found' }, { status: 404 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
} 