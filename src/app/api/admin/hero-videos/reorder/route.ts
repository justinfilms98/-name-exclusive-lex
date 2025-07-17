import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { videoIds } = await req.json();

    if (!Array.isArray(videoIds)) {
      return NextResponse.json({ error: 'Video IDs array is required' }, { status: 400 });
    }

    // Update the order of each video
    for (let i = 0; i < videoIds.length; i++) {
      await prisma.heroVideo.update({
        where: { id: videoIds[i] },
        data: { order: i },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering hero videos:', error);
    return NextResponse.json({ error: 'Failed to reorder videos' }, { status: 500 });
  }
} 