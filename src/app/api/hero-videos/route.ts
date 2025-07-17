import { NextRequest, NextResponse } from 'next/server';

// This forces the route to be dynamic, ensuring it's not cached
// and that it fetches fresh data on every request.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const videos = await prisma.heroVideo.findMany({
      where: {
        status: 'published',
        moderated: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero videos' },
      { status: 500 }
    );
  }
} 