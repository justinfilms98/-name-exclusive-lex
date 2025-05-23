import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  const buf = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email;
    // Only use session.metadata.video_ids for fulfillment
    if (session.metadata && session.metadata.video_ids) {
      const videoIds = session.metadata.video_ids.split(',');
      for (const videoId of videoIds) {
        // Look up video duration
        const { data: video } = await supabase
          .from('collection_videos')
          .select('duration')
          .eq('id', videoId)
          .single();
        if (!video) continue;
        const purchasedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + video.duration * 60 * 1000).toISOString();
        await supabase.from('purchases').insert([
          {
            user_email: email,
            video_id: videoId,
            purchased_at: purchasedAt,
            expires_at: expiresAt,
          },
        ]);
      }
    }
  }

  res.status(200).json({ received: true });
} 