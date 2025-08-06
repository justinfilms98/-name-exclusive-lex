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
    console.log(`🔍 User ID type: ${typeof userId}, length: ${userId?.length}`);
    console.log(`🔍 Collection ID type: ${typeof collectionId}, length: ${collectionId?.length}`);

    // Method 1: Check for active completed purchases
    let { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        *,
        collections (
          id,
          title,
          description,
          price,
          media_filename,
          video_path,
          thumbnail_path,
          photo_paths
        )
      `)
      .eq('user_id', userId)
      .eq('collection_id', collectionId)
      .eq('is_active', true)
      .eq('status', 'completed');

    if (error) {
      console.error('Access check error:', error);
      return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
    }

    console.log(`🔍 Method 1 results: ${purchases?.length || 0} completed purchases found`);

    // Method 2: If no completed purchases, check for any active purchases (including pending)
    if (!purchases || purchases.length === 0) {
      console.log('No completed purchases found, checking for any active purchases...');
      const { data: anyPurchases, error: anyError } = await supabase
        .from('purchases')
        .select(`
          *,
          collections (
            id,
            title,
            description,
            price,
            media_filename,
            video_path,
            thumbnail_path,
            photo_paths
          )
        `)
        .eq('user_id', userId)
        .eq('collection_id', collectionId)
        .eq('is_active', true);

      if (anyError) {
        console.error('Any purchases check error:', anyError);
      } else if (anyPurchases && anyPurchases.length > 0) {
        console.log('Found active purchases (not completed):', anyPurchases.length);
        purchases = anyPurchases;
      }
    }

    // Method 3: If still no purchases, check for recent purchases for this user (last 30 minutes)
    if (!purchases || purchases.length === 0) {
      console.log('No active purchases found, checking for recent purchases...');
      const { data: recentPurchases, error: recentError } = await supabase
        .from('purchases')
        .select(`
          *,
          collections (
            id,
            title,
            description,
            price,
            media_filename,
            video_path,
            thumbnail_path,
            photo_paths
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Recent purchases check error:', recentError);
      } else if (recentPurchases && recentPurchases.length > 0) {
        console.log('Found recent purchases:', recentPurchases.length);
        purchases = recentPurchases;
      }
    }

    // Method 4: If still no purchases, check for ANY purchases for this collection (debugging)
    if (!purchases || purchases.length === 0) {
      console.log('No user-specific purchases found, checking for any purchases for this collection...');
      const { data: anyCollectionPurchases, error: anyCollectionError } = await supabase
        .from('purchases')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('is_active', true)
        .limit(1);

      if (anyCollectionError) {
        console.error('Any collection purchases check error:', anyCollectionError);
      } else if (anyCollectionPurchases && anyCollectionPurchases.length > 0) {
        console.log('Found purchases for this collection (but not for this user):', anyCollectionPurchases.length);
        // Don't grant access, but log for debugging
      }
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