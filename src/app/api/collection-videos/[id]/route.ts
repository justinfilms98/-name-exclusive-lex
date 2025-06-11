import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const video = await prisma.collectionVideo.findUnique({
      where: { id },
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

    if (!video) {
      return NextResponse.json(
        { error: "Collection video not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(video, { headers: corsHeaders });
  } catch (err) {
    console.error("Error in GET /api/collection-videos/[id]:", err);
    return NextResponse.json(
      { error: "Failed to fetch collection video" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await req.json();
    
    // Validate input (excluding id since it comes from params)
    const updateSchema = z.object({
      collection: z.string().min(1, "Collection is required").optional(),
      title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
      description: z.string().min(1, "Description is required").max(500, "Description too long").optional(),
      thumbnail: z.string().url("Invalid thumbnail URL").optional(),
      videoUrl: z.string().url("Invalid video URL").optional(),
      thumbnailPath: z.string().optional(),
      videoPath: z.string().optional(),
      price: z.number().min(0).optional(),
      order: z.number().int().min(1).max(20).optional(),
      duration: z.number().int().min(1).optional(),
      category: z.string().min(1, "Category is required").optional(),
      ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).optional(),
      tags: z.array(z.string()).optional(),
    });

    const validatedData = updateSchema.parse(data);
    
    // Check if updating order would conflict with another video in the same collection
    if (validatedData.order && validatedData.collection) {
      const existingVideo = await prisma.collectionVideo.findFirst({
        where: { 
          collection: validatedData.collection,
          order: validatedData.order,
          id: { not: id }
        }
      });
      
      if (existingVideo) {
        return NextResponse.json(
          { error: `Order ${validatedData.order} is already taken in collection "${validatedData.collection}"` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const video = await prisma.collectionVideo.update({ 
      where: { id },
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
    
    return NextResponse.json(video, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Error in PUT /api/collection-videos/[id]:", err);
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
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
    console.error("Error in DELETE /api/collection-videos/[id]:", err);
    
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