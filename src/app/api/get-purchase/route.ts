import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const session_id = new URL(request.url).searchParams.get('session_id')
  const collection_id = new URL(request.url).searchParams.get('collection_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  console.log('Looking for purchase with session_id:', session_id);
  console.log('Collection ID parameter:', collection_id);

  // Find active purchases with this session_id and collection_id
  let query = supabase
    .from('purchases')
    .select('id, user_id, collection_id, stripe_session_id, created_at, amount_paid')
    .eq('stripe_session_id', session_id)
    .eq('is_active', true)
  
  // If collection_id is provided, filter by it
  if (collection_id) {
    query = query.eq('collection_id', collection_id)
  }
  
  const { data: purchases, error: anyError } = await query.order('created_at', { ascending: true })

  console.log('Found purchases count:', purchases?.length || 0);
  if (purchases && purchases.length > 0) {
    console.log('Purchase IDs:', purchases.map(p => p.id));
    console.log('Collection IDs:', purchases.map(p => p.collection_id));
  }

  if (anyError) {
    console.error('No purchases found with session_id:', session_id);
    console.error('Error details:', anyError);
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  if (!purchases || purchases.length === 0) {
    console.error('No active purchases found with session_id:', session_id);
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  // For now, return the first purchase (we can enhance this later to handle multiple)
  const anyPurchase = purchases[0];

  console.log('Found purchase:', anyPurchase.id);

  // Now get the collection details
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, title, description, video_path, thumbnail_path, photo_paths')
    .eq('id', anyPurchase.collection_id)
    .single()

  if (collectionError || !collection) {
    console.error('Collection not found for ID:', anyPurchase.collection_id);
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  console.log('Found collection:', collection.title);

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
    ...anyPurchase,
    collection_video_id: collection.id,
    CollectionVideo: mockCollectionVideo,
    collection: collection // Add collection data for compatibility
  }

  console.log('Returning purchase with collection data');
  return NextResponse.json({ purchase: purchaseWithCollectionVideo }, { status: 200 })
} 