import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching hero videos...');
    
    // Test database connection first
    await prisma.$connect();
    console.log('Database connected successfully');
    
    const videos = await prisma.heroVideo.findMany({
      orderBy: { order: 'asc' },
    });
    
    console.log(`Found ${videos.length} hero videos`);
    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ 
      error: 'Failed to fetch hero videos',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 