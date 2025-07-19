import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { collectionId, userId, duration } = session.metadata!;
      
      if (!collectionId || !userId || !duration) {
        console.error('Missing metadata in webhook:', session.metadata);
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        );
      }

      // Calculate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + parseInt(duration) * 1000);

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([
          {
            user_id: userId,
            collection_id: collectionId,
            stripe_session_id: session.id,
            amount_paid: (session.amount_total || 0) / 100, // Convert from cents
            expires_at: expiresAt.toISOString(),
          },
        ]);

      if (purchaseError) {
        console.error('Failed to create purchase record:', purchaseError);
        return NextResponse.json(
          { error: 'Failed to create purchase record' },
          { status: 500 }
        );
      }

      // TODO: Send WhatsApp notification
      try {
        await fetch(`${request.headers.get('origin')}/api/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'purchase_confirmation',
            userId,
            collectionId,
            expiresAt: expiresAt.toISOString(),
          }),
        });
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
        // Don't fail the webhook for notification errors
      }

      console.log('Purchase completed successfully:', {
        userId,
        collectionId,
        sessionId: session.id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 