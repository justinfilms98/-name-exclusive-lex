import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getSupabasePublicUrl } from '@/lib/utils';
import { getToken } from 'next-auth/jwt';

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

// Simplified validation schema for the new form
const postSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  order: z.number().int(),
  videoPath: z.string().min(1, "Video path is required"),
  thumbnailPath: z.string().optional(),
  price: z.number().min(0).default(0),
  duration: z.number().min(1).default(1),
  seoTags: z.string().optional(),
});

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.role === 'admin';
}

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
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = postSchema.parse(body);
    
    const { id, title, description, order, videoPath, thumbnailPath, price, duration, seoTags } = validatedData;

    // Data payload for both create and update
    const dataPayload = {
      title,
      description,
      order,
      videoPath,
      videoUrl: getSupabasePublicUrl(videoPath),
      thumbnailPath: thumbnailPath || null,
      thumbnail: thumbnailPath ? getSupabasePublicUrl(thumbnailPath) : getSupabasePublicUrl(videoPath.replace(/\.[^/.]+$/, "") + ".jpg"), // Fallback for thumbnail
      // Set default values for other required fields in the complex schema
      status: 'draft',
      ageRating: 'PG',
      category: 'general',
      tags: [],
      price,
      duration,
      seoTags,
      moderated: false,
    };
    
    // Use upsert to either create a new video or update an existing one
    const heroVideo = await prisma.heroVideo.upsert({
      where: { id: id || -1 }, // A non-matching ID for creation
      create: dataPayload,
      update: {
        ...dataPayload,
        // Exclude order from update if you don't want it to change, or handle separately
      },
    });

    return NextResponse.json(heroVideo);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error("Error in POST /api/hero-videos:", error);
    // Be more specific about DB errors if possible
    return NextResponse.json({ error: 'An unexpected error occurred while saving the hero video.' }, { status: 500 });
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