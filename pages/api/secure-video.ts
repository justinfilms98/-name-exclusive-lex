import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { videoId, userId } = req.query;
  if (!videoId || !userId || typeof videoId !== 'string' || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing videoId or userId' });
  }

  try {
    // Check for valid purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('expires_at, video_id, user_id, purchased_at')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (purchaseError || !purchase) {
      return res.status(403).json({ error: 'No valid purchase found' });
    }

    const now = new Date();
    const expires = new Date(purchase.expires_at);
    if (now > expires) {
      return res.status(403).json({ error: 'Purchase expired' });
    }

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('collection_videos')
      .select('id, title, description, thumbnail, video_url, duration')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Generate signed URL for remaining time (in seconds)
    const seconds = Math.floor((expires.getTime() - now.getTime()) / 1000);
    const path = video.video_url.split('/').pop();
    
    if (!path) {
      return res.status(500).json({ error: 'Invalid video URL' });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('videos')
      .createSignedUrl(path, seconds);

    if (signedError || !signed?.signedUrl) {
      return res.status(500).json({ error: 'Failed to generate signed URL' });
    }

    return res.status(200).json({
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
  } catch (error: any) {
    console.error('Error in secure-video:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 