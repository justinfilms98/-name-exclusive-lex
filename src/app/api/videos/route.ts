import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Mock data for development
const mockVideos = [
  {
    id: '1',
    title: 'Sample Video 1',
    description: 'This is a sample video description',
    thumbnailKey: 'thumb1',
    price: 9.99,
    type: 'monthly',
    user: {
      name: 'Creator 1'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Sample Video 2',
    description: 'Another sample video description',
    thumbnailKey: 'thumb2',
    price: 19.99,
    type: 'yearly',
    user: {
      name: 'Creator 2'
    },
    createdAt: new Date().toISOString()
  }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Get all videos
    const videos = await prisma.video.findMany({
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // For each video, check if the user has purchased it
    const videosWithPurchaseStatus = await Promise.all(
      videos.map(async (video) => {
        let hasAccess = false
        let expiresAt = null

        if (session?.user?.id) {
          const purchase = await prisma.purchase.findFirst({
            where: {
              userId: session.user.id,
              videoId: video.id,
              expiresAt: {
                gt: new Date()
              }
            }
          })

          if (purchase) {
            hasAccess = true
            expiresAt = purchase.expiresAt
          }
        }

        return {
          ...video,
          hasAccess,
          expiresAt
        }
      })
    )

    return NextResponse.json(videosWithPurchaseStatus)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
} 