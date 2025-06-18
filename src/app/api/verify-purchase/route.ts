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

    // Validate user session first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not completed or session not found' 
      }, { status: 400 });
    }

    // Extract and validate metadata
    const { user_id, video_ids, cart_summary } = session.metadata || {};
    
    if (!user_id || !video_ids) {
      console.error('Invalid session metadata:', session.metadata);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid session metadata' 
      }, { status: 400 });
    }

    // Verify the session belongs to the authenticated user
    if (user_id !== user.id) {
      console.error('Session user mismatch:', { sessionUserId: user_id, authenticatedUserId: user.id });
      return NextResponse.json({ 
        success: false, 
        message: 'Session does not belong to authenticated user' 
      }, { status: 403 });
    }

    // Parse video IDs with better error handling
    const videoIdArray = video_ids.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => {
        const parsed = parseInt(id);
        return isNaN(parsed) ? null : parsed;
      })
      .filter(id => id !== null) as number[];
    
    if (videoIdArray.length === 0) {
      console.error('No valid video IDs found in metadata:', video_ids);
      return NextResponse.json({ 
        success: false, 
        message: 'No valid video IDs found' 
      }, { status: 400 });
    }

    // Check if purchases already exist to prevent duplicates
    const { data: existingPurchases, error: existingError } = await supabase
      .from('purchases')
      .select('video_id')
      .eq('user_id', user.id)
      .in('video_id', videoIdArray);

    if (existingError) {
      console.error('Error checking existing purchases:', existingError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to check existing purchases' 
      }, { status: 500 });
    }

    const existingVideoIds = existingPurchases?.map(p => p.video_id) || [];
    const newVideoIds = videoIdArray.filter(id => !existingVideoIds.includes(id));

    if (newVideoIds.length === 0) {
      // All videos already purchased
      return NextResponse.json({
        success: true,
        message: 'Videos already purchased',
        purchases: existingPurchases?.map(p => ({
          videoId: p.video_id,
          title: 'Already purchased',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }))
      });
    }

    // Get video details for new purchases
    const { data: videos, error: videosError } = await supabase
      .from('collection_videos')
      .select('id, title, price')
      .in('id', newVideoIds);

    if (videosError || !videos || videos.length === 0) {
      console.error('Error fetching videos:', videosError);
      return NextResponse.json({ 
        success: false, 
        message: 'Videos not found' 
      }, { status: 404 });
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert purchase records for new videos only
    const purchaseRecords = videos.map(video => ({
      user_id: user.id,
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

    // Return success with all purchase details (existing + new)
    const allPurchaseDetails = [
      ...(existingPurchases?.map(p => ({
        videoId: p.video_id,
        title: 'Already purchased',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })) || []),
      ...videos.map(video => ({
        videoId: video.id,
        title: video.title,
        expiresAt: expiresAt.toISOString(),
      }))
    ];

    return NextResponse.json({
      success: true,
      message: 'Purchase verified and recorded successfully',
      purchases: allPurchaseDetails,
    });

  } catch (error) {
    console.error('Purchase verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 