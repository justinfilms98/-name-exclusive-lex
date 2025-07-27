import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // First, let's check if the video_duration column already exists
    // by trying to select it from a collection
    const { data: testData, error: testError } = await supabase
      .from('collections')
      .select('video_duration')
      .limit(1);

    if (testError && testError.message.includes('column "video_duration" does not exist')) {
      // The column doesn't exist, we need to add it
      // Since we can't use ALTER TABLE directly, we'll handle this differently
      return NextResponse.json({ 
        success: false,
        error: 'video_duration column does not exist. Please run the SQL migration manually.',
        instructions: 'Run the SQL in manual-migration.sql file in your Supabase SQL editor'
      });
    }

    // If we get here, the column exists, so let's update existing records
    const { data: collections, error: fetchError } = await supabase
      .from('collections')
      .select('id, video_duration')
      .or('video_duration.is.null,video_duration.eq.300');

    if (fetchError) {
      return NextResponse.json({ 
        success: false,
        error: `Failed to fetch collections: ${fetchError.message}`
      });
    }

    if (!collections || collections.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No collections need video_duration updates'
      });
    }

    // Update collections that have null or default video_duration
    const updatePromises = collections.map(collection => 
      supabase
        .from('collections')
        .update({ video_duration: 300 }) // Default to 5 minutes
        .eq('id', collection.id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error).map(result => result.error?.message);
    const successful = results.filter(result => !result.error).length;

    return NextResponse.json({ 
      success: true,
      message: `Updated ${successful} collections with default video duration`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 