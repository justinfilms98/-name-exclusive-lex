import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { trackError } from '@/lib/analytics';

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { prisma } = await import('@/lib/prisma');

    const purchases = await prisma.purchase.findMany({
      where: { userId: (session.user as any).id },
      include: {
        CollectionVideo: {
          include: {
            collection: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error('Error fetching user purchases:', error);
    
    await trackError(error as Error, {
      endpoint: '/api/user-purchases',
      method: 'GET',
    });
    
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
} 