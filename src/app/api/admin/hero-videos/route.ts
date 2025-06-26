import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const order = formData.get('order') as string;
    const subtitle = formData.get('subtitle') as string | null;
    const videoUrl = formData.get('videoUrl') as string | null;

    if (!title || !order || !videoUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.heroVideo.create({
      data: {
        title,
        subtitle: subtitle || null,
        videoUrl: videoUrl,
        displayOrder: parseInt(order, 10),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error in /api/admin/hero-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 