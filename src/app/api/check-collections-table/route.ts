import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check if collections table exists and get its structure
    const { data: collections, error: collectionsError } = await supabase
      .from('Collection')
      .select('*')
      .limit(1);

    // Also check if there's a 'collections' table (lowercase)
    const { data: collectionsLower, error: collectionsLowerError } = await supabase
      .from('collections')
      .select('*')
      .limit(1);

    return NextResponse.json({ 
      collectionTable: {
        exists: !collectionsError,
        error: collectionsError?.message,
        sampleData: collections?.[0]
      },
      collectionsLowerTable: {
        exists: !collectionsLowerError,
        error: collectionsLowerError?.message,
        sampleData: collectionsLower?.[0]
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check table structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 