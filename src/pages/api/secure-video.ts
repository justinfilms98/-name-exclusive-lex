import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId, userId } = req.query;
  if (!videoId || !userId) {
    return res.status(400).json({ error: 'Missing videoId or userId' });
  }

  // Check for valid purchase
  const { data: purchase } = await supabase
    .from('Purchase')
    .select('expiresAt, videoId, userId, createdAt')
    .eq('videoId', videoId)
    .eq('userId', userId)
    .order('expiresAt', { ascending: false })
    .limit(1)
    .single();

  if (!purchase) {
    return res.status(403).json({ error: 'No valid purchase found' });
  }

  const now = new Date();
  const expires = new Date(purchase.expiresAt);
  if (now > expires) {
    return res.status(403).json({ error: 'Purchase expired' });
  }

  // Get video file path
  const { data: video } = await supabase
    .from('CollectionVideo')
    .select('videoUrl')
    .eq('id', videoId)
    .single();
  if (!video || !video.videoUrl) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Generate signed URL for remaining time (in seconds)
  const seconds = Math.floor((expires.getTime() - now.getTime()) / 1000);
  const path = video.videoUrl.split('/').pop();
  const { data: signed } = await supabase.storage.from('videos').createSignedUrl(path, seconds);
  if (!signed || !signed.signedUrl) {
    return res.status(500).json({ error: 'Failed to generate signed URL' });
  }

  return res.status(200).json({ signedUrl: signed.signedUrl });
} 