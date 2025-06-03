import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

console.log('DEBUG SUPABASE_URL:', process.env.SUPABASE_URL?.slice(0, 6));
console.log('DEBUG SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 6));

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'Missing session_id' }, { status: 400 });
  }
  try {
    // 1. Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 });
    }
    // 2. Get video_id from metadata
    const videoId = session.metadata?.video_id;
    if (!videoId) {
      return NextResponse.json({ success: false, error: 'No video_id in session metadata' }, { status: 400 });
    }
    // 3. Get user_id (use customer_email for now)
    const userId = session.customer_email;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No customer email in session' }, { status: 400 });
    }
    // 4. Get video duration from your videos table
    const { data: video, error: videoError } = await supabaseAdmin
      .from('CollectionVideo')
      .select('duration')
      .eq('id', videoId)
      .single();
    if (videoError || !video) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
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
      return NextResponse.json({ success: false, error: 'Failed to create access token' }, { status: 500 });
    }
    // 7. Return success, videoId, token
    return NextResponse.json({ success: true, videoId: Number(videoId), token: tokenRow.token });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
} 