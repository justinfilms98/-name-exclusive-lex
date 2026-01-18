import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        { error: 'Payment processing not configured. Please contact support.' },
        { status: 500 }
      );
    }
    
    // Check if base URL is configured
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Validate base URL is absolute
    try {
      new URL(baseUrl);
    } catch {
      console.error('NEXT_PUBLIC_BASE_URL is not a valid absolute URL:', baseUrl);
      return NextResponse.json(
        { error: 'Server configuration error: invalid base URL. Please contact support.' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Handle both single collection and multiple collections
    let collectionIds: string[] = [];
    let userId = body.userId;
    let tipAmount = body.tipAmount || 0;
    
    // If it's a single collection purchase
    if (body.collectionId) {
      collectionIds = [body.collectionId];
    }
    // If it's a cart checkout with multiple items
    else if (body.items && body.items.length > 0) {
      collectionIds = body.items.map((item: any) => item.id);
      userId = body.userId;
      tipAmount = body.tipAmount || 0;
    }
    // If it's a cart checkout with videoIds array
    else if (body.videoIds && body.videoIds.length > 0) {
      collectionIds = body.videoIds;
      userId = body.userId;
      tipAmount = body.tipAmount || 0;
    }

    console.log('Collection IDs:', collectionIds);
    console.log('User ID:', userId);
    console.log('Tip Amount:', tipAmount);

    if (!collectionIds.length) {
      console.log('Error: At least one collection ID is required');
      return NextResponse.json(
        { error: 'At least one collection ID is required' },
        { status: 400 }
      );
    }

    // Get the current user from auth header
    console.log('Checking authentication');
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('User agent:', userAgent);
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('Error: No authorization header');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
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
          { error: 'Invalid authentication. Please sign in again.' },
          { status: 401 }
        );
      }

      if (!authUser) {
        console.log('Error: No user found');
        return NextResponse.json(
          { error: 'Invalid authentication. Please sign in again.' },
          { status: 401 }
        );
      }
      
      console.log('User authenticated:', authUser.id, 'Email:', authUser.email);
      user = authUser;
    } catch (authErr) {
      console.log('Auth exception:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }

    // Double-check user object exists and has required properties
    if (!user || !user.id) {
      console.log('Error: Invalid user object after authentication');
      return NextResponse.json(
        { error: 'Invalid user data. Please sign in again.' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Fetch all collections and validate they exist
    console.log('Fetching collection details for IDs:', collectionIds);
    // Get collection details
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, title, description, price')
      .in('id', collectionIds);

    if (collectionsError) {
      console.log('Collections error:', collectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    if (!collections || collections.length !== collectionIds.length) {
      console.log('Error: Some collections not found');
      return NextResponse.json(
        { error: 'Some collections not found' },
        { status: 404 }
      );
    }

    // Check if user already purchased any of these collections
    const { data: existingPurchases } = await supabase
      .from('purchases')
      .select('collection_id')
      .eq('user_id', user.id)
      .in('collection_id', collectionIds)
      .eq('is_active', true);

    if (existingPurchases && existingPurchases.length > 0) {
      const alreadyOwned = existingPurchases.map(p => p.collection_id);
      return NextResponse.json(
        { error: `You already own some of these collections: ${alreadyOwned.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare line items for Stripe
    const lineItems: any[] = [];
    
    for (const collection of collections) {
      // Create price data for each collection since we don't store stripe_price_id
      const unitAmount = Math.round(collection.price || 0);
      if (unitAmount <= 0) {
        console.error('Invalid price for collection:', collection.id, 'price:', collection.price);
        return NextResponse.json(
          { error: `Collection "${collection.title}" has an invalid price. Please contact support.` },
          { status: 400 }
        );
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: collection.title,
            description: collection.description,
            metadata: {
              collection_id: collection.id,
            },
          },
          unit_amount: unitAmount, // Price is already in cents
        },
        quantity: 1,
      });
    }

    // Add tip as a separate line item if provided
    if (tipAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tip - Thank you for your support!',
            description: 'Your tip helps us continue creating amazing content.',
          },
          unit_amount: Math.round(tipAmount * 100), // Convert dollars to cents
        },
        quantity: 1,
      });
    }

    console.log('Line items prepared:', lineItems.length);

    // Create checkout session with multiple line items
    console.log('Creating Stripe checkout session...');
    
    // Build metadata object
    const metadata: Record<string, string> = {
      user_id: user.id,
      collection_ids: JSON.stringify(collectionIds), // Store as JSON string
      collection_count: collectionIds.length.toString(),
      tip_amount: tipAmount.toString(),
    };

    // Add no-refunds acknowledgement if present in request body
    if (body.noRefundsAck === true) {
      metadata.no_refunds_ack = 'true';
    }

    // Validate success and cancel URLs
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/collections`;

    try {
      new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test'));
      new URL(cancelUrl);
    } catch (urlError) {
      console.error('Invalid URL constructed:', { successUrl, cancelUrl, baseUrl });
      return NextResponse.json(
        { error: 'Server configuration error: invalid redirect URLs. Please contact support.' },
        { status: 500 }
      );
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
        // Custom text for no-refunds disclosure
        custom_text: {
          submit: {
            message: 'All sales are final. Due to the digital nature of this content, no refunds or chargebacks are permitted.',
          },
        },
        // Mobile-friendly settings
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
        phone_number_collection: {
          enabled: true,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      const errorMessage = stripeError?.message || 'Unknown Stripe error';
      const errorCode = stripeError?.code || 'unknown';
      console.error('Stripe error details:', { errorMessage, errorCode, type: stripeError?.type });
      
      return NextResponse.json(
        { error: `Payment processing error: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}` },
        { status: 500 }
      );
    }

    console.log('Stripe session created successfully:', session.id);

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
