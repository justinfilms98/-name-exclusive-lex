import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if user has a valid purchase for this video
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: (session.user as any).id,
        collectionVideoId: videoId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        CollectionVideo: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ 
        hasAccess: false,
        message: 'No valid purchase found for this video' 
      }, { status: 403 });
    }

    return NextResponse.json({
      hasAccess: true,
      purchase: {
        id: purchase.id,
        expiresAt: purchase.expiresAt,
        video: {
          id: purchase.CollectionVideo.id,
          title: purchase.CollectionVideo.title,
        },
      },
    });

  } catch (error) {
    console.error('Error verifying purchase access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 