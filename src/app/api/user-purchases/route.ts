import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get purchases first, then get video details separately
    const purchases = await prisma.purchase.findMany({
      where: { userId: (session.user as any).id },
    });

    // Get video details for each purchase
    const purchasesWithVideos = await Promise.all(
      purchases.map(async (purchase) => {
        const video = await prisma.collectionVideo.findUnique({
          where: { id: purchase.collectionVideoId },
          include: { collection: true },
        });
        return { ...purchase, collectionVideo: video };
      })
    );

    return NextResponse.json(purchasesWithVideos);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
} 