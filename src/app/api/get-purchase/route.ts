import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const session_id = new URL(request.url).searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  // First get the purchase
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id, created_at, expires_at')
    .eq('stripe_session_id', session_id)
    .single()

  if (error) return NextResponse.json({ error: purchase ? 'Multiple rows returned' : 'Purchase not found' }, { status: 404 })
  if (new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  // Now get the collection details
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, title, description, video_path, thumbnail_path, duration')
    .eq('id', purchase.collection_id)
    .single()

  if (collectionError || !collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  // Combine purchase and collection data
  const purchaseWithCollection = {
    ...purchase,
    collection
  }

  return NextResponse.json({ purchase: purchaseWithCollection }, { status: 200 })
} 