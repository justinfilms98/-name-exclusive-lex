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
  console.log('🔍 DEBUG: Session ID received:', sessionId);

  if (!sessionId) {
    console.log('🔍 DEBUG: Missing session_id parameter');
    return NextResponse.json({ error: 'Missing session_id parameter' }, { status: 400 })
  }

  const headersList = await headers()
  const clientIP = getClientIP(headersList)
  const userAgent = headersList.get('user-agent') || 'unknown'

  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json({ 
      error: 'Rate limit exceeded. Too many requests from this IP.' 
    }, { status: 429 })
  }

  // Verify purchase (permanent access) - try multiple approaches
  let purchase: any = null;
  let error: any = null;

  console.log('🔍 DEBUG: Starting purchase verification for session:', sessionId);

  // First try: exact session_id match
  console.log('🔍 DEBUG: Trying exact session_id match for:', sessionId);
  const { data: exactMatch, error: exactError } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id, stripe_session_id, created_at, amount_paid')
    .eq('stripe_session_id', sessionId)
    .eq('is_active', true)
    .maybeSingle()

  console.log('🔍 DEBUG: Exact match result:', exactMatch);
  console.log('🔍 DEBUG: Exact match error:', exactError);

  if (exactMatch && !exactError) {
    purchase = exactMatch;
    console.log('🔍 DEBUG: Using exact match purchase:', purchase);
  } else {
    // Second try: find any active purchase for this session (in case session_id is null)
    console.log('🔍 DEBUG: Trying fallback - any active purchase');
    const { data: anyActive, error: anyError } = await supabase
      .from('purchases')
      .select('id, user_id, collection_id, stripe_session_id, created_at, amount_paid')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('🔍 DEBUG: Any active result:', anyActive);
    console.log('🔍 DEBUG: Any active error:', anyError);

    if (anyActive && !anyError) {
      purchase = anyActive;
      console.log('🔍 DEBUG: Using fallback purchase:', purchase);
    } else {
      error = anyError || exactError;
      console.log('🔍 DEBUG: Both attempts failed, error:', error);
    }
  }

  if (error) {
    console.error('🔍 DEBUG: Database error during purchase lookup:', error);
    return NextResponse.json({ error: 'Database error during purchase lookup' }, { status: 500 })
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
    .select('video_path, media_filename')
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
    // ✅ Use media_filename if available, otherwise fall back to video_path
    let filePath = collection.media_filename || collection.video_path;
    console.log('🔍 DEBUG: Using file path for signed URL:', filePath);
    
    if (!filePath) {
      console.error('🔍 DEBUG: No file path available for signed URL generation');
      return NextResponse.json({ error: 'No video file path available' }, { status: 500 });
    }
    
    // Try to list files in the collection directory to see what's available
    const collectionDir = filePath.split('/').slice(0, -1).join('/'); // Get directory path
    console.log('🔍 DEBUG: Checking collection directory:', collectionDir);
    
    const { data: directoryFiles, error: listError } = await supabase.storage
      .from('media')
      .list(collectionDir);
    
    if (listError) {
      console.error('🔍 DEBUG: Error listing directory:', listError);
    } else {
      console.log('🔍 DEBUG: Files in directory:', directoryFiles?.map(f => f.name));
    }
    
    // Try to generate signed URL with the original path
    let { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('media')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    // If the first attempt fails, try alternative paths
    if (signedUrlError && directoryFiles && directoryFiles.length > 0) {
      console.log('🔍 DEBUG: First attempt failed, trying alternative paths');
      
      // Look for video files in the directory
      const videoFiles = directoryFiles.filter(f => 
        f.name.toLowerCase().includes('video') || 
        f.name.toLowerCase().endsWith('.mp4') || 
        f.name.toLowerCase().endsWith('.mov') ||
        f.name.toLowerCase().endsWith('.avi')
      );
      
      if (videoFiles.length > 0) {
        const alternativePath = `${collectionDir}/${videoFiles[0].name}`;
        console.log('🔍 DEBUG: Trying alternative path:', alternativePath);
        
        const { data: altSignedUrlData, error: altSignedUrlError } = await supabase.storage
          .from('media')
          .createSignedUrl(alternativePath, 3600);
        
        if (!altSignedUrlError && altSignedUrlData?.signedUrl) {
          signedUrlData = altSignedUrlData;
          signedUrlError = null;
          filePath = alternativePath;
          console.log('🔍 DEBUG: Alternative path worked:', alternativePath);
        }
      }
    }

    if (signedUrlError) {
      console.error('🔍 DEBUG: Failed to generate signed URL:', signedUrlError);
      console.error('🔍 DEBUG: File path attempted:', filePath);
      return NextResponse.json({ error: `Failed to generate video URL: ${signedUrlError.message}` }, { status: 500 });
    }

    if (!signedUrlData?.signedUrl) {
      console.error('🔍 DEBUG: No signed URL returned from Supabase');
      return NextResponse.json({ error: 'Failed to generate video URL: No signed URL returned' }, { status: 500 });
    }

    signedUrl = signedUrlData.signedUrl;
    console.log('🔍 DEBUG: Generated signed URL successfully');
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