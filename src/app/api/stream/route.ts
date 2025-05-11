import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Get video and check purchase
    const video = await prisma.video.findUnique({
      where: { id: videoId }
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

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase required' },
        { status: 403 }
      )
    }

    // Generate signed URL that expires when the purchase expires
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: video.videoKey
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: Math.floor((purchase.expiresAt.getTime() - Date.now()) / 1000)
    })

    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error('Error generating stream URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate stream URL' },
      { status: 500 }
    )
  }
} 