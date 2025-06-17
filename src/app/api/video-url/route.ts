import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has access to this video
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Access denied or purchase expired' }, { status: 403 });
    }

    // Get video details to find the video path
    const { data: video, error: videoError } = await supabase
      .from('collection_videos')
      .select('video_path, video_url')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate signed URL for video access (1 hour expiration)
    const expiresIn = 60 * 60; // 1 hour in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('videos')
      .createSignedUrl(video.video_path || video.video_url, expiresIn);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Failed to generate signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to generate video URL' }, { status: 500 });
    }

    return NextResponse.json({ 
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    });

  } catch (error) {
    console.error('Video URL generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 