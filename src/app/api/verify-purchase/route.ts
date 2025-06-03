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
    console.log('Stripe session:', session);
    if (!session || session.payment_status !== 'paid') {
      console.error('Invalid or unpaid session:', sessionId, session?.payment_status);
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 });
    }
    // 2. Get video_id from metadata
    console.log('Session metadata:', session.metadata);
    const videoId = session.metadata?.video_id;
    if (!videoId) {
      console.error('No video_id in session metadata:', session.metadata);
      return NextResponse.json({ success: false, error: 'No video_id in session metadata' }, { status: 400 });
    }
    // 3. Get user_id (use customer_email for now)
    console.log('Customer email:', session.customer_email);
    const userId = session.customer_email;
    if (!userId) {
      console.error('No customer email in session:', sessionId);
      return NextResponse.json({ success: false, error: 'No customer email in session' }, { status: 400 });
    }
    // 4. Get video duration from your videos table
    console.log('Looking up video in CollectionVideo with id:', videoId, 'Type:', typeof videoId);
    const { data: video, error: videoError } = await supabaseAdmin
      .from('CollectionVideo')
      .select('*')
      .eq('id', videoId)
      .single();
    if (videoError) {
      console.error('Supabase error:', videoError);
      return new NextResponse(
        JSON.stringify({ success: false, error: videoError.message }),
        { status: 500 }
      );
    }
    if (!video) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Video not found' }),
        { status: 404 }
      );
    }
    const durationSeconds = video.duration || 1800; // fallback to 30 min if missing
    // 5. Generate a UUID token
    const token = randomUUID();
    // 6. Calculate expiry
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
    // 7. Insert into purchase_tokens
    const { error: insertError } = await supabaseAdmin
      .from('purchase_tokens')
      .insert([
        {
          user_id: userId,
          video_id: videoId,
          token,
          expires_at: expiresAt,
        }
      ]);
    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }
    // 8. Return full purchase details for the frontend
    const purchaseDetails = {
      videoId: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration,
      purchasedAt: new Date().toISOString(), // You may want to fetch the actual purchase time if stored
      expiresAt: expiresAt,
      price: video.price ?? 0
    };
    return NextResponse.json({ success: true, purchases: [purchaseDetails] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
} 