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

  const { data: purchase, error } = await supabase
    .from('Purchase')
    .select(`
      id, 
      userId, 
      collectionVideoId, 
      createdAt, 
      expiresAt,
      amountPaid,
      stripeSessionId,
      CollectionVideo (
        id,
        title,
        description,
        videoUrl,
        thumbnail,
        price
      )
    `)
    .eq('stripeSessionId', session_id)
    .single()

  if (error || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  if (new Date(purchase.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Access expired' }, { status: 403 })
  }

  return NextResponse.json({ purchase }, { status: 200 })
} 