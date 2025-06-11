import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const userEmail = searchParams.get('user_email');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify customer email if provided
    if (userEmail && session.customer_email !== userEmail) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Extract video IDs from metadata
    const videoIds = session.metadata?.video_ids?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) || [];
    const singleVideoId = session.metadata?.video_id ? parseInt(session.metadata.video_id) : null;

    if (videoIds.length === 0 && !singleVideoId) {
      return NextResponse.json(
        { error: "No video IDs found in session" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the actual video IDs (either from single or multiple)
    const finalVideoIds = singleVideoId ? [singleVideoId] : videoIds;

    // Verify videos exist
    const videos = await prisma.collectionVideo.findMany({
      where: { id: { in: finalVideoIds } },
      select: { id: true, title: true, price: true }
    });

    if (videos.length !== finalVideoIds.length) {
      return NextResponse.json(
        { error: "Some videos not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user exists (create if not)
    let userId = 'anonymous';
    if (session.customer_email) {
      const user = await prisma.user.upsert({
        where: { email: session.customer_email },
        update: {},
        create: {
          email: session.customer_email,
          name: session.customer_details?.name || null,
        },
      });
      userId = user.id;
    }

    // Create purchase records
    const purchasePromises = videos.map(video => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year access

      return prisma.purchase.create({
        data: {
          userId,
          videoId: video.id,
          expiresAt,
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              collection: true,
            }
          }
        }
      });
    });

    const purchases = await Promise.all(purchasePromises);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
      },
      purchases: purchases.map(purchase => ({
        id: purchase.id,
        videoId: purchase.videoId,
        videoTitle: purchase.video.title,
        collection: purchase.video.collection,
        expiresAt: purchase.expiresAt,
      })),
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        price: video.price,
      })),
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("Error in GET /api/verify-purchase:", err);
    
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${err.message}` },
        { status: 400, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userEmail } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify customer email if provided
    if (userEmail && session.customer_email !== userEmail) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Extract video IDs from metadata
    const videoIds = session.metadata?.video_ids?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) || [];
    const singleVideoId = session.metadata?.video_id ? parseInt(session.metadata.video_id) : null;

    if (videoIds.length === 0 && !singleVideoId) {
      return NextResponse.json(
        { error: "No video IDs found in session" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the actual video IDs (either from single or multiple)
    const finalVideoIds = singleVideoId ? [singleVideoId] : videoIds;

    // Verify videos exist
    const videos = await prisma.collectionVideo.findMany({
      where: { id: { in: finalVideoIds } },
      select: { id: true, title: true, price: true }
    });

    if (videos.length !== finalVideoIds.length) {
      return NextResponse.json(
        { error: "Some videos not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user exists (create if not)
    let userId = 'anonymous';
    if (session.customer_email) {
      const user = await prisma.user.upsert({
        where: { email: session.customer_email },
        update: {},
        create: {
          email: session.customer_email,
          name: session.customer_details?.name || null,
        },
      });
      userId = user.id;
    }

    // Create purchase records
    const purchasePromises = videos.map(video => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year access

      return prisma.purchase.create({
        data: {
          userId,
          videoId: video.id,
          expiresAt,
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              collection: true,
            }
          }
        }
      });
    });

    const purchases = await Promise.all(purchasePromises);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
      },
      purchases: purchases.map(purchase => ({
        id: purchase.id,
        videoId: purchase.videoId,
        videoTitle: purchase.video.title,
        collection: purchase.video.collection,
        expiresAt: purchase.expiresAt,
      })),
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        price: video.price,
      })),
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("Error in POST /api/verify-purchase:", err);
    
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${err.message}` },
        { status: 400, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500, headers: corsHeaders }
    );
  }
} 