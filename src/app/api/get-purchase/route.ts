import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')
  if (!session_id) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // First, let's check if the purchase exists
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select(`
      id, 
      user_id, 
      collection_video_id, 
      created_at, 
      expires_at,
      amount_paid,
      stripe_session_id
    `)
    .eq('stripe_session_id', session_id)
    .single()

  if (error || !purchase) {
    console.error('Purchase lookup error:', error)
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  if (new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  // Now get the collection video details
  const { data: collectionVideo, error: videoError } = await supabase
    .from('CollectionVideo')
    .select('id, title, description, videoUrl, thumbnail, price')
    .eq('id', purchase.collection_video_id)
    .single()

  if (videoError || !collectionVideo) {
    console.error('Collection video lookup error:', videoError)
    return NextResponse.json({ error: 'Collection video not found' }, { status: 404 })
  }

  // Combine the data
  const purchaseWithVideo = {
    ...purchase,
    CollectionVideo: collectionVideo
  }

  return NextResponse.json({ purchase: purchaseWithVideo }, { status: 200 })
} 