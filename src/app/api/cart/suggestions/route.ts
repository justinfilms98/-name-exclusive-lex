import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartIds = [] } = body;

    if (!Array.isArray(cartIds)) {
      return NextResponse.json(
        { error: 'cartIds must be an array' },
        { status: 400 }
      );
    }

    // Build query - exclude items in cart
    let query = supabase
      .from('collections')
      .select(`
        id,
        title,
        description,
        price,
        thumbnail_path,
        video_path,
        video_duration,
        photo_paths,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20); // Get more than needed, then filter

    const { data: collections, error } = await query;
    
    // Filter out cart items client-side (more reliable than Supabase .not() with arrays)
    let filteredCollections = collections || [];
    if (cartIds.length > 0) {
      filteredCollections = filteredCollections.filter(
        (collection: any) => !cartIds.includes(collection.id)
      );
    }
    
    // Limit to 6 after filtering
    filteredCollections = filteredCollections.slice(0, 6);

    if (error) {
      console.error('Error fetching suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suggestions', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to include computed fields
    const suggestions = filteredCollections.map((collection: any) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      price: collection.price,
      thumbnail_path: collection.thumbnail_path,
      video_path: collection.video_path,
      video_duration: collection.video_duration || 0,
      photo_count: Array.isArray(collection.photo_paths) ? collection.photo_paths.length : 0,
      has_video: !!collection.video_path,
      created_at: collection.created_at,
    }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Error in suggestions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
