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
  try {
    const body = await request.json();
    const { userId, collectionIds } = body;

    if (!userId || !collectionIds || !Array.isArray(collectionIds)) {
      return NextResponse.json(
        { error: 'userId and collectionIds array are required' },
        { status: 400 }
      );
    }

    console.log(`Testing multiple purchases for user ${userId} with collections:`, collectionIds);

    // Create a mock Stripe session object
    const mockSession = {
      id: `test_session_${Date.now()}`,
      metadata: {
        user_id: userId,
        collection_ids: JSON.stringify(collectionIds),
        collection_count: collectionIds.length.toString(),
      },
      amount_total: collectionIds.length * 1000, // $10 per collection
    } as Stripe.Checkout.Session;

    // Process the mock session
    await processMultipleCollections(mockSession);

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${collectionIds.length} collections for user ${userId}` 
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}

async function processMultipleCollections(session: Stripe.Checkout.Session) {
  const { user_id, collection_ids, collection_count } = session.metadata || {};
  
  if (!user_id || !collection_ids || !collection_count) {
    throw new Error('Missing required metadata');
  }

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
      amount_paid: amountPaid
    });

  if (error) {
    console.error('Failed to create purchase record:', error);
    throw error;
  }

  console.log(`New purchase created for user ${userId}, collection ${collectionId}`);
} 