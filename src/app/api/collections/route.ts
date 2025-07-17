import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const mediaItems = await prismaClient.collectionVideo.findMany({
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

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
} 