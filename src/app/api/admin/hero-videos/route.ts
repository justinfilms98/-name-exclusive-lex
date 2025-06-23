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

  // Use the admin client to bypass RLS for this check
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user role with admin client:', error);
    return false;
  }

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
    const price = formData.get('price') as string | null;
    const duration = formData.get('duration') as string | null;
    const seoTags = formData.get('seoTags') as string | null;
    const category = formData.get('category') as string | null;
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
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration, 10) : null,
        seoTags: seoTags ? seoTags.split(',').map(tag => tag.trim()) : [],
        category: category,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/admin/hero-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 