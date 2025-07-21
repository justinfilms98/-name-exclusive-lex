import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Get the collection details
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user already purchased this collection
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collectionId)
      .single();

    if (existingPurchase) {
      // Check if purchase is still valid
      const now = new Date();
      const expiresAt = new Date(existingPurchase.expires_at);
      
      if (now < expiresAt) {
        return NextResponse.json(
          { error: 'You already own this collection and it is still active' },
          { status: 400 }
        );
      }
    }

    // Create or get Stripe price
    let stripePriceId = collection.stripe_price_id;
    
    if (!stripePriceId) {
      // Create a new price in Stripe
      const price = await stripe.prices.create({
        unit_amount: collection.price, // Already in cents
        currency: 'usd',
        product_data: {
          name: collection.title,
        },
      });

      // Update the collection with the Stripe price ID
      await supabase
        .from('collections')
        .update({ stripe_price_id: price.id })
        .eq('id', collectionId);

      stripePriceId = price.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/watch?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/collections`,
      metadata: {
        collection_id: collectionId,
        user_id: user.id,
        duration: collection.duration.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 