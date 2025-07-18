// =====================================================
// STRIPE CHECKOUT API ROUTE
// Handles creation of Stripe checkout sessions for content purchases
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rateLimit';
import { RATE_LIMITS } from '@/lib/rateLimit';
import { createCheckoutSession } from '@/lib/stripe';
import { trackEvent, trackError } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.API_CHECKOUT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          }
        }
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

    // Parse request body
    const body = await request.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Fetch media item from database
    const media = await prisma.collectionVideo.findUnique({
      where: { id: mediaId },
      include: { collection: true },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    if (!media.price || Number(media.price) <= 0) {
      return NextResponse.json(
        { error: 'Invalid price for this item' },
        { status: 400 }
      );
    }

    // Check if user already purchased this item
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: (session.user as any).id,
        collectionVideoId: mediaId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this content' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'https://exclusivelex.com';
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/collections?canceled=true`;

    const checkoutSession = await createCheckoutSession({
      userId: (session.user as any).id,
      collectionVideoId: mediaId,
      title: media.title,
      price: Number(media.price),
      successUrl,
      cancelUrl,
    });

    // Track the checkout initiation
    await trackEvent({
      name: 'checkout_initiated',
      properties: {
        media_id: media.id,
        media_title: media.title,
        price: Number(media.price),
      },
      userId: (session.user as any).id,
    });

    // TODO: Send notification to admin about new checkout
    // await sendAdminNotificationEmail(adminEmail, 'new_checkout', {
    //   userId: session.user.id,
    //   mediaTitle: media.title,
    //   price: Number(media.price),
    // });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    
    // Track the error
    await trackError(error as Error, {
      endpoint: '/api/checkout',
      method: 'POST',
    });

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 