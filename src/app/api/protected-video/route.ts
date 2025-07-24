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
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
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

  // Verify purchase
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id, stripe_session_id, created_at, expires_at, strike_count, bound_ip, last_access_at, access_count')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  // Check if access has expired
  if (new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  // IP binding check
  if (purchase.bound_ip && purchase.bound_ip !== clientIP) {
    // Log suspicious activity
    await supabase
      .from('security_logs')
      .insert({
        purchase_id: purchase.id,
        event_type: 'ip_mismatch',
        ip_address: clientIP,
        user_agent: userAgent,
        original_ip: purchase.bound_ip,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      error: 'Access denied: IP address mismatch' 
    }, { status: 403 })
  }

  // Bind IP if not already bound
  if (!purchase.bound_ip) {
    await supabase
      .from('purchases')
      .update({ bound_ip: clientIP })
      .eq('id', purchase.id)
  }

  // Get collection data to get video URL
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('video_path')
    .eq('id', purchase.collection_id)
    .single()

  if (collectionError || !collection?.video_path) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Log successful access
  await supabase
    .from('security_logs')
    .insert({
      purchase_id: purchase.id,
      event_type: 'video_access',
      ip_address: clientIP,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    })

  // Create response with security headers
  const response = NextResponse.json({ 
    videoUrl: collection.video_path,
    expiresAt: purchase.expires_at,
    boundIP: clientIP
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