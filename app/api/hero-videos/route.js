import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('hero_videos')
      .select('id, title, thumbnail_url, video_url');

    if (error) {
      console.error('Supabase error fetching hero videos:', error);
      return NextResponse.json({ error: 'DATABASE_ERROR', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ videos: data }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in /api/hero-videos:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', details: err.message }, { status: 500 });
  }
}

export function POST() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
} 