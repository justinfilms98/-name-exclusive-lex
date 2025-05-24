import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Get the latest purchase for this user
  const { data: purchase } = await supabase
    .from('purchases')
    .select('video_id, purchased_at')
    .eq('user_email', email)
    .order('purchased_at', { ascending: false })
    .limit(1)
    .single();

  if (!purchase) {
    return NextResponse.json({ error: 'No purchase found' }, { status: 404 });
  }

  // Get video info
  const { data: video } = await supabase
    .from('collection_videos')
    .select('id, title, duration')
    .eq('id', purchase.video_id)
    .single();

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json({ videoId: video.id, video });
} 