import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    const userId = searchParams.get('userId');

    if (!collectionId) {
      return NextResponse.json({ 
        hasAccess: false, 
        error: 'Missing collectionId parameter' 
      }, { status: 400 });
    }

    console.log(`🔍 GET /api/access/check - collectionId: ${collectionId}, userId: ${userId || 'not provided'}`);

    // If userId provided, check specific user access
    if (userId) {
      const { data: purchases, error } = await supabase
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
            media_filename,
            video_path,
            thumbnail_path,
            photo_paths
          )
        `)
        .eq('user_id', userId)
        .eq('collection_id', collectionId)
        .eq('is_active', true)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) {
        console.error('Access check error:', error);
        return NextResponse.json({ 
          hasAccess: false, 
          error: 'Failed to check access' 
        }, { status: 500 });
      }

      if (purchases) {
        console.log(`✅ Access granted for user ${userId}, collection ${collectionId}`);
        return NextResponse.json({ 
          hasAccess: true, 
          purchase: purchases,
          collection: purchases.collections
        });
      }
    } else {
      // Check for any active purchases for this collection (for debugging)
      const { data: purchases, error } = await supabase
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
        .eq('collection_id', collectionId)
        .eq('is_active', true)
        .eq('status', 'completed')
        .limit(1);

      if (error) {
        console.error('Access check error:', error);
        return NextResponse.json({ 
          hasAccess: false, 
          error: 'Failed to check access' 
        }, { status: 500 });
      }

      if (purchases && purchases.length > 0) {
        console.log(`⚠️ Collection ${collectionId} has purchases but userId not provided`);
        return NextResponse.json({ 
          hasAccess: false, 
          error: 'User ID required to verify access' 
        }, { status: 400 });
      }
    }

    console.log(`❌ No access found for collection ${collectionId}`);
    return NextResponse.json({ 
      hasAccess: false 
    });

  } catch (error: any) {
    console.error('Access check error:', error);
    return NextResponse.json({ 
      hasAccess: false, 
      error: error.message || 'Failed to check access' 
    }, { status: 500 });
  }
}

