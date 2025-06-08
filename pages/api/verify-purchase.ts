import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } }
};

type PurchaseDetails = {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  purchasedAt: string;
  expiresAt: string;
  price: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { session_id } = req.query;
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing session_id' });
  }

  try {
    // 1. Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    // 2. Get video_id from metadata
    const videoId = session.metadata?.video_id;
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'No video_id in session metadata' });
    }

    // 3. Get user_id (use customer_email for now)
    const userId = session.customer_email;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'No customer email in session' });
    }

    // 4. Get video duration from your videos table
    const { data: video, error: videoError } = await supabaseAdmin
      .from('CollectionVideo')
      .select('duration')
      .eq('id', videoId)
      .single();
    if (videoError || !video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // 5. Insert into UsersVideos (grant access)
    await supabaseAdmin
      .from('UsersVideos')
      .insert([
        { userId: userId, videoId: Number(videoId), purchasedAt: new Date().toISOString() }
      ]);

    // 6. Always create a new token row
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + (video.duration || 30) * 60 * 1000).toISOString();
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('purchase_tokens')
      .insert([
        { token, user_id: userId, video_id: Number(videoId), expires_at: expiresAt }
      ])
      .select('token')
      .single();

    if (tokenError || !tokenRow) {
      return res.status(500).json({ success: false, error: 'Failed to create access token' });
    }

    // 7. Return success, videoId, token
    return res.status(200).json({ success: true, videoId: Number(videoId), token: tokenRow.token });
  } catch (error: any) {
    console.error('Error in verify-purchase:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
} 