import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This forces the route to be dynamic, ensuring it's not cached
// and that it fetches fresh data on every request.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videos = await prisma.heroVideo.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
      take: 3,
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching hero videos:', error);
    return NextResponse.json({ error: 'Failed to fetch hero videos' }, { status: 500 });
  }
} 