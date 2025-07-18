import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const videos = await prisma.heroVideo.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    return NextResponse.json({ error: 'Failed to fetch hero videos' }, { status: 500 });
  }
} 