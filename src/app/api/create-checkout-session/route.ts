import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { videoId } = await req.json()
    
    if (!videoId) {
      return new NextResponse('Video ID is required', { status: 400 })
    }

    // Get video details
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return new NextResponse('Video not found', { status: 404 })
    }

    // Check if user already has access
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: session.user.id,
        videoId: video.id,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingPurchase) {
      return new NextResponse('Already purchased', { status: 400 })
    }

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: video.title,
              description: video.description,
              images: [video.thumbnailKey]
            },
            unit_amount: Math.round(video.price * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/watch/${video.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/collections`,
      metadata: {
        videoId: video.id,
        userId: session.user.id,
        type: video.type
      }
    })

    return NextResponse.json({ sessionId: stripeSession.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 