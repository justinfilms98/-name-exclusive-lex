import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function isAdmin(req: NextRequest): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  // Use the admin client to bypass RLS for this check
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user role with admin client:', error);
    return false;
  }

  return user?.role === 'admin';
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const order = formData.get('order') as string;
    const subtitle = formData.get('subtitle') as string | null;
    const videoUrl = formData.get('videoUrl') as string | null; // Now expecting a URL from UploadThing

    if (!title || !order || !videoUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create hero video with UploadThing URL
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