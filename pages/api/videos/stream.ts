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

  const { videoId, token } = req.query;
  if (!videoId || !token || typeof videoId !== 'string' || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing videoId or token' });
  }

  try {
    // Validate token
    const { data: purchase, error } = await supabase
      .from('purchase_tokens')
      .select('expires_at')
      .eq('video_id', videoId)
      .eq('token', token)
      .single();

    if (error || !purchase) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    if (new Date(purchase.expires_at).getTime() < Date.now()) {
      return res.status(403).json({ success: false, error: 'Token expired' });
    }

    // Get video path from CollectionVideo
    const { data: video, error: videoError } = await supabase
      .from('CollectionVideo')
      .select('videoUrl')
      .eq('id', videoId)
      .single();

    if (videoError || !video || !video.videoUrl) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Generate a signed URL if using Supabase Storage
    const { data: signed, error: signedError } = await supabase.storage
      .from('videos')
      .createSignedUrl(video.videoUrl, 60);

    if (signedError || !signed?.signedUrl) {
      return res.status(500).json({ success: false, error: 'Failed to generate signed URL' });
    }

    const streamUrl = signed.signedUrl;
    return res.status(200).json({ success: true, streamUrl, expiresAt: purchase.expires_at });
  } catch (error: any) {
    console.error('Error in videos/stream:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
} 