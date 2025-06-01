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
    if (session.metadata && session.metadata.video_ids) {
      const videoIds = session.metadata.video_ids.split(',');
      // Find the Supabase Auth user by email
      const { data: user, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();
      if (userError || !user) {
        console.error('User not found or error:', userError, email);
        return res.status(404).json({ error: 'User not found' });
      }
      for (const videoId of videoIds) {
        // Look up video duration
        const { data: video, error: videoError } = await supabase
          .from('CollectionVideo')
          .select('duration')
          .eq('id', videoId)
          .single();
        if (videoError || !video) {
          console.error('Video not found or error:', videoError, videoId);
          continue;
        }
        const purchasedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + (video.duration || 30) * 60 * 1000 + 90 * 1000).toISOString();
        // Idempotency: check for existing purchase
        const { data: existingPurchase, error: purchaseCheckError } = await supabase
          .from('Purchase')
          .select('id')
          .eq('userId', user.id)
          .eq('videoId', videoId)
          .single();
        if (purchaseCheckError && purchaseCheckError.code !== 'PGRST116') {
          // PGRST116: No rows found (not an error for our logic)
          console.error('Error checking for existing purchase:', purchaseCheckError);
          continue;
        }
        if (!existingPurchase) {
          const { error: insertError } = await supabase.from('Purchase').insert([
            {
              userId: user.id,
              videoId: videoId,
              createdAt: purchasedAt,
              expiresAt: expiresAt,
            },
          ]);
          if (insertError) {
            console.error('Error inserting purchase:', insertError);
          }
        } else {
          console.log(`Purchase already exists for user ${user.id} and video ${videoId}`);
        }
      }
    }
  }

  res.status(200).json({ received: true });
} 