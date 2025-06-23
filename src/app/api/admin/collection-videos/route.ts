import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// Ensure the user is an admin before proceeding
async function isAdmin(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set.");
  }
  const token = await getToken({ req, secret });
  return token?.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    // Basic validation
    const { title, description, price, duration, collection, videoPath, thumbnailPath, seoTags } = body;
    if (!title || !description || !price || !duration || !collection || !videoPath) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newVideo = await prisma.collectionVideo.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          duration: parseInt(duration, 10),
          collection,
          videoPath,
          thumbnailPath,
          seoTags,
          // These fields might need defaults or to be passed from the form
          thumbnail: thumbnailPath || 'default_thumbnail.jpg', // placeholder
          videoUrl: videoPath, // placeholder
          order: 0, // placeholder
        }
    });

    return NextResponse.json(newVideo, { status: 201 });

  } catch (error: any) {
    console.error('Error creating collection video:', error);
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A video with this title already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create video.' }, { status: 500 });
  }
} 