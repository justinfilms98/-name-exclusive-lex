import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
});

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            mediaItems: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validatedData = collectionSchema.parse(data);

    const collection = await prisma.collection.create({
      data: {
        id: randomUUID(),
        name: validatedData.name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
} 