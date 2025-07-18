import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();

    const purchase = await prismaClient.purchase.findFirst({
      where: {
        userId: (session.user as any).id,
        collectionVideoId: videoId,
        expiresAt: { gt: new Date() },
      },
      include: {
        CollectionVideo: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      purchase: {
        id: purchase.id,
        expiresAt: purchase.expiresAt,
        CollectionVideo: purchase.CollectionVideo,
      },
    });
  } catch (error: any) {
    console.error('Error verifying purchase access:', error);
    return NextResponse.json(
      { error: 'Failed to verify purchase access' },
      { status: 500 }
    );
  }
} 