import { NextRequest, NextResponse } from 'next/server';
// TODO: Integrate NextAuth admin check and UploadThing logic if needed.

export async function POST(req: NextRequest) {
  // TODO: Implement admin check and upload logic
  return NextResponse.json({ error: 'Not implemented. Supabase logic removed.' }, { status: 501 });
}

export async function PUT(req: NextRequest) {
  // TODO: Replace Supabase logic with NextAuth if needed.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, subtitle, displayOrder } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing video id' }, { status: 400 });
    }
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    await prisma.heroVideo.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error in PUT /api/admin/hero-videos:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 