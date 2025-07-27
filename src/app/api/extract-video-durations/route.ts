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

// Helper function to extract video duration from video URL
async function getVideoDuration(videoUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Create a temporary video element to get duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      resolve(duration);
    };
    
    video.onerror = () => {
      reject(new Error('Could not load video metadata'));
    };
    
    video.src = videoUrl;
  });
}

export async function POST(request: NextRequest) {
  try {
    // First check if video_duration column exists
    const { data: testData, error: testError } = await supabase
      .from('collections')
      .select('video_duration')
      .limit(1);

    if (testError && testError.message.includes('column "video_duration" does not exist')) {
      return NextResponse.json({ 
        success: false,
        error: 'video_duration column does not exist. Please run the database migration first.',
        instructions: 'Run the SQL in manual-migration.sql file in your Supabase SQL editor'
      });
    }

    // Get all collections that don't have video_duration set or have default values
    const { data: collections, error: fetchError } = await supabase
      .from('collections')
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

        // For server-side extraction, we'll use a more conservative estimate
        // based on file size but with better heuristics
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

        const contentLength = response.headers.get('content-length');
        const fileSize = contentLength ? parseInt(contentLength) : 0;
        
        // Better estimation based on typical video compression ratios
        // For web-optimized videos, we can estimate more accurately
        let estimatedDuration: number;
        
        if (fileSize > 0) {
          // More conservative estimate: 2MB per minute for typical web video
          estimatedDuration = Math.max(30, Math.round(fileSize / (2 * 1024 * 1024) * 60));
          
          // Cap at reasonable maximum (e.g., 10 minutes) unless file is very large
          if (estimatedDuration > 600 && fileSize < 100 * 1024 * 1024) { // Less than 100MB
            estimatedDuration = 300; // Default to 5 minutes for smaller files
          }
        } else {
          estimatedDuration = 300; // Default 5 minutes if we can't get file size
        }
        
        // Update the collection with the estimated duration
        const { error: updateError } = await supabase
          .from('collections')
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