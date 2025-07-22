import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const videoId = searchParams.get('video_id')

  if (!sessionId || !videoId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Verify purchase
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .eq('collection_video_id', videoId)
    .single()

  if (error || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  // Check if access has expired
  if (new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  // Get video URL from Supabase storage
  const { data: videoData } = await supabase
    .from('CollectionVideo')
    .select('videoUrl')
    .eq('id', videoId)
    .single()

  if (!videoData?.videoUrl) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Create response with security headers
  const response = NextResponse.json({ 
    videoUrl: videoData.videoUrl,
    expiresAt: purchase.expires_at
  })

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
} 