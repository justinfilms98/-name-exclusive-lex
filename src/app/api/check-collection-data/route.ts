import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const collectionId = url.searchParams.get('id');
    
    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID required' }, { status: 400 });
    }

    // Get the specific collection
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch collection',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      collection,
      photo_paths: collection?.photo_paths,
      photo_paths_type: typeof collection?.photo_paths,
      photo_paths_length: Array.isArray(collection?.photo_paths) ? collection.photo_paths.length : 'not array',
      has_photo_paths: !!collection?.photo_paths,
      all_keys: Object.keys(collection || {})
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check collection data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 