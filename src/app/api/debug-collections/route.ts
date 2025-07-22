import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all collection videos
    const { data: collectionVideos, error } = await supabase
      .from('CollectionVideo')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch collection videos',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      collectionVideos,
      count: collectionVideos?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 