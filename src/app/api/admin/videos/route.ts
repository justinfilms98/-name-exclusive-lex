import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: Request) {
  const adminCheck = await requireAdmin()
  if (adminCheck) return adminCheck

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'creator') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, description, price, type, videoKey, thumbnailKey } = await req.json()
    
    if (!title || !description || !price || !type || !videoKey || !thumbnailKey) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        price,
        type,
        videoKey,
        thumbnailKey,
        creatorId: session.user.id
      }
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error creating video:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET() {
  const adminCheck = await requireAdmin()
  if (adminCheck) return adminCheck

  const videos = await prisma.video.findMany({
    include: {
      creator: {
        select: {
          name: true,
          image: true
        }
      }
    }
  })
  return NextResponse.json(videos)
} 