import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { collectionVideoId } = await req.json();

  try {
    const video = await prisma.collectionVideo.findUnique({
      where: { id: collectionVideoId },
    });

    if (!video || !video.videoUrl) {
      return NextResponse.json({ error: 'Video not found or URL is missing' }, { status: 404 });
    }

    // For now, return the direct video URL since we're not using signed URLs
    return NextResponse.json({ signedUrl: video.videoUrl });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get signed URL' }, { status: 500 });
  }
} 