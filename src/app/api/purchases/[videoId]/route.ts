import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        videoId: params.videoId,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        expiresAt: true
      }
    })

    if (!purchase) {
      return new NextResponse('No active purchase', { status: 404 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error checking purchase status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 