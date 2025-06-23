import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import { readFileSync } from 'fs';
import { getSupabasePublicUrl } from '@/lib/utils';

// Helper to parse FormData
async function parseFormData(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 2,
      maxFileSize: 1024 * 1024 * 1024, // 1GB
    });
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Ensure the user is an admin before proceeding
async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { fields, files } = await parseFormData(req);
    const { title, description, order } = fields;
    const { videoFile, thumbnailFile } = files;

    if (!title || !description || !order || !videoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Upload video file
    const video = videoFile[0];
    const videoContents = readFileSync(video.filepath);
    const videoPath = `hero/${Date.now()}-${video.originalFilename}`;
    const { error: videoError } = await supabaseAdmin.storage
      .from('videos')
      .upload(videoPath, videoContents, { contentType: video.mimetype! });

    if (videoError) throw new Error(`Video upload failed: ${videoError.message}`);

    // 2. Upload thumbnail file (if it exists)
    let thumbPath: string | null = null;
    if (thumbnailFile) {
      const thumbnail = thumbnailFile[0];
      const thumbContents = readFileSync(thumbnail.filepath);
      thumbPath = `hero/thumbnails/${Date.now()}-${thumbnail.originalFilename}`;
      const { error: thumbError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbPath, thumbContents, { contentType: thumbnail.mimetype! });
      if (thumbError) console.error('Thumbnail upload failed:', thumbError.message); // Don't block if only thumbnail fails
    }

    // 3. Create database record
    await prisma.heroVideo.create({
      data: {
        title: title[0],
        order: parseInt(order[0], 10),
        videoPath: videoPath,
        videoUrl: getSupabasePublicUrl(videoPath),
        thumbnail: thumbPath ? getSupabasePublicUrl(thumbPath) : '/fallback-thumbnail.png',
        description: description[0],
        status: 'approved',
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/admin/hero-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 