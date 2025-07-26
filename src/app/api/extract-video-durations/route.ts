import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExtractionResult {
  id: string;
  title: string;
  success: boolean;
  error?: string;
  estimatedDuration?: number;
}

export async function POST(request: NextRequest) {
  try {
    // First check if video_duration column exists
    const { data: testData, error: testError } = await supabase
      .from('Collection')
      .select('video_duration')
      .limit(1);

    if (testError && testError.message.includes('column "video_duration" does not exist')) {
      return NextResponse.json({ 
        success: false,
        error: 'video_duration column does not exist. Please run the database migration first.',
        instructions: 'Run the SQL in add-video-duration-field.sql file in your Supabase SQL editor'
      });
    }

    // Get all collections that don't have video_duration set or have default values
    const { data: collections, error: fetchError } = await supabase
      .from('Collection')
      .select('id, title, video_path, video_duration')
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
        message: 'No collections need video duration extraction'
      });
    }

    const results: ExtractionResult[] = [];
    
    for (const collection of collections) {
      try {
        // Skip if no video_path
        if (!collection.video_path) {
          results.push({
            id: collection.id,
            title: collection.title,
            success: false,
            error: 'No video path found'
          });
          continue;
        }

        // Get signed URL for the video
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('media')
          .createSignedUrl(collection.video_path, 60); // 60 seconds expiry

        if (urlError || !signedUrlData?.signedUrl) {
          console.warn(`Could not get signed URL for ${collection.title}:`, urlError);
          results.push({
            id: collection.id,
            title: collection.title,
            success: false,
            error: 'Could not get video URL'
          });
          continue;
        }

        // Extract duration using a head request to get metadata
        const response = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`Could not access video for ${collection.title}`);
          results.push({
            id: collection.id,
            title: collection.title,
            success: false,
            error: 'Could not access video'
          });
          continue;
        }

        // For now, we'll use a reasonable estimate based on file size
        // In a production environment, you'd want to use a proper video processing service
        // like AWS MediaConvert, FFmpeg, or similar
        const contentLength = response.headers.get('content-length');
        const fileSize = contentLength ? parseInt(contentLength) : 0;
        
        // Rough estimate: 1MB per minute for typical video compression
        const estimatedDuration = Math.max(60, Math.round(fileSize / (1024 * 1024) * 60));
        
        // Update the collection with the estimated duration
        const { error: updateError } = await supabase
          .from('Collection')
          .update({ video_duration: estimatedDuration })
          .eq('id', collection.id);

        if (updateError) {
          console.warn(`Could not update ${collection.title}:`, updateError);
          results.push({
            id: collection.id,
            title: collection.title,
            success: false,
            error: updateError.message
          });
        } else {
          results.push({
            id: collection.id,
            title: collection.title,
            success: true,
            estimatedDuration
          });
        }

      } catch (error) {
        console.error(`Error processing ${collection.title}:`, error);
        results.push({
          id: collection.id,
          title: collection.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      results,
      totalProcessed: collections.length,
      successful: results.filter(r => r.success).length
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Video duration extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 