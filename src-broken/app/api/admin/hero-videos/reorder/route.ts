import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { orderedIds } = await req.json();

  for (const { id, order } of orderedIds) {
    // TODO: Replace Supabase logic with NextAuth if needed.
  }

  return NextResponse.json({ success: true });
} 