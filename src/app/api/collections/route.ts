import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('Collection')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ data });
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