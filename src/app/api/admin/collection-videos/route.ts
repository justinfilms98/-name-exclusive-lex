import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import { readFileSync } from 'fs';
import { getSupabasePublicUrl } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseFormData(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

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
    const { fields, files } = await parseFormData(req);
    const { collectionId, title, description, price, duration, seoTags } = fields;
    const { videoFile, thumbnailFile } = files;

    if (!collectionId || !title || !description || !price || !duration || !videoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({ where: { id: collectionId[0] } });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const video = videoFile[0];
    const videoContents = readFileSync(video.filepath);
    const videoPath = `collections/${collection.name}/${Date.now()}-${video.originalFilename}`;
    
    const { error: videoError } = await supabaseAdmin.storage
      .from('videos')
      .upload(videoPath, videoContents, { contentType: video.mimetype! });

    if (videoError) throw new Error(`Video upload failed: ${videoError.message}`);

    let thumbPath: string | null = null;
    if (thumbnailFile) {
      const thumbnail = thumbnailFile[0];
      const thumbContents = readFileSync(thumbnail.filepath);
      thumbPath = `collections/${collection.name}/thumbnails/${Date.now()}-${thumbnail.originalFilename}`;
      const { error: thumbError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbPath, thumbContents, { contentType: thumbnail.mimetype! });
      if (thumbError) console.error('Thumbnail upload failed:', thumbError.message);
    }

    await prisma.collectionVideo.create({
      data: {
        collection: collection.name,
        collectionId: collectionId[0],
        title: title[0],
        description: description[0],
        price: parseFloat(price[0]),
        duration: parseInt(duration[0], 10),
        seoTags: seoTags ? seoTags[0].split(',').map(tag => tag.trim()) : [],
        videoPath,
        thumbnailPath: thumbPath,
        videoUrl: getSupabasePublicUrl(videoPath),
        thumbnail: thumbPath ? getSupabasePublicUrl(thumbPath) : '/fallback-thumbnail.png',
        order: 0,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/admin/collection-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 