import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const session_id = new URL(request.url).searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  // First get the purchase - only active purchases
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, user_id, collection_id, stripe_session_id, created_at, expires_at, amount_paid, is_active, deactivated_at')
    .eq('stripe_session_id', session_id)
    .eq('is_active', true)
    .single()

  if (error) return NextResponse.json({ error: purchase ? 'Multiple rows returned' : 'Purchase not found or inactive' }, { status: 404 })
  
  // Check if purchase is active
  if (!purchase.is_active) {
    return NextResponse.json({ error: 'Purchase has been deactivated. A newer purchase is now active.' }, { status: 403 })
  }
  
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

  // Create a mock CollectionVideo from the collection data
  // This maintains compatibility with the frontend while using collection data
  const mockCollectionVideo = {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    videoUrl: collection.video_path || '',
    thumbnail: collection.thumbnail_path || '',
    price: 0 // Default price, can be updated later
  }

  // Combine purchase and collection video data
  const purchaseWithCollectionVideo = {
    ...purchase,
    collection_video_id: collection.id,
    CollectionVideo: mockCollectionVideo,
    collection: collection // Add collection data for compatibility
  }

  return NextResponse.json({ purchase: purchaseWithCollectionVideo }, { status: 200 })
} 