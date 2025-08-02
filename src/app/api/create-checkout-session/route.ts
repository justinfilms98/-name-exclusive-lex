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
    console.log('Checkout session creation started');
    
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Handle both single collection and cart items
    let collectionId = body.collectionId;
    let userId = body.userId;
    
    // If it's a cart checkout, use the first item
    if (body.items && body.items.length > 0) {
      collectionId = body.items[0].id;
      userId = body.userId;
    }

    console.log('Collection ID:', collectionId);
    console.log('User ID:', userId);

    if (!collectionId) {
      console.log('Error: Collection ID is required');
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Get the collection details
    console.log('Fetching collection details for ID:', collectionId);
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError) {
      console.log('Collection error:', collectionError);
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (!collection) {
      console.log('Collection not found for ID:', collectionId);
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    console.log('Collection found:', collection.title);
    console.log('Collection price:', collection.price);
    console.log('Collection price type:', typeof collection.price);
    console.log('Collection stripe_product_id:', collection.stripe_product_id);
    console.log('Price in cents:', Math.round(collection.price * 100));

    // Get the current user from auth header
    console.log('Checking authentication');
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('User agent:', userAgent);
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('Error: No authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        console.log('Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }

      if (!authUser) {
        console.log('Error: No user found');
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }
      
      // Remove admin email restriction - allow all authenticated users to purchase
      console.log('User authenticated:', authUser.id, 'Email:', authUser.email);
      
      user = authUser;
    } catch (authErr) {
      console.log('Auth exception:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Double-check user object exists and has required properties
    if (!user || !user.id) {
      console.log('Error: Invalid user object after authentication');
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user already purchased this collection
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collectionId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this collection' },
        { status: 400 }
      );
    }

    // Create or get Stripe price
    let stripePriceId = collection.stripe_product_id;
    
    if (!stripePriceId) {
      // Create a new product and price in Stripe
      const product = await stripe.products.create({
        name: collection.title,
        description: collection.description,
      });

      const price = await stripe.prices.create({
        unit_amount: Math.round(collection.price * 100), // Convert to cents
        currency: 'usd',
        product: product.id,
      });

      // Update the collection with the Stripe product ID
      await supabase
        .from('collections')
        .update({ stripe_product_id: product.id })
        .eq('id', collectionId);

      stripePriceId = price.id;
    } else {
      // If we have a product ID, we need to create a price for it
      try {
        // Check if this product already has a price
        const prices = await stripe.prices.list({
          product: stripePriceId,
          active: true,
          limit: 1,
        });

        if (prices.data.length > 0) {
          stripePriceId = prices.data[0].id;
        } else {
          // Create a new price for the existing product
          const price = await stripe.prices.create({
            unit_amount: Math.round(collection.price * 100), // Convert to cents
            currency: 'usd',
            product: stripePriceId,
          });
          stripePriceId = price.id;
        }
      } catch (stripeError) {
        console.error('Stripe price creation error:', stripeError);
        // Create a new product and price if there's an issue
        const product = await stripe.products.create({
          name: collection.title,
          description: collection.description,
        });

        const price = await stripe.prices.create({
          unit_amount: Math.round(collection.price * 100), // Convert to cents
          currency: 'usd',
          product: product.id,
        });

        // Update the collection with the new Stripe product ID
        await supabase
          .from('collections')
          .update({ stripe_product_id: product.id })
          .eq('id', collectionId);

        stripePriceId = price.id;
      }
    }

    console.log('Using Stripe price ID:', stripePriceId);

    // Create checkout session with mobile-friendly settings
    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/collections`,
      metadata: {
        collection_id: collectionId,
        user_id: user.id,
      },
      // Mobile-friendly settings
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true,
      },
    });

    console.log('Stripe session created successfully:', session.id);

    // Insert purchase record with session ID
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        collection_id: collectionId,
        stripe_session_id: session.id,
        created_at: new Date().toISOString(),
        amount_paid: collection.price,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      console.error('Purchase error details:', {
        code: purchaseError.code,
        message: purchaseError.message,
        details: purchaseError.details
      });
      // Don't fail the checkout if purchase record creation fails
      // The webhook will handle it
    } else {
      console.log('Purchase record created successfully:', purchase.id);
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 