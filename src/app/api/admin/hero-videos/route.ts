import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videos = await prisma.heroVideo.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching hero videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero videos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, videoUrl, order } = body;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Title and video URL are required' },
        { status: 400 }
      );
    }

    const video = await prisma.heroVideo.create({
      data: {
        title,
        description: description || '',
        videoUrl,
        thumbnail: videoUrl, // Use video URL as thumbnail for now
        order: order || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error creating hero video:', error);
    return NextResponse.json(
      { error: 'Failed to create hero video' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, videoUrl, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const video = await prisma.heroVideo.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description || '',
        videoUrl,
        thumbnail: videoUrl, // Use video URL as thumbnail for now
        order: order || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error updating hero video:', error);
    return NextResponse.json(
      { error: 'Failed to update hero video' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    await prisma.heroVideo.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hero video:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero video' },
      { status: 500 }
    );
  }
} 