import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { serverUpload } from '@/lib/services/serverUploadService';

// Validation schemas
const heroVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnailPath: z.string().optional(),
  order: z.number().int().min(1).max(3),
  price: z.number().min(0).default(0),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft'),
  ageRating: z.enum(['G', 'PG', 'PG-13', 'R']).default('PG'),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  rejectionReason: z.string().optional(),
});

const updateHeroVideoSchema = heroVideoSchema.extend({
  id: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const ageRating = searchParams.get('ageRating');

    const where = {
      ...(status && status !== 'all' ? { status } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(ageRating && ageRating !== 'all' ? { ageRating } : {}),
    };

    const videos = await prisma.heroVideo.findMany({ 
      where,
      orderBy: { order: 'asc' },
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
        moderated: true,
        moderatedBy: true,
        moderatedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return NextResponse.json(videos);
  } catch (err) {
    console.error("Error in GET /api/hero-videos:", err);
    return NextResponse.json(
      { error: "Failed to fetch hero videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fields, uploadedFileUrl, uploadedFilePath } = await serverUpload(req);

    if (!uploadedFileUrl || !uploadedFilePath) {
      return NextResponse.json(
        { error: 'File upload failed.' },
        { status: 400 }
      );
    }
    
    // Formidable returns fields as arrays, so we extract the first element.
    const rawData = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value?.[0]])
    );

    const validatedData = heroVideoSchema.parse({
      ...rawData,
      order: rawData.order ? parseInt(rawData.order as string, 10) : undefined,
      price: rawData.price ? parseFloat(rawData.price as string) : undefined,
      videoUrl: uploadedFileUrl,
      // Assuming thumbnail is also uploaded or handled separately
      thumbnail: rawData.thumbnail || 'https://via.placeholder.com/150', 
    });

    // Check if slot is already taken
    const existingVideo = await prisma.heroVideo.findFirst({
      where: { order: validatedData.order }
    });

    if (existingVideo) {
      return NextResponse.json(
        { error: `Slot ${validatedData.order} is already taken` },
        { status: 400 }
      );
    }

    // Set initial status to pending if not draft
    let finalStatus = validatedData.status;
    if (finalStatus !== 'draft') {
      finalStatus = 'pending';
    }

    const video = await prisma.heroVideo.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail,
        videoUrl: validatedData.videoUrl,
        order: validatedData.order,
        price: validatedData.price,
        status: finalStatus,
        ageRating: validatedData.ageRating,
        category: validatedData.category,
        tags: validatedData.tags,
        moderated: false,
        videoPath: uploadedFilePath,
      },
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
        moderated: true,
        createdAt: true,
        updatedAt: true,
        videoPath: true,
      }
    });
    
    return NextResponse.json(video);
  } catch (err) {
    console.error("Error in POST /api/hero-videos:", err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create hero video" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate input
    const validatedData = updateHeroVideoSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    // Check if updating order would conflict with another video
    if (updateData.order) {
      const existingVideo = await prisma.heroVideo.findFirst({
        where: { 
          order: updateData.order,
          id: { not: id }
        }
      });
      
      if (existingVideo) {
        return NextResponse.json(
          { error: `Slot ${updateData.order} is already taken` },
          { status: 400 }
        );
      }
    }

    // Handle status changes
    if (updateData.status) {
      (updateData as any).moderatedAt = new Date();
      // In a real app, you would get the moderator's ID from the session
      (updateData as any).moderatedBy = 'system';
    }

    const video = await prisma.heroVideo.update({ 
      where: { id },
      data: updateData,
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
        moderated: true,
        moderatedBy: true,
        moderatedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(video);
  } catch (err: unknown) {
    console.error("Error in PUT /api/hero-videos:", err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Hero video not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update hero video" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    await prisma.heroVideo.delete({ 
      where: { id },
      select: { id: true } // Only return the ID to confirm deletion
    });
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error in DELETE /api/hero-videos:", err);
    
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: "Hero video not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete hero video" },
      { status: 500 }
    );
  }
} 