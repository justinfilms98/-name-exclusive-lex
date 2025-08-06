import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  try {
    const { userId, collectionId } = await request.json();

    if (!userId || !collectionId) {
      return NextResponse.json({ error: 'Missing userId or collectionId' }, { status: 400 });
    }

    console.log(`🔍 Checking access for user: ${userId}, collection: ${collectionId}`);

    // Check for active purchases
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('collection_id', collectionId)
      .eq('is_active', true)
      .eq('status', 'completed');

    if (error) {
      console.error('Access check error:', error);
      return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      console.log('No access found for user:', userId, 'collection:', collectionId);
      return NextResponse.json({ hasAccess: false, purchases: [] });
    }

    console.log('Access granted for user:', userId, 'purchases:', purchases.length);
    return NextResponse.json({ hasAccess: true, purchases });

  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
} 