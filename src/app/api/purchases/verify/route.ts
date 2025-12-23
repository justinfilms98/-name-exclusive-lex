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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing session_id parameter' }, { status: 400 });
    }

    console.log(`🔍 GET /api/purchases/verify - Verifying session: ${sessionId}`);

    // Validate Stripe session
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!stripeSession) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Stripe session not found' 
        }, { status: 404 });
      }

      if (stripeSession.payment_status !== 'paid') {
        return NextResponse.json({ 
          ok: false, 
          error: `Payment status is ${stripeSession.payment_status}, expected 'paid'` 
        }, { status: 400 });
      }

      console.log('✅ Stripe session validated - payment_status: paid');
    } catch (stripeError: any) {
      console.error('Stripe session retrieval error:', stripeError);
      return NextResponse.json({ 
        ok: false, 
        error: `Failed to validate Stripe session: ${stripeError.message}` 
      }, { status: 500 });
    }

    // Get user ID from session metadata or customer email
    const userId = stripeSession.metadata?.user_id;
    const customerEmail = stripeSession.customer_email || (typeof stripeSession.customer === 'string' ? null : stripeSession.customer?.email);

    if (!userId && !customerEmail) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Cannot identify user from session' 
      }, { status: 400 });
    }

    // If we have email but no userId, try to find user by email from auth
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
      try {
        // Try to find user in auth.users
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.find(u => u.email === customerEmail);
        if (authUser) {
          finalUserId = authUser.id;
          console.log(`✅ Found user by email: ${customerEmail} -> ${finalUserId}`);
        }
      } catch (authError) {
        console.warn('Could not query auth users:', authError);
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log(`✅ User identified: ${finalUserId}`);

    // Get collection IDs from line items or session metadata
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

    // Fallback to session metadata
    if (collectionIds.length === 0 && stripeSession.metadata?.collection_ids) {
      try {
        const sessionCollectionIds = JSON.parse(stripeSession.metadata.collection_ids);
        if (Array.isArray(sessionCollectionIds)) {
          collectionIds.push(...sessionCollectionIds);
        }
      } catch (e) {
        console.error('Error parsing collection_ids from session metadata:', e);
      }
    }

    if (collectionIds.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No collection IDs found in session' 
      }, { status: 400 });
    }

    console.log(`✅ Found ${collectionIds.length} collection IDs:`, collectionIds);

    // Check for existing purchases or create them
    const purchases: any[] = [];
    const accessRecords: any[] = [];

    for (const collectionId of collectionIds) {
      // Check if purchase exists
      const { data: existingPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          id,
          user_id,
          collection_id,
          stripe_session_id,
          created_at,
          status,
          is_active,
          amount_paid,
          collections (
            id,
            title,
            description,
            price,
            thumbnail_path,
            media_filename,
            video_path,
            photo_paths
          )
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', finalUserId)
        .eq('collection_id', collectionId)
        .maybeSingle();

      if (existingPurchase && !purchaseError) {
        console.log(`✅ Purchase exists for collection ${collectionId}`);
        purchases.push(existingPurchase);
        accessRecords.push({
          collectionId: collectionId,
          hasAccess: true,
          purchase: existingPurchase
        });
      } else {
        // Create purchase record
        const { data: collection } = await supabase
          .from('collections')
          .select('price, title, description, thumbnail_path, media_filename, video_path, photo_paths')
          .eq('id', collectionId)
          .single();

        if (!collection) {
          console.warn(`⚠️ Collection ${collectionId} not found, skipping`);
          continue;
        }

        const { data: newPurchase, error: createError } = await supabase
          .from('purchases')
          .insert({
            user_id: finalUserId,
            collection_id: collectionId,
            stripe_session_id: sessionId,
            amount_paid: collection.price ? collection.price / 100 : 0,
            currency: 'usd',
            status: 'completed',
            is_active: true,
            created_at: new Date().toISOString(),
          })
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
          .single();

        if (createError || !newPurchase) {
          console.error(`❌ Failed to create purchase for collection ${collectionId}:`, createError);
          continue;
        }

        console.log(`✅ Created purchase record for collection ${collectionId}`);
        purchases.push({
          ...newPurchase,
          collections: collection
        });
        accessRecords.push({
          collectionId: collectionId,
          hasAccess: true,
          purchase: newPurchase
        });
      }
    }

    if (purchases.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to create or retrieve purchase records' 
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      ok: true,
      access: accessRecords,
      collection: purchases.length === 1 ? purchases[0].collections : null,
      collections: purchases.map(p => p.collections),
      purchases: purchases
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
}

