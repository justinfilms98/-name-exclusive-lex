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

    const video = await prisma.heroVideo.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        order: true,
        price: true,
        status: true,
        ageRating: true,
        category: true,
        tags: true,
        moderatedBy: true,
        moderatedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: "Hero video not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(video, { headers: corsHeaders });
  } catch (err) {
    console.error("Error in GET /api/hero-videos/[id]:", err);
    return NextResponse.json(
      { error: "Failed to fetch hero video" },
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
      title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
      description: z.string().min(1, "Description is required").max(500, "Description too long").optional(),
      thumbnail: z.string().url("Invalid thumbnail URL").optional(),
      videoUrl: z.string().url("Invalid video URL").optional(),
      order: z.number().int().min(1).max(3).optional(),
      price: z.number().min(0).optional(),
      status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
      ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).optional(),
      category: z.string().min(1, "Category is required").optional(),
      tags: z.array(z.string()).optional(),
      rejectionReason: z.string().optional(),
    });

    const validatedData = updateSchema.parse(data);
    
    // Check if updating order would conflict with another video
    if (validatedData.order) {
      const existingVideo = await prisma.heroVideo.findFirst({
        where: { 
          order: validatedData.order,
          id: { not: id }
        }
      });
      
      if (existingVideo) {
        return NextResponse.json(
          { error: `Slot ${validatedData.order} is already taken` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Handle status changes
    if (validatedData.status) {
      (validatedData as any).moderatedAt = new Date();
      // In a real app, you would get the moderator's ID from the session
      (validatedData as any).moderatedBy = 'system';
    }

    const video = await prisma.heroVideo.update({ 
      where: { id },
      data: validatedData,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        order: true,
        price: true,
        status: true,
        ageRating: true,
        category: true,
        tags: true,
        moderatedBy: true,
        moderatedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Error in PUT /api/hero-videos/[id]:", err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Hero video not found" },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update hero video" },
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

    await prisma.heroVideo.delete({ 
      where: { id },
      select: { id: true }
    });
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Error in DELETE /api/hero-videos/[id]:", err);
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Hero video not found" },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete hero video" },
      { status: 500, headers: corsHeaders }
    );
  }
} 