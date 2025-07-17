import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Extract the collection id from the pathname
    const segments = req.nextUrl.pathname.split('/');
    const id = segments[segments.indexOf('collections') + 1];
    
    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();

    const mediaItems = await prismaClient.collectionVideo.findMany({
      where: { collectionId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        price: true,
        order: true,
        createdAt: true,
        collection: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching collection items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection items' },
      { status: 500 }
    );
  }
} 