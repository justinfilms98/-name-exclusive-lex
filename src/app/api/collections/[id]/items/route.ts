import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const mediaItems = await prisma.collectionMedia.findMany({
      where: { collectionId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        price: true,
        durationSeconds: true,
        seoTags: true,
        displayOrder: true,
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