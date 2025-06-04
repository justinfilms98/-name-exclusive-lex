import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'NO_SESSION_ID_PROVIDED' }, { status: 400 });
  }
  try {
    // 1) Look up the purchase/order by session_id:
    const { data: purchaseData, error: purchaseError } = await supabaseAdmin
      .from('purchases') // or your actual table name
      .select('video_id')
      .eq('session_id', sessionId)
      .single();

    if (purchaseError || !purchaseData) {
      return NextResponse.json({ error: 'VIDEO_NOT_FOUND' }, { status: 404 });
    }

    const { video_id } = purchaseData;
    // 2) Ensure the video actually exists:
    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('collection_videos') // or your actual table name
      .select('videoPath') // assuming you store the storage path
      .eq('id', video_id)
      .single();

    if (videoError || !videoData) {
      return NextResponse.json({ error: 'VIDEO_NOT_FOUND' }, { status: 404 });
    }

    // 3) Generate a signed URL (valid 1 hour) for the purchased file:
    const { data: signedURLData, error: signedURLError } = await supabaseAdmin
      .storage
      .from('videos') // bucket name
      .createSignedUrl(videoData.videoPath, 60 * 60);

    if (signedURLError || !signedURLData) {
      return NextResponse.json({ error: 'SIGNED_URL_FAILED', details: signedURLError?.message }, { status: 500 });
    }

    // 4) Return the signed URL and video_id:
    return NextResponse.json({
      videoId: video_id,
      videoUrl: signedURLData.signedUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', details: err.message }, { status: 500 });
  }
} 