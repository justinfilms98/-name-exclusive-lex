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
    console.log('Donation session creation started');
    
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
    
    const { amount, userId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Donation amount:', amount);
    console.log('User ID:', userId);

    // Get the current user from auth header
    console.log('Checking authentication');
    const authHeader = request.headers.get('authorization');
    
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

    // Create checkout session for donation only
    console.log('Creating Stripe donation session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation - Support Our Creators',
              description: 'Thank you for your generous support! Your donation helps us continue creating amazing luxury content.',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&donation=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate`,
      metadata: {
        user_id: user.id,
        donation_amount: amount.toString(),
        donation_type: 'standalone',
      },
      // Mobile-friendly settings
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true,
      },
    });

    console.log('Stripe donation session created successfully:', session.id);

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Donation session creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to create donation session' },
      { status: 500 }
    );
  }
} 