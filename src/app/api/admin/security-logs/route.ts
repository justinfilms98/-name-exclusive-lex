import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const eventType = searchParams.get('event_type')
  const purchaseId = searchParams.get('purchase_id')

  let query = supabase
    .from('security_logs')
    .select(`
      *,
      purchases (
        id,
        user_id,
        collection_video_id,
        stripe_session_id,
        created_at,
        expires_at,
        strike_count,
        bound_ip
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (eventType) {
    query = query.eq('event_type', eventType)
  }

  if (purchaseId) {
    query = query.eq('purchase_id', purchaseId)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch security logs' }, { status: 500 })
  }

  // Get summary statistics
  const { data: summary } = await supabase
    .from('security_logs')
    .select('event_type')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

  const eventCounts = summary?.reduce((acc: any, log) => {
    acc[log.event_type] = (acc[log.event_type] || 0) + 1
    return acc
  }, {}) || {}

  return NextResponse.json({
    logs,
    summary: {
      total_events_24h: summary?.length || 0,
      event_counts: eventCounts
    },
    pagination: {
      limit,
      offset,
      has_more: logs.length === limit
    }
  })
}

export async function POST(request: Request) {
  const { action, purchase_id, reason } = await request.json()

  if (!action || !purchase_id) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  switch (action) {
    case 'revoke_access':
      const { error: revokeError } = await supabase
        .from('purchases')
        .update({ 
          expires_at: new Date().toISOString(),
          strike_count: 3 // Force to maximum
        })
        .eq('id', purchase_id)

      if (revokeError) {
        return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
      }

      // Log the manual revocation
      await supabase
        .from('security_logs')
        .insert({
          purchase_id,
          event_type: 'manual_revocation',
          ip_address: 'admin',
          user_agent: 'admin_dashboard',
          details: {
            reason: reason || 'Manual revocation by admin',
            revoked_at: new Date().toISOString()
          }
        })

      return NextResponse.json({ success: true, message: 'Access revoked successfully' })

    case 'reset_strikes':
      const { error: resetError } = await supabase
        .from('purchases')
        .update({ strike_count: 0 })
        .eq('id', purchase_id)

      if (resetError) {
        return NextResponse.json({ error: 'Failed to reset strikes' }, { status: 500 })
      }

      // Log the strike reset
      await supabase
        .from('security_logs')
        .insert({
          purchase_id,
          event_type: 'strikes_reset',
          ip_address: 'admin',
          user_agent: 'admin_dashboard',
          details: {
            reason: reason || 'Strikes reset by admin',
            reset_at: new Date().toISOString()
          }
        })

      return NextResponse.json({ success: true, message: 'Strikes reset successfully' })

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
} 