import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const videos = await prisma.collectionVideo.findMany({ orderBy: [{ collection: 'asc' }, { order: 'asc' }] });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const video = await prisma.collectionVideo.create({ data });
  return NextResponse.json(video);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { id, ...rest } = data;
  const video = await prisma.collectionVideo.update({ where: { id }, data: rest });
  return NextResponse.json(video);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.collectionVideo.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 