// =====================================================
// PURCHASE VERIFICATION API ROUTE
// Verifies Stripe checkout sessions and returns purchase details
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import { getCheckoutSession } from '@/lib/stripe';
import { trackEvent, trackError } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Get user session
    const session = await getServerSession(getAuthOptions());
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: (session.user as any).id,
        collectionVideoId: videoId,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Get video details separately
    const video = await prisma.collectionVideo.findUnique({
      where: { id: purchase.collectionVideoId },
      include: { collection: true },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if purchase has expired
    if (purchase.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Purchase has expired' },
        { status: 410 }
      );
    }

    // Track successful verification
    await trackEvent({
      name: 'purchase_verified',
      properties: {
        userId: (session.user as any).id,
        videoId,
        purchaseId: purchase.id,
      },
    });

    return NextResponse.json({
      valid: true,
      purchase: {
        id: purchase.id,
        expiresAt: purchase.expiresAt,
        CollectionVideo: video,
      },
    });
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    
    await trackError(error as Error);
    
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(getAuthOptions());
    if (!session?.user || !(session.user as any).id) {
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
    if (userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this session' },
        { status: 403 }
      );
    }

    // Find the purchase record
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: (session.user as any).id,
        collectionVideoId: checkoutSession.metadata?.collectionVideoId,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Get video details separately
    const video = await prisma.collectionVideo.findUnique({
      where: { id: purchase.collectionVideoId },
      include: { collection: true },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase record not found' },
        { status: 404 }
      );
    }

    // Track successful verification
    await trackEvent({
      name: 'purchase_verified',
      properties: {
        userId: (session.user as any).id,
        videoId: purchase.collectionVideoId,
        purchaseId: purchase.id,
        sessionId,
        amount: checkoutSession.amount_total,
      },
    });

    return NextResponse.json({
      valid: true,
      purchase: {
        id: purchase.id,
        expiresAt: purchase.expiresAt,
        CollectionVideo: video,
      },
      session: {
        id: checkoutSession.id,
        payment_status: checkoutSession.payment_status,
        amount_total: checkoutSession.amount_total,
      },
    });
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    
    await trackError(error as Error, {
      endpoint: '/api/verify-purchase',
      method: 'POST',
    });
    
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
} 