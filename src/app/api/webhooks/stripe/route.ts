import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return new NextResponse('No signature', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new NextResponse('Invalid signature', { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Get video and user IDs from metadata
      const { videoId, userId, type } = session.metadata || {}
      
      if (!videoId || !userId || !type) {
        return new NextResponse('Missing metadata', { status: 400 })
      }

      // Calculate expiration date
      const duration = type === 'monthly' ? 30 : 365 // days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + duration)

      // Create purchase record
      await prisma.purchase.create({
        data: {
          userId,
          videoId,
          expiresAt
        }
      })
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 