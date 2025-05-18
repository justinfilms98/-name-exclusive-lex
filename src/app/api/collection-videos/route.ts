import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const pricingSchema = z.object({
  type: z.enum(['one_time', 'subscription', 'rental']),
  price: z.number().min(0),
  currency: z.string().length(3),
  duration: z.number().optional(),
  discount: z.number().min(0).max(100).optional(),
  promoCode: z.string().optional(),
  region: z.string().optional(),
  isActive: z.boolean().default(true),
});

const collectionVideoSchema = z.object({
  collection: z.string().min(1, "Collection name is required"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnailPath: z.string().optional(),
  videoPath: z.string().optional(),
  order: z.number().int().min(1),
  category: z.string().min(1, "Category is required"),
  ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).default('PG'),
  tags: z.array(z.string()).default([]),
  pricing: z.array(pricingSchema).min(1, "At least one pricing option is required"),
});

const updateCollectionVideoSchema = collectionVideoSchema.extend({
  id: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/collection-videos');
    const videos = await prisma.collectionVideo.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        collection: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        thumbnailPath: true,
        videoPath: true,
        order: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(videos);
  } catch (err) {
    console.error('Error in GET /api/collection-videos:', err);
    return NextResponse.json(
      { error: 'Failed to fetch collection videos', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('POST /api/collection-videos', data);
    
    // Validate input
    const validatedData = collectionVideoSchema.parse(data);

    // Only pick fields that exist in the Prisma model
    const {
      collection, title, description, thumbnail, videoUrl, thumbnailPath, videoPath, order
    } = validatedData;
    // Price is not in the Zod schema but is required by Prisma
    const safePrice = typeof (validatedData as any).price === 'number' ? (validatedData as any).price : 0;

    // Check if slot is already taken in this collection
    const existingVideo = await prisma.collectionVideo.findFirst({
      where: {
        collection,
        order,
      }
    });
    
    if (existingVideo) {
      return NextResponse.json(
        { error: `Slot ${order} is already taken in collection ${collection}` },
        { status: 400 }
      );
    }

    const video = await prisma.collectionVideo.create({ 
      data: {
        collection,
        title,
        description,
        thumbnail,
        videoUrl,
        thumbnailPath,
        videoPath,
        order,
        price: safePrice,
      },
      select: {
        id: true,
        collection: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        thumbnailPath: true,
        videoPath: true,
        order: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video);
  } catch (err) {
    console.error('Error in POST /api/collection-videos:', err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create collection video" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('PUT /api/collection-videos', data);
    
    // Validate input
    const validatedData = updateCollectionVideoSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    // Check if slot is already taken by another video in this collection
    const existingVideo = await prisma.collectionVideo.findFirst({
      where: {
        collection: updateData.collection,
        order: updateData.order,
        id: { not: id }, // Exclude current video
      }
    });
    
    if (existingVideo) {
      return NextResponse.json(
        { error: `Slot ${updateData.order} is already taken in collection ${updateData.collection}` },
        { status: 400 }
      );
    }

    const video = await prisma.collectionVideo.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        collection: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        thumbnailPath: true,
        videoPath: true,
        order: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video);
  } catch (err) {
    console.error('Error in PUT /api/collection-videos:', err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update collection video" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('DELETE /api/collection-videos', data);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const video = await prisma.collectionVideo.delete({
      where: { id: parseInt(id) },
      select: {
        thumbnailPath: true,
        videoPath: true,
      }
    });

    // TODO: Delete files from storage
    // This would require importing the deleteFile function from uploadService
    // and calling it for both thumbnail and video if paths exist
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/collection-videos:', err);
    return NextResponse.json(
      { error: "Failed to delete collection video" },
      { status: 500 }
    );
  }
} 