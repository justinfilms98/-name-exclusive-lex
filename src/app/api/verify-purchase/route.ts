import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
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
    console.error('Missing session_id in query');
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    );
  }

  try {
    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session:', JSON.stringify(session, null, 2));
    if (!session || session.payment_status !== 'paid') {
      console.error('Invalid or unpaid session:', sessionId, session?.payment_status);
      return NextResponse.json(
        { error: 'Invalid or unpaid session' },
        { status: 400 }
      );
    }

    // Get the video IDs from the session metadata
    const videoIdsString = session.metadata?.video_ids;
    console.log('Session metadata:', session.metadata);
    if (!videoIdsString) {
      console.error('No video_ids in session metadata:', session.metadata);
      return NextResponse.json(
        { error: 'No video IDs in session' },
        { status: 400 }
      );
    }
    const videoIds = videoIdsString.split(',').map((id: string) => id.trim()).filter(Boolean);

    // Get the customer email
    const customerEmail = session.customer_email;
    console.log('Customer email:', customerEmail);
    if (!customerEmail) {
      console.error('No customer email in session:', sessionId);
      return NextResponse.json(
        { error: 'No customer email in session' },
        { status: 400 }
      );
    }

    // Fetch video details for all video IDs
    const { data: videos, error: videoError } = await supabase
      .from('CollectionVideo')
      .select('id, title, description, thumbnail, duration, videoUrl, price')
      .in('id', videoIds);

    if (videoError || !videos || videos.length === 0) {
      console.error('Videos not found or error:', videoError, videos);
      return NextResponse.json(
        { error: 'Videos not found' },
        { status: 404 }
      );
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // FIX: Use Supabase Admin API to find user by email (filter in code)
    const { data: users, error: adminUserError } = await supabase.auth.admin.listUsers();
    if (adminUserError || !users || users.users.length === 0) {
      console.error('User not found for email (admin API):', customerEmail, adminUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const user = users.users.find((u) => u.email === customerEmail);
    if (!user) {
      console.error('User not found for email (admin API):', customerEmail);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create purchase records for each video
    const purchases: PurchaseDetails[] = [];
    for (const video of videos) {
      const { price = 0 } = video;
      const { data: purchase, error: purchaseError } = await supabase
        .from('Purchase')
        .insert({
          userId: user.id,
          videoId: String(video.id),
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (purchaseError) {
        console.error('Error creating purchase:', purchaseError);
        continue;
      }
      purchases.push({
        videoId: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        duration: video.duration,
        purchasedAt: purchase.createdAt,
        expiresAt: purchase.expiresAt,
        price,
      });
    }

    if (purchases.length === 0) {
      console.error('Failed to create any purchase records for session:', sessionId);
      return NextResponse.json(
        { error: 'Failed to create purchase records' },
        { status: 500 }
      );
    }

    // Return all purchased video details
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error in verify-purchase route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 