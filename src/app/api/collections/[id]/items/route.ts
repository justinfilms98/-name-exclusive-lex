import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const mediaItemSchema = z.object({
  mediaType: z.enum(['video', 'photo']),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  duration: z.number().optional(),
});

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const thumbnail = formData.get('thumbnail') as File;
    const mediaType = formData.get('mediaType') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string) || 0;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate media type
    if (!['video', 'photo'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Generate unique file paths
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `media/${id}/${fileName}`;

    let thumbnailPath: string | undefined;
    if (thumbnail) {
      const thumbnailExtension = thumbnail.name.split('.').pop();
      const thumbnailName = `thumb-${Date.now()}-${Math.random().toString(36).substring(7)}.${thumbnailExtension}`;
      thumbnailPath = `media/${id}/${thumbnailName}`;
    }

    // Upload file to Supabase Storage
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from('media')
      .upload(filePath, file);

    if (fileError) {
      console.error('File upload error:', fileError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Upload thumbnail if provided
    if (thumbnail && thumbnailPath) {
      const { error: thumbnailError } = await supabaseAdmin.storage
        .from('media')
        .upload(thumbnailPath, thumbnail);

      if (thumbnailError) {
        console.error('Thumbnail upload error:', thumbnailError);
        // Continue without thumbnail if upload fails
      }
    }

    // Create media item in database
    const mediaItem = await prisma.mediaItem.create({
      data: {
        collectionId: id,
        mediaType,
        filePath,
        thumbnailPath,
        description,
        price,
        duration,
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
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    );
  }
} 