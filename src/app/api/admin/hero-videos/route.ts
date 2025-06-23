import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSupabasePublicUrl } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function isAdmin(req: NextRequest): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'admin';
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const order = formData.get('order') as string;
    const videoFile = formData.get('videoFile') as File | null;
    const thumbnailFile = formData.get('thumbnailFile') as File | null;

    if (!title || !description || !order || !videoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const videoContents = Buffer.from(await videoFile.arrayBuffer());
    const videoPath = `hero/${Date.now()}-${videoFile.name}`;
    
    const { error: videoError } = await supabaseAdmin.storage
      .from('videos')
      .upload(videoPath, videoContents, { contentType: videoFile.type! });

    if (videoError) throw new Error(`Video upload failed: ${videoError.message}`);

    let thumbPath: string | null = null;
    if (thumbnailFile) {
      const thumbContents = Buffer.from(await thumbnailFile.arrayBuffer());
      thumbPath = `hero/thumbnails/${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbPath, thumbContents, { contentType: thumbnailFile.type! });
      if (thumbError) console.error('Thumbnail upload failed:', thumbError.message);
    }

    await prisma.heroVideo.create({
      data: {
        title,
        description,
        order: parseInt(order, 10),
        videoPath,
        thumbnailPath: thumbPath,
        videoUrl: getSupabasePublicUrl(videoPath),
        thumbnail: thumbPath ? getSupabasePublicUrl(thumbPath) : '/fallback-thumbnail.png',
        status: 'approved',
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/admin/hero-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 