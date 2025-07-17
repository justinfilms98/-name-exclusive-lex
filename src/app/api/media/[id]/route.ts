import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract the id from the pathname
    const segments = request.nextUrl.pathname.split('/');
    const id = segments[segments.indexOf('media') + 1];

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();

    const media = await prismaClient.collectionVideo.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        videoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
} 