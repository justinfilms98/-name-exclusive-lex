import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
  }

  try {
    // Get all active purchases for the user
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        collection_id,
        stripe_session_id,
        created_at,
        amount_paid,
        is_active,
        deactivated_at
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active purchases:', error)
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }

    // Get collection details for each purchase
    const purchasesWithCollections = await Promise.all(
      purchases.map(async (purchase) => {
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('id, title, description, video_path, media_filename, thumbnail_path, photo_paths')
          .eq('id', purchase.collection_id)
          .single()

        if (collectionError || !collection) {
          console.error('Error fetching collection:', collectionError)
          return {
            ...purchase,
            collection: null,
            isExpired: false // Permanent access - never expires
          }
        }

        // ✅ Use media_filename if available, otherwise fall back to video_path
        const videoUrl = collection.media_filename || collection.video_path;
        const collectionWithVideoUrl = {
          ...collection,
          video_path: videoUrl // Update video_path to use media_filename if available
        };

        return {
          ...purchase,
          collection: collectionWithVideoUrl,
          isExpired: false, // Permanent access - never expires
          timeRemaining: null // No timer for permanent access
        }
      })
    )

    return NextResponse.json({ 
      purchases: purchasesWithCollections,
      totalActive: purchasesWithCollections.filter(p => !p.isExpired).length
    }, { status: 200 })

  } catch (error) {
    console.error('Error in get-active-purchases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 