import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max requests per minute per IP

function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const realIP = headers.get('x-real-ip')
  const cfConnectingIP = headers.get('cf-connecting-ip')
  
  return forwarded?.split(',')[0] || 
         realIP || 
         cfConnectingIP || 
         'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  record.count++
  return true
}

export async function GET(request: Request) {
  console.log('🔍 DEBUG: Protected video API called');
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const collectionId = searchParams.get('collection_id')
  console.log('🔍 DEBUG: Session ID received:', sessionId);
  console.log('🔍 DEBUG: Collection ID received:', collectionId);

  if (!sessionId) {
    console.log('🔍 DEBUG: Missing session_id parameter');
    return NextResponse.json({ error: 'Missing session_id parameter' }, { status: 400 })
  }

  const headersList = await headers()
  const clientIP = getClientIP(headersList)

  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ 
      error: 'Rate limit exceeded. Too many requests from this IP.' 
    }, { status: 429 })
  }

  // Verify purchase (permanent access) - try multiple approaches
  let purchase: unknown = null;
  let error: unknown = null;

  console.log('🔍 DEBUG: Starting purchase verification for session:', sessionId);

  // First try: exact session_id and collection_id match (if collection_id provided)
  if (collectionId) {
    console.log('🔍 DEBUG: Trying exact session_id and collection_id match for:', sessionId, collectionId);
    const { data: exactMatch, error: exactError } = await supabase
      .from('purchases')
      .select('id, user_id, collection_id, stripe_session_id, created_at, amount_paid')
      .eq('stripe_session_id', sessionId)
      .eq('collection_id', collectionId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('🔍 DEBUG: Exact match result:', exactMatch);
    console.log('🔍 DEBUG: Exact match error:', exactError);

    if (exactMatch && !exactError) {
      purchase = exactMatch;
      console.log('🔍 DEBUG: Using exact match purchase:', purchase);
    } else if (exactError) {
      console.error('🔍 DEBUG: Database error during exact match lookup:', exactError);
      error = exactError;
    }
  }

  // If no exact match found or no collection_id provided, try session_id only
  if (!purchase && !error) {
    console.log('🔍 DEBUG: Trying session_id only match for:', sessionId);
    const { data: exactMatches, error: exactError } = await supabase
      .from('purchases')
      .select('id, user_id, collection_id, stripe_session_id, created_at, amount_paid')
      .eq('stripe_session_id', sessionId)
      .eq('is_active', true);

    console.log('🔍 DEBUG: Session matches results:', exactMatches);
    console.log('🔍 DEBUG: Session matches error:', exactError);

    if (exactError) {
      console.error('🔍 DEBUG: Database error during session match lookup:', exactError);
      error = exactError;
    } else if (exactMatches && exactMatches.length > 0) {
      // If multiple purchases found, we need to determine which one to use
      if (collectionId) {
        // Try to find the specific collection
        const specificPurchase = exactMatches.find(p => p.collection_id === collectionId);
        if (specificPurchase) {
          purchase = specificPurchase;
          console.log('🔍 DEBUG: Using specific collection purchase:', purchase);
        } else {
          console.log('🔍 DEBUG: Collection not found in session purchases');
          error = new Error('Collection not found in session purchases');
        }
      } else {
        // Use the first one (most recent)
        purchase = exactMatches[0];
        console.log('🔍 DEBUG: Using first purchase from session matches:', purchase);
      }
    } else {
      // If no exact match found, return error
      console.log('🔍 DEBUG: No exact match found for session:', sessionId);
      error = new Error('Purchase not found for this session');
    }
  }

  if (error) {
    console.error('🔍 DEBUG: Database error during purchase lookup:', error);
    return NextResponse.json({ error: 'Purchase not found for this session' }, { status: 404 })
  }

  if (!purchase) {
    console.error('🔍 DEBUG: No purchase found for session:', sessionId);
    return NextResponse.json({ error: 'Purchase not found or inactive' }, { status: 404 })
  }

  console.log('🔍 DEBUG: Purchase found:', purchase);

  // Get collection data to get video URL
  console.log('🔍 DEBUG: Getting collection data for ID:', purchase.collection_id);
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('video_path, media_filename, thumbnail_path, photo_paths')
    .eq('id', purchase.collection_id)
    .single()

  console.log('🔍 DEBUG: Collection data result:', collection);
  console.log('🔍 DEBUG: Collection error:', collectionError);

  if (collectionError) {
    console.error('🔍 DEBUG: Collection error:', collectionError);
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  if (!collection) {
    console.error('🔍 DEBUG: Collection not found for ID:', purchase.collection_id);
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  if (!collection.video_path && !collection.media_filename) {
    console.error('🔍 DEBUG: No video path or media_filename found in collection:', collection);
    return NextResponse.json({ error: 'Video not found in collection' }, { status: 404 })
  }

  console.log('🔍 DEBUG: Video path from collection:', collection.video_path);
  console.log('🔍 DEBUG: Media filename from collection:', collection.media_filename);

  // Generate signed URL for the video
  let signedUrl: string;
  try {
    // ✅ Try both paths systematically - start with media_filename, then video_path
    let filePath: string | null = null;
    let signedUrlData: { signedUrl: string } | null = null;
    let _signedUrlError: unknown = null;
    
    // First try: media_filename (if it exists)
    if (collection.media_filename) {
      console.log('🔍 DEBUG: Trying media_filename first:', collection.media_filename);
      const { data: mediaFilenameData, error: mediaFilenameError } = await supabase.storage
        .from('media')
        .createSignedUrl(collection.media_filename, 3600);
      
      if (!mediaFilenameError && mediaFilenameData?.signedUrl) {
        signedUrlData = mediaFilenameData;
        filePath = collection.media_filename;
        console.log('🔍 DEBUG: media_filename worked:', collection.media_filename);
      } else {
        console.log('🔍 DEBUG: media_filename failed:', collection.media_filename, mediaFilenameError);
        _signedUrlError = mediaFilenameError;
      }
    }
    
    // Second try: video_path (if media_filename failed or doesn't exist)
    if (!signedUrlData && collection.video_path) {
      console.log('🔍 DEBUG: Trying video_path:', collection.video_path);
      const { data: videoPathData, error: videoPathError } = await supabase.storage
        .from('media')
        .createSignedUrl(collection.video_path, 3600);
      
      if (!videoPathError && videoPathData?.signedUrl) {
        signedUrlData = videoPathData;
        filePath = collection.video_path;
        console.log('🔍 DEBUG: video_path worked:', collection.video_path);
      } else {
        console.log('🔍 DEBUG: video_path failed:', collection.video_path, videoPathError);
        _signedUrlError = videoPathError;
      }
    }
    
    // If both paths failed, try directory scanning
    if (!signedUrlData) {
      console.log('🔍 DEBUG: Both paths failed, trying directory scanning');
      
      // Try to list files in both possible directories
      const possibleDirs: string[] = [];
      if (collection.media_filename) {
        possibleDirs.push(collection.media_filename.split('/').slice(0, -1).join('/'));
      }
      if (collection.video_path) {
        possibleDirs.push(collection.video_path.split('/').slice(0, -1).join('/'));
      }
      
      // Remove duplicates
      const uniqueDirs = Array.from(new Set(possibleDirs));
      
      for (const dir of uniqueDirs) {
        if (!dir) continue;
        console.log('🔍 DEBUG: Scanning directory:', dir);
        const { data: directoryFiles, error: listError } = await supabase.storage
          .from('media')
          .list(dir);
        
        if (listError) {
          console.error('🔍 DEBUG: Error listing directory:', dir, listError);
          continue;
        }
        
        console.log('🔍 DEBUG: Files in directory:', dir, directoryFiles?.map(f => f.name));
        
        if (directoryFiles && directoryFiles.length > 0) {
          // Look for video files
          const videoFiles = directoryFiles.filter(f => 
            f.name.toLowerCase().includes('video') || 
            f.name.toLowerCase().endsWith('.mp4') || 
            f.name.toLowerCase().endsWith('.mov') ||
            f.name.toLowerCase().endsWith('.avi') ||
            f.name.toLowerCase().endsWith('.mkv') ||
            f.name.toLowerCase().endsWith('.webm')
          );
          
          if (videoFiles.length > 0) {
            // Try each video file
            for (const videoFile of videoFiles) {
              const alternativePath = `${dir}/${videoFile.name}`;
              console.log('🔍 DEBUG: Trying alternative path:', alternativePath);
              
              const { data: altSignedUrlData, error: altSignedUrlError } = await supabase.storage
                .from('media')
                .createSignedUrl(alternativePath, 3600);
              
              if (!altSignedUrlError && altSignedUrlData?.signedUrl) {
                signedUrlData = altSignedUrlData;
                filePath = alternativePath;
                console.log('🔍 DEBUG: Alternative path worked:', alternativePath);
                break;
              }
            }
            
            if (signedUrlData) break;
          }
        }
      }
    }
    
    if (!signedUrlData) {
      console.error('🔍 DEBUG: All attempts to find video file failed');
      return NextResponse.json({ error: 'Video file not found in any expected location' }, { status: 404 });
    }

    signedUrl = signedUrlData.signedUrl;
    console.log('🔍 DEBUG: Generated signed URL successfully for path:', filePath);
  } catch (urlError) {
    console.error('🔍 DEBUG: Error generating signed URL:', urlError);
    return NextResponse.json({ error: `Failed to generate video URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}` }, { status: 500 });
  }

  // Create response with security headers
  const response = NextResponse.json({ 
    videoUrl: signedUrl
  })

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT_MAX_REQUESTS - (rateLimitStore.get(clientIP)?.count || 0)).toString())

  return response
} 