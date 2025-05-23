import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId, email } = req.query;
  if (!videoId || !email) {
    return res.status(400).json({ error: 'Missing videoId or email' });
  }

  // Check for valid purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('expires_at, video_id, user_email, purchased_at')
    .eq('video_id', videoId)
    .eq('user_email', email)
    .order('expires_at', { ascending: false })
    .limit(1)
    .single();

  if (!purchase) {
    return res.status(403).json({ error: 'No valid purchase found' });
  }

  const now = new Date();
  const expires = new Date(purchase.expires_at);
  if (now > expires) {
    return res.status(403).json({ error: 'Purchase expired' });
  }

  // Get video file path
  const { data: video } = await supabase
    .from('collection_videos')
    .select('video_url')
    .eq('id', videoId)
    .single();
  if (!video || !video.video_url) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Generate signed URL for remaining time (in seconds)
  const seconds = Math.floor((expires.getTime() - now.getTime()) / 1000);
  const path = video.video_url.split('/').pop();
  const { data: signed } = await supabase.storage.from('videos').createSignedUrl(path, seconds);
  if (!signed || !signed.signedUrl) {
    return res.status(500).json({ error: 'Failed to generate signed URL' });
  }

  return res.status(200).json({ signedUrl: signed.signedUrl });
} 