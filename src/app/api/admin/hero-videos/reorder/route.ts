import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'Invalid ordered IDs format' },
        { status: 400 }
      );
    }

    // Update each video's order
    for (const { id, order } of orderedIds) {
      await prisma.heroVideo.update({
        where: { id: parseInt(id) },
        data: { 
          order: order,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering hero videos:', error);
    return NextResponse.json(
      { error: 'Failed to reorder hero videos' },
      { status: 500 }
    );
  }
} 