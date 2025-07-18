import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const videos = await prisma.heroVideo.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    
    // Check if it's a connection error
    if (error.message?.includes('FATAL') || error.message?.includes('Tenant or user not found')) {
      console.error('Database connection failed. Check DATABASE_URL configuration.');
      return NextResponse.json({ 
        error: 'Database connection failed. Please check configuration.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch hero videos' }, { status: 500 });
  } finally {
    // Always disconnect to free up connections
    await prisma.$disconnect();
  }
} 