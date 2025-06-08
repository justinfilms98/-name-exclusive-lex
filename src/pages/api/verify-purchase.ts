import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const { data: video, error: videoError } = await supabase
      .from('CollectionVideo')
      .select('duration')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // 5. Insert into UsersVideos (grant access)
    const { error: purchaseError } = await supabase
      .from('UsersVideos')
      .insert([
        { userId: userId, videoId: Number(videoId), purchasedAt: new Date().toISOString() }
      ]);

    if (purchaseError) {
      console.error('Error inserting purchase:', purchaseError);
      return res.status(500).json({ success: false, error: 'Failed to record purchase' });
    }

    // 6. Create a new token row
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + (video.duration || 30) * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from('purchase_tokens')
      .insert([
        {
          video_id: videoId,
          token,
          expires_at: expiresAt,
          user_id: userId
        }
      ]);

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return res.status(500).json({ success: false, error: 'Failed to create access token' });
    }

    return res.status(200).json({
      success: true,
      token,
      expiresAt,
      videoId
    });
  } catch (err) {
    console.error('Error in verify-purchase:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(err)
    });
  }
} 