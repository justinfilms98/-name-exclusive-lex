import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { session_id, event_type = 'screenshot_detected' } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const headersList = await headers()
  const clientIP = headersList.get('x-forwarded-for')?.split(',')[0] || 
                   headersList.get('x-real-ip') || 
                   headersList.get('cf-connecting-ip') || 
                   'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, strike_count, bound_ip, user_id, collection_video_id')
    .eq('stripe_session_id', session_id)
    .single()

  if (error || !purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })

  // Log the security event
  await supabase
    .from('security_logs')
    .insert({
      purchase_id: purchase.id,
      event_type: event_type,
      ip_address: clientIP,
      user_agent: userAgent,
      details: {
        timestamp: new Date().toISOString(),
        previous_strikes: purchase.strike_count
      }
    })

  const newCount = purchase.strike_count + 1
  const updates: any = { 
    strike_count: newCount,
    last_access_at: new Date().toISOString()
  }
  let expired = false
  let reason = ''

  // Immediate revocation for screen capture events
  if (event_type === 'screen_capture_detected') {
    updates.expires_at = new Date().toISOString()
    expired = true
    reason = 'Access immediately revoked due to screen capture detection'
  } else if (newCount >= 3) {
    updates.expires_at = new Date().toISOString()
    expired = true
    reason = 'Access revoked due to repeated screenshot attempts'
  } else if (newCount >= 2) {
    reason = 'Warning: One more strike will revoke access'
  } else {
    reason = 'Screenshot detected - strikes are being tracked'
  }

  await supabase.from('purchases').update(updates).eq('id', purchase.id)

  // If access is revoked, log it as a security event
  if (expired) {
    await supabase
      .from('security_logs')
      .insert({
        purchase_id: purchase.id,
        event_type: 'access_revoked',
        ip_address: clientIP,
        user_agent: userAgent,
        details: {
          reason: reason,
          total_strikes: newCount,
          revoked_at: new Date().toISOString()
        }
      })
  }

  return NextResponse.json({ 
    strike_count: newCount, 
    threshold: 3, 
    expired,
    reason,
    bound_ip: purchase.bound_ip
  })
} 