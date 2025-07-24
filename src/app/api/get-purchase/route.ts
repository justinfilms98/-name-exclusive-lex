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
    .select('id, user_id, collection_id, stripe_session_id, created_at, expires_at, amount_paid')
    .eq('stripe_session_id', session_id)
    .single()

  if (error) return NextResponse.json({ error: purchase ? 'Multiple rows returned' : 'Purchase not found' }, { status: 404 })
  if (new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  // Now get the collection details
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, title, description, video_path, thumbnail_path, photo_paths')
    .eq('id', purchase.collection_id)
    .single()

  if (collectionError || !collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  // Get the first collection video for this collection
  const { data: collectionVideos, error: collectionVideosError } = await supabase
    .from('CollectionVideo')
    .select('id, title, description, videoUrl, thumbnail, price')
    .eq('collection', collection.title)
    .order('order', { ascending: true })
    .limit(1)
    .single()

  if (collectionVideosError || !collectionVideos) {
    return NextResponse.json({ error: 'Collection video not found' }, { status: 404 })
  }

  // Combine purchase and collection video data
  const purchaseWithCollectionVideo = {
    ...purchase,
    collection_video_id: collectionVideos.id,
    CollectionVideo: collectionVideos
  }

  return NextResponse.json({ purchase: purchaseWithCollectionVideo }, { status: 200 })
} 