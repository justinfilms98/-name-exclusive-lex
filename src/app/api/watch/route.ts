import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const access = await prisma.timedAccess.findFirst({
    where: {
      // @ts-ignore
      userId: session.user.id,
      videoId: videoId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!access) {
    return NextResponse.json({ error: 'Access denied or expired' }, { status: 403 });
  }

  // To generate the correct path, we need to look up the video's filePath.
  const mediaItem = await prisma.mediaItem.findUnique({
    where: {
      id: videoId,
    },
    select: {
      filePath: true,
    },
  });

  if (!mediaItem || !mediaItem.filePath) {
    return NextResponse.json({ error: 'Video file path not found.' }, { status: 404 });
  }

  // Generate a signed URL that expires in 60 seconds.
  // The video player on the client-side needs to fetch and load this URL within that timeframe.
  const { data, error } = await supabaseAdmin
    .storage
    .from('videos')
    .createSignedUrl(mediaItem.filePath, 60);

  if (error) {
    console.error('Error creating signed URL:', error);
    return NextResponse.json({ error: 'Could not create signed URL.' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
} 