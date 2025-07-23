import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Add photo_paths column to collections table
    const { error: photoPathsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "photo_paths" TEXT[] DEFAULT \'{}\';'
    });

    // Add other missing columns
    const { error: videoPathError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "video_path" TEXT;'
    });

    const { error: thumbnailPathError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "thumbnail_path" TEXT;'
    });

    const { error: priceError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "price" INTEGER DEFAULT 0;'
    });

    const { error: durationError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 0;'
    });

    return NextResponse.json({ 
      success: true,
      errors: {
        photoPaths: photoPathsError?.message,
        videoPath: videoPathError?.message,
        thumbnailPath: thumbnailPathError?.message,
        price: priceError?.message,
        duration: durationError?.message
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 