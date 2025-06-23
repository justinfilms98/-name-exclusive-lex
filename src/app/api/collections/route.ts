import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const collectionSchema = z.object({
  title: z.string().min(1, "Collection title is required"),
  description: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: {
        title: 'asc',
      },
    });
    return NextResponse.json(collections);
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validatedData = collectionSchema.parse(data);

    const collection = await prisma.collection.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
      },
    });

    return NextResponse.json(collection);
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