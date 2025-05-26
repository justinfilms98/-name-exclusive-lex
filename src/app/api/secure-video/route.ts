import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const email = searchParams.get('email');

  if (!videoId || !email) {
    return NextResponse.json(
      { error: 'Missing videoId or email' },
      { status: 400 }
    );
  }

  try {
    // Check for valid purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('expires_at, video_id, user_email, purchased_at')
      .eq('video_id', videoId)
      .eq('user_email', email)
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'No valid purchase found' },
        { status: 403 }
      );
    }

    const now = new Date();
    const expires = new Date(purchase.expires_at);
    if (now > expires) {
      return NextResponse.json(
        { error: 'Purchase expired' },
        { status: 403 }
      );
    }

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('collection_videos')
      .select('id, title, description, thumbnail, video_url, duration')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Generate signed URL for remaining time (in seconds)
    const seconds = Math.floor((expires.getTime() - now.getTime()) / 1000);
    const path = video.video_url.split('/').pop();
    
    if (!path) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 500 }
      );
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('videos')
      .createSignedUrl(path, seconds);

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        duration: video.duration
      },
      purchase: {
        purchased_at: purchase.purchased_at,
        expires_at: purchase.expires_at
      },
      signedUrl: signed.signedUrl
    });
  } catch (error) {
    console.error('Error in secure-video route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 