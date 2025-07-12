// =====================================================
// PURCHASE VERIFICATION API ROUTE
// Verifies Stripe checkout sessions and returns purchase details
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCheckoutSession } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get videoId from query params
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if user has purchased this video
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        collectionVideoId: videoId,
      },
      include: {
        CollectionVideo: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({
        hasAccess: false,
        video: null,
      });
    }

    // Check if access has expired
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return NextResponse.json({
        hasAccess: false,
        video: null,
      });
    }

    return NextResponse.json({
      hasAccess: true,
      video: {
        id: purchase.CollectionVideo.id,
        title: purchase.CollectionVideo.title,
        description: purchase.CollectionVideo.description,
        videoUrl: purchase.CollectionVideo.videoUrl,
        thumbnail: purchase.CollectionVideo.thumbnail,
        price: purchase.CollectionVideo.price,
      },
    });

  } catch (error) {
    console.error('Video access verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify the Stripe checkout session
    const checkoutSession = await getCheckoutSession(sessionId);
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the current user
    const { userId } = checkoutSession.metadata || {};
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this session' },
        { status: 403 }
      );
    }

    // Find the purchase record
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        collectionVideoId: checkoutSession.metadata?.collectionVideoId,
      },
      include: {
        CollectionVideo: {
          include: {
            collection: true,
          },
        },
        User: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase record not found' },
        { status: 404 }
      );
    }

    // Check if access has expired
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Access has expired' },
        { status: 410 }
      );
    }

    // Track the successful verification
    await trackEvent({
      name: 'purchase_verified',
      properties: {
        purchase_id: purchase.id,
        media_id: purchase.CollectionVideo.id,
        media_title: purchase.CollectionVideo.title,
      },
      userId: session.user.id,
    });

    // Return purchase details
    return NextResponse.json({
      purchase: {
        id: purchase.id,
        media: {
          id: purchase.CollectionVideo.id,
          title: purchase.CollectionVideo.title,
          description: purchase.CollectionVideo.description,
          videoUrl: purchase.CollectionVideo.videoUrl,
          thumbnail: purchase.CollectionVideo.thumbnail,
        },
        expiresAt: purchase.expiresAt?.toISOString(),
        createdAt: purchase.createdAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Purchase verification error:', error);
    
    // Track the error
    await trackEvent({
      name: 'purchase_verification_error',
      properties: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
} 