import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching collection videos...');
    
    // Test database connection first
    await prisma.$connect();
    console.log('Database connected successfully');
    
    const videos = await prisma.collectionVideo.findMany({
      orderBy: { order: 'asc' },
      include: {
        collection: true,
      },
    });
    
    console.log(`Found ${videos.length} collection videos`);
    return NextResponse.json(videos);
  } catch (err) {
    console.error('Error in GET /api/collection-videos:', err);
    
    // More detailed error response
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch collection videos',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}