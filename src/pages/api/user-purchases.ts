import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
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
    return res.status(404).json({ error: 'No purchase found' });
  }

  // Get video info
  const { data: video } = await supabase
    .from('collection_videos')
    .select('id, title, duration')
    .eq('id', purchase.video_id)
    .single();

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  return res.status(200).json({ videoId: video.id, video });
} 