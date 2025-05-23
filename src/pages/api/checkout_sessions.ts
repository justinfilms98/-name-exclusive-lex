import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { videoIds, userEmail } = req.body;
  if (!Array.isArray(videoIds) || !userEmail) {
    return res.status(400).json({ error: 'Missing videoIds or userEmail' });
  }

  // Fetch video details from Supabase
  const { data: videos, error } = await supabase
    .from('collection_videos')
    .select('id, title, price')
    .in('id', videoIds);
  if (error || !videos) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch videos' });
  }

  // Prepare Stripe line items
  const line_items = videos.map((video) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: video.title,
        metadata: { video_id: video.id },
      },
      unit_amount: Math.round(Number(video.price) * 100),
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/collections/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/collections/cancel`,
      metadata: {
        video_ids: videoIds.join(','),
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
} 