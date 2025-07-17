import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const videos = await prismaClient.heroVideo.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    return NextResponse.json({ error: 'Failed to fetch hero videos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const videoUrl = formData.get('videoUrl') as string;
    const thumbnail = formData.get('thumbnail') as string;
    const price = formData.get('price') as string;

    if (!title || !description || !videoUrl || !thumbnail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the highest order value and increment by 1
    const maxOrder = await prismaClient.heroVideo.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const video = await prismaClient.heroVideo.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnail,
        price: price ? parseFloat(price) : 0,
        order: (maxOrder?.order ?? -1) + 1,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error creating hero video:', error);
    return NextResponse.json({ error: 'Failed to create hero video' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const video = await prismaClient.heroVideo.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error updating hero video:', error);
    return NextResponse.json({ error: 'Failed to update hero video' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const prismaClient = prisma();
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await prismaClient.heroVideo.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting hero video:', error);
    return NextResponse.json({ error: 'Failed to delete hero video' }, { status: 500 });
  }
} 