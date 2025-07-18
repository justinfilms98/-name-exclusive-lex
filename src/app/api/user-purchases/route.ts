import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { getAuthOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchases = await prisma.purchase.findMany({
      where: { userId: (session.user as any).id },
      include: {
        CollectionVideo: {
          include: {
            collection: true,
          },
        },
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
} 