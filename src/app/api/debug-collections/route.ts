import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all collections with photo_paths
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch collections',
        details: error.message 
      }, { status: 500 });
    }

    // Also get collection videos for comparison
    const { data: collectionVideos, error: cvError } = await supabase
      .from('CollectionVideo')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(5);

    return NextResponse.json({ 
      collections: collections?.map(c => ({
        id: c.id,
        title: c.title,
        photo_paths: c.photo_paths,
        photo_paths_type: typeof c.photo_paths,
        photo_paths_length: Array.isArray(c.photo_paths) ? c.photo_paths.length : 'not array',
        created_at: c.created_at
      })),
      collectionVideos: collectionVideos?.map(cv => ({
        id: cv.id,
        title: cv.title,
        video_path: cv.video_path,
        created_at: cv.createdAt
      })),
      counts: {
        collections: collections?.length || 0,
        collectionVideos: collectionVideos?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 