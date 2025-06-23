import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { videoId } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const video = await prisma.collectionMedia.findUnique({
      where: { id: videoId },
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