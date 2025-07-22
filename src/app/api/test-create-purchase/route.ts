import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, collectionId, duration } = body;

    if (!sessionId || !userId || !collectionId || !duration) {
      return NextResponse.json({ 
        error: 'Missing required fields: sessionId, userId, collectionId, duration' 
      }, { status: 400 });
    }

    // Calculate expiration time
    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt.getTime() + parseInt(duration) * 1000);

    // Create purchase record using all required fields from the database schema
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        collection_video_id: collectionId,
        collection_id: collectionId, // Also need this field
        stripe_session_id: sessionId,
        created_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid: 29.99, // Default amount for testing
        amount: 2999, // Amount in cents
        currency: 'usd',
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test purchase:', error);
      return NextResponse.json({ 
        error: 'Failed to create purchase',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      purchase,
      message: 'Test purchase created successfully' 
    });

  } catch (error) {
    console.error('Test create purchase error:', error);
    return NextResponse.json({ 
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 