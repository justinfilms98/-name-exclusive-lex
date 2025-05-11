import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const video = await prisma.video.findUnique({
      where: { id: params.videoId },
      include: {
        creator: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if user has purchased the video
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        videoId: video.id,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    const hasAccess = purchase !== null || video.creatorId === session.user.id

    return NextResponse.json({
      ...video,
      hasAccess,
      expiresAt: purchase?.expiresAt || null
    })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
} 