import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSupabasePublicUrl } from '@/lib/utils';

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
    const collectionId = formData.get('collectionId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string | null;
    const durationSeconds = formData.get('durationSeconds') as string | null;
    const seoTags = formData.get('seoTags') as string | null;
    const videoFile = formData.get('videoFile') as File | null;
    const thumbnailFile = formData.get('thumbnailFile') as File | null;

    if (!collectionId || !title || !description || !videoFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const videoContents = Buffer.from(await videoFile.arrayBuffer());
    // Sanitize title for use in path
    const safeTitle = collection.title.replace(/[^a-zA-Z0-9]/g, '_');
    const videoPath = `collections/${safeTitle}/${Date.now()}-${videoFile.name}`;
    
    const { error: videoError } = await supabaseAdmin.storage
      .from('collection-media') // Recommended to have a dedicated bucket
      .upload(videoPath, videoContents, { contentType: videoFile.type!, upsert: true });

    if (videoError) throw new Error(`Video upload failed: ${videoError.message}`);

    let thumbUrl: string | null = null;
    if (thumbnailFile) {
      const thumbContents = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbPath = `collections/${safeTitle}/thumbnails/${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbError } = await supabaseAdmin.storage
        .from('collection-media') // Upload to the same bucket
        .upload(thumbPath, thumbContents, { contentType: thumbnailFile.type!, upsert: true });
      if (thumbError) {
        console.error('Thumbnail upload failed:', thumbError.message);
      } else {
        thumbUrl = getSupabasePublicUrl(thumbPath);
      }
    }

    await prisma.collectionMedia.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : undefined,
        seoTags: seoTags ? seoTags.split(',').map(tag => tag.trim()) : [],
        videoUrl: getSupabasePublicUrl(videoPath),
        thumbnailUrl: thumbUrl,
        collectionId: collectionId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error in /api/admin/collection-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 