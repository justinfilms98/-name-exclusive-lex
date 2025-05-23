import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const { data, error } = await supabase
    .from('purchases')
    .select('id, video_id, purchased_at, expires_at, video:collection_videos(title)')
    .eq('user_email', email)
    .order('purchased_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
} 