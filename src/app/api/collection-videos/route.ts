import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const videos = await prismaClient.collectionVideo.findMany({
      orderBy: { order: 'asc' },
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