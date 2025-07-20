import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, collectionIds } = session.metadata || {};
    
    if (!userId || !collectionIds) {
      console.error('Missing metadata in checkout session');
      return;
    }

    const collectionIdArray = collectionIds.split(',');
    
    // Get collection details for duration calculation
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, duration, title, price')
      .in('id', collectionIdArray);

    if (collectionsError || !collections) {
      console.error('Failed to fetch collections:', collectionsError);
      return;
    }

    // Create purchase records
    const purchasePromises = collections.map(async (collection) => {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + collection.duration);

      const { error } = await supabase
        .from('purchases')
        .insert([
          {
            user_id: userId,
            collection_id: collection.id,
            stripe_session_id: session.id,
            amount_paid: collection.price,
            expires_at: expiresAt.toISOString(),
          }
        ]);

      if (error) {
        console.error('Failed to create purchase record:', error);
      }

      return {
        collection: collection.title,
        amount: collection.price
      };
    });

    const purchaseResults = await Promise.all(purchasePromises);

    // Get user email for WhatsApp notification
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    // Send WhatsApp notification
    if (userEmail) {
      await sendWhatsAppNotification({
        user: userEmail,
        collections: purchaseResults.map(p => p.collection),
        totalAmount: purchaseResults.reduce((sum, p) => sum + p.amount, 0)
      });
    }

    console.log('Purchase completed successfully:', {
      userId,
      collections: purchaseResults.length,
      session: session.id
    });

  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Additional payment verification if needed
  console.log('Payment succeeded:', paymentIntent.id);
}

async function sendWhatsAppNotification(data: {
  user: string;
  collections: string[];
  totalAmount: number;
}) {
  try {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('WhatsApp webhook URL not configured');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: data.user,
        collection: data.collections.join(', '),
        amount: data.totalAmount,
        timestamp: new Date().toISOString(),
        platform: 'Exclusive Lex'
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp webhook failed: ${response.status}`);
    }

    console.log('WhatsApp notification sent successfully');
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
} 