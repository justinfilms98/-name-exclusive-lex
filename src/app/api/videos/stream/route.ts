import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const token = searchParams.get('token');
  if (!videoId || !token) {
    return NextResponse.json({ success: false, error: 'Missing videoId or token' }, { status: 400 });
  }
  // Validate token
  const { data: purchase, error } = await supabase
    .from('purchase_tokens')
    .select('expires_at')
    .eq('video_id', videoId)
    .eq('token', token)
    .single();
  if (error || !purchase) {
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 403 });
  }
  if (new Date(purchase.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Token expired' }, { status: 403 });
  }
  // Get video path from CollectionVideo
  const { data: video, error: videoError } = await supabase
    .from('CollectionVideo')
    .select('videoUrl')
    .eq('id', videoId)
    .single();
  if (videoError || !video || !video.videoUrl) {
    return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
  }
  // Optionally: generate a signed URL if using Supabase Storage
  const { data: signed, error: signedError } = await supabase.storage.from('videos').createSignedUrl(video.videoUrl, 60);
  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ success: false, error: 'Failed to generate signed URL' }, { status: 500 });
  }
  const streamUrl = signed.signedUrl;
  return NextResponse.json({ success: true, streamUrl, expiresAt: purchase.expires_at });
} 