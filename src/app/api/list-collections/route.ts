import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(_request: NextRequest) {
  try {
    // Get all collections
    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, title, photo_paths')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch collections',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      collections: collections?.map(c => ({
        id: c.id,
        title: c.title,
        photo_paths: c.photo_paths,
        photo_paths_type: typeof c.photo_paths,
        photo_paths_length: Array.isArray(c.photo_paths) ? c.photo_paths.length : 'not array'
      })),
      count: collections?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to list collections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 