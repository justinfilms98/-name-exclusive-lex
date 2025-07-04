import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TODO: Add NextAuth admin check here if needed
async function isAdmin(_req: NextRequest): Promise<boolean> {
  // Implement admin check with NextAuth session
  return true;
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
    // TODO: Integrate UploadThing file upload logic here
    // const videoFile = formData.get('videoFile') as File | null;
    // const thumbnailFile = formData.get('thumbnailFile') as File | null;

    if (!collectionId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // TODO: Save video and thumbnail URLs from UploadThing
    const videoPath = '';
    const thumbUrl = '';

    // Get the highest order value for this collection and increment by 1
    const maxOrder = await prisma.collectionVideo.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    await prisma.collectionVideo.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : 0,
        videoUrl: videoPath,
        thumbnail: thumbUrl,
        collectionId: collectionId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error in /api/admin/collection-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 