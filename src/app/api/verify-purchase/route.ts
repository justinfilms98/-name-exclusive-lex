import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    );
  }

  try {
    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Invalid or unpaid session' },
        { status: 400 }
      );
    }

    // Get the video ID from the session metadata
    const videoId = session.metadata?.videoId;
    if (!videoId) {
      return NextResponse.json(
        { error: 'No video ID in session' },
        { status: 400 }
      );
    }

    // Get the customer email
    const customerEmail = session.customer_email;
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No customer email in session' },
        { status: 400 }
      );
    }

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('collection_videos')
      .select('id, title, description, thumbnail, duration, video_url')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        video_id: videoId,
        user_email: customerEmail,
        stripe_session_id: sessionId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }

    // Return purchase details
    return NextResponse.json({
      videoId: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration,
      purchasedAt: purchase.purchased_at,
      expiresAt: purchase.expires_at,
      price: purchase.amount_paid,
    });
  } catch (error) {
    console.error('Error in verify-purchase route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 