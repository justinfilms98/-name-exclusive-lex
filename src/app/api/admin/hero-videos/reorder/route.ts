import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { orderedIds } = await req.json();

  for (const { id, order } of orderedIds) {
    await supabase.from('hero_videos').update({ order }).eq('id', id);
  }

  return NextResponse.json({ success: true });
} 