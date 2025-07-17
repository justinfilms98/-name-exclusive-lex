import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Dynamic import to prevent Prisma instantiation during build
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
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

    const collection = await prismaClient.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // TODO: Save video and thumbnail URLs from UploadThing
    const videoPath = '';
    const thumbUrl = '';

    // Get the highest order value for this collection and increment by 1
    const maxOrder = await prismaClient.collectionVideo.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    await prismaClient.collectionVideo.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : 0,
        videoUrl: videoPath,
        thumbnail: thumbUrl,
        collectionId: collectionId,
        order: (maxOrder?.order ?? -1) + 1,
        durationMinutes: 10,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error in /api/admin/collection-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 