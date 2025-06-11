import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const collectionVideoSchema = z.object({
  collection: z.string().min(1, "Collection is required"),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnailPath: z.string().optional(),
  videoPath: z.string().optional(),
  price: z.number().min(0).default(0),
  order: z.number().int().min(1).max(20),
  duration: z.number().int().min(1).optional(),
  category: z.string().min(1, "Category is required"),
  ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).default('PG'),
  tags: z.array(z.string()).default([]),
});

const updateCollectionVideoSchema = collectionVideoSchema.extend({
  id: z.number().int().positive(),
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection');
    const category = searchParams.get('category');
    const ageRating = searchParams.get('ageRating');

    const where = {
      ...(collection && collection !== 'all' ? { collection } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(ageRating && ageRating !== 'all' ? { ageRating } : {}),
    };

    const videos = await prisma.collectionVideo.findMany({ 
      where,
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
        price: true,
        order: true,
        duration: true,
        category: true,
        ageRating: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(videos, { headers: corsHeaders });
  } catch (err) {
    console.error("Error in GET /api/collection-videos:", err);
    return NextResponse.json(
      { error: "Failed to fetch collection videos" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate input
    const validatedData = collectionVideoSchema.parse(data);

    // Check if order is already taken in this collection
    const existingVideo = await prisma.collectionVideo.findFirst({
      where: { 
        collection: validatedData.collection,
        order: validatedData.order 
      }
    });

    if (existingVideo) {
      return NextResponse.json(
        { error: `Order ${validatedData.order} is already taken in collection "${validatedData.collection}"` },
        { status: 400, headers: corsHeaders }
      );
    }

    const video = await prisma.collectionVideo.create({
      data: validatedData,
      select: {
        id: true,
        collection: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        thumbnailPath: true,
        videoPath: true,
        price: true,
        order: true,
        duration: true,
        category: true,
        ageRating: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error("Error in POST /api/collection-videos:", err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create collection video" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate input
    const validatedData = updateCollectionVideoSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    // Check if updating order would conflict with another video in the same collection
    if (updateData.order) {
      const existingVideo = await prisma.collectionVideo.findFirst({
        where: { 
          collection: updateData.collection,
          order: updateData.order,
          id: { not: id }
        }
      });
      
      if (existingVideo) {
        return NextResponse.json(
          { error: `Order ${updateData.order} is already taken in collection "${updateData.collection}"` },
          { status: 400, headers: corsHeaders }
        );
      }
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
        price: true,
        order: true,
        duration: true,
        category: true,
        ageRating: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Error in PUT /api/collection-videos:", err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Collection video not found" },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update collection video" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    await prisma.collectionVideo.delete({ 
      where: { id },
      select: { id: true }
    });
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Error in DELETE /api/collection-videos:", err);
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Collection video not found" },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete collection video" },
      { status: 500, headers: corsHeaders }
    );
  }
} 