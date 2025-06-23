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
    const video = await prisma.collectionVideo.findUnique({
      where: { id: videoId },
    });

    if (!video || !video.videoPath) {
      return NextResponse.json({ error: 'Video not found or path is missing' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .storage
      .from('videos')
      .createSignedUrl(video.videoPath, 3600); // URL valid for 1 hour

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ signedUrl: data.signedUrl });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get signed URL' }, { status: 500 });
  }
} 