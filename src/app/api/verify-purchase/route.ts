import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not completed or session not found' 
      }, { status: 400 });
    }

    // Extract metadata
    const { user_id, video_ids } = session.metadata || {};
    
    if (!user_id || !video_ids) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid session metadata' 
      }, { status: 400 });
    }

    // Parse video IDs
    const videoIdArray = video_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (videoIdArray.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid video IDs found' 
      }, { status: 400 });
    }

    // Get video details
    const { data: videos, error: videosError } = await supabase
      .from('collection_videos')
      .select('id, title, price')
      .in('id', videoIdArray);

    if (videosError || !videos || videos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Videos not found' 
      }, { status: 404 });
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert purchase records
    const purchaseRecords = videos.map(video => ({
      user_id: user_id,
      video_id: video.id,
      expires_at: expiresAt.toISOString(),
    }));

    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseRecords)
      .select('*');

    if (purchaseError) {
      console.error('Error inserting purchases:', purchaseError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to record purchases' 
      }, { status: 500 });
    }

    // Return success with purchase details
    const purchaseDetails = videos.map(video => ({
      videoId: video.id,
      title: video.title,
      expiresAt: expiresAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: 'Purchase verified and recorded successfully',
      purchases: purchaseDetails,
    });

  } catch (error) {
    console.error('Purchase verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 