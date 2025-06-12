import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const mediaItemSchema = z.object({
  mediaType: z.enum(['video', 'photo']),
  filePath: z.string(), // Path in Supabase storage
  thumbnailPath: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  duration: z.number().optional(),
});

// Configure bodyParser for small JSON payloads only
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    const mediaItems = await prisma.mediaItem.findMany({
      where: { collectionId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        collection: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: mediaItems });
  } catch (error) {
    console.error('Error fetching collection items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection items' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    // Verify collection exists
    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Parse JSON data instead of FormData
    const data = await req.json();
    
    // Validate input
    const validatedData = mediaItemSchema.parse(data);

    // Create media item in database
    const mediaItem = await prisma.mediaItem.create({
      data: {
        collectionId: id,
        mediaType: validatedData.mediaType,
        filePath: validatedData.filePath,
        thumbnailPath: validatedData.thumbnailPath,
        description: validatedData.description,
        price: validatedData.price,
        duration: validatedData.duration,
      },
      include: {
        collection: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: mediaItem });
  } catch (error) {
    console.error('Error creating media item:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    );
  }
} 