import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const mediaItems = await safeDbOperation(
      async () => {
        const { prisma } = await import('@/lib/prisma');
        return await prisma.collectionVideo.findMany({
          where: {
            price: {
              gt: 0,
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            price: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      },
      [] // fallback empty array
    );

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
} 