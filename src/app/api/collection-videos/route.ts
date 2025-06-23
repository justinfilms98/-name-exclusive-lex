import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const videos = await prisma.collectionVideo.findMany({
      orderBy: { order: 'asc' },
      include: {
        collection: true,
      }
    });
    return NextResponse.json(videos);
  } catch (err) {
    console.error('Error in GET /api/collection-videos:', err);
    return NextResponse.json(
      { error: 'Failed to fetch collection videos' },
      { status: 500 }
    );
  }
} 