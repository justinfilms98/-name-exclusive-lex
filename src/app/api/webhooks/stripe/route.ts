// =====================================================
// STRIPE WEBHOOK HANDLER
// Processes Stripe webhook events for payment confirmations
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { trackEvent, trackPurchase } from '@/lib/analytics';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { sendPurchaseNotification } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event;
    try {
      event = constructWebhookEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    const { userId, collectionVideoId, title } = session.metadata;
    const amount = session.amount_total / 100; // Convert from cents

    if (!userId || !collectionVideoId) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        collectionVideoId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      },
      include: {
        User: true,
        CollectionVideo: true,
      },
    });

    // Track the purchase
    await trackPurchase(
      userId,
      collectionVideoId,
      title || purchase.CollectionVideo.title,
      amount
    );

    // TODO: Send email confirmation to customer
    // await sendPurchaseConfirmationEmail(
    //   purchase.User.email,
    //   title || purchase.CollectionVideo.title,
    //   purchase.id,
    //   `${process.env.NEXT_PUBLIC_BASE_URL}/access/${purchase.id}`
    // );

    // TODO: Send WhatsApp notification to admin
    // await sendPurchaseNotification(
    //   process.env.ADMIN_PHONE_NUMBER!,
    //   purchase.User.email,
    //   title || purchase.CollectionVideo.title,
    //   amount
    // );

    console.log(`Purchase completed: ${purchase.id} for user ${userId}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    // This is a backup handler in case checkout.session.completed doesn't fire
    // You might want to check if a purchase record already exists
    
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    
    // Track the successful payment
    await trackEvent({
      name: 'payment_succeeded',
      properties: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      },
    });

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    console.log(`Payment intent failed: ${paymentIntent.id}`);
    
    // Track the failed payment
    await trackEvent({
      name: 'payment_failed',
      properties: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        failure_reason: paymentIntent.last_payment_error?.message,
      },
    });

    // TODO: Send notification to admin about failed payment
    // await sendSystemAlert(
    //   process.env.ADMIN_PHONE_NUMBER!,
    //   'warning',
    //   `Payment failed: ${paymentIntent.id}`
    // );

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}