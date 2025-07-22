import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { session_id } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, strike_count')
    .eq('stripe_session_id', session_id)
    .single()

  if (error || !purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })

  const newCount = purchase.strike_count + 1
  const updates: any = { strike_count: newCount }
  let expired = false
  if (newCount >= 3) {
    updates.expires_at = new Date().toISOString()
    expired = true
  }
  await supabase.from('purchases').update(updates).eq('id', purchase.id)

  return NextResponse.json({ strike_count: newCount, threshold: 3, expired })
} 