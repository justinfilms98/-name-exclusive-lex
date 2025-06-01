import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const videos = await prisma.collectionVideo.findMany();
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 