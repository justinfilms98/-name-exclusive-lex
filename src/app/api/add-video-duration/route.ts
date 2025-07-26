import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Add video_duration column to collections table
    const { error: videoDurationError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "video_duration" INTEGER;'
    });

    // Update existing collections to have a default video duration
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: 'UPDATE "Collection" SET "video_duration" = 300 WHERE "video_duration" IS NULL;'
    });

    // Make the field required after setting defaults
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ALTER COLUMN "video_duration" SET NOT NULL;'
    });

    // Add comment to clarify the difference
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: 'COMMENT ON COLUMN "Collection"."duration" IS \'Access duration in seconds (how long user has to watch)\';'
    });

    const { error: comment2Error } = await supabase.rpc('exec_sql', {
      sql: 'COMMENT ON COLUMN "Collection"."video_duration" IS \'Actual video length in seconds\';'
    });

    return NextResponse.json({ 
      success: true,
      errors: {
        videoDuration: videoDurationError?.message,
        update: updateError?.message,
        notNull: notNullError?.message,
        comment: commentError?.message,
        comment2: comment2Error?.message
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 