import { NextRequest, NextResponse } from 'next/server';
// TODO: Integrate NextAuth admin check and UploadThing logic if needed.

export async function POST(req: NextRequest) {
  // TODO: Implement admin check and upload logic
  return NextResponse.json({ error: 'Not implemented. Supabase logic removed.' }, { status: 501 });
}

export async function PUT(req: NextRequest) {
  // TODO: Implement admin check and update logic
  return NextResponse.json({ error: 'Not implemented. Supabase logic removed.' }, { status: 501 });
} 