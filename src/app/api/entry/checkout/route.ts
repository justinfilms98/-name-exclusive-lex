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
    console.log('Entry fee checkout session creation started');
    
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 500 }
      );
    }
    
    // Get the current user from auth header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('Error: No authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        console.log('Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }
      
      user = authUser;
    } catch (authErr) {
      console.log('Auth exception:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    console.log('User authenticated for entry fee:', user.id, 'Email:', user.email);

    // Admin users bypass entry fee requirement
    const { isAdminEmail } = await import('@/lib/auth');
    if (isAdminEmail(user.email)) {
      console.log('Admin user attempting entry fee checkout - bypassing');
      return NextResponse.json(
        { error: 'Admin users do not need to pay entry fee' },
        { status: 400 }
      );
    }

    // Check if user already has active entry access
    const { data: existingAccess, error: accessError } = await supabase
      .from('entry_access')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accessError) {
      // PGRST116 = no rows returned (expected if user doesn't have entry access yet)
      if (accessError.code === 'PGRST116') {
        // This is expected - user doesn't have entry access yet, continue with checkout
        console.log('No existing entry access found for user, proceeding with checkout');
      } else {
        // Real error - could be table doesn't exist, RLS issue, etc.
        console.error('Error checking entry access:', {
          code: accessError.code,
          message: accessError.message,
          details: accessError.details,
          hint: accessError.hint
        });
        
        // Provide more helpful error message
        let errorMessage = 'Failed to check entry access';
        if (accessError.code === '42P01') {
          errorMessage = 'Entry access table not found. Please run the database migration.';
        } else if (accessError.message) {
          errorMessage = `Database error: ${accessError.message}`;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    }

    if (existingAccess && existingAccess.status === 'active') {
      console.log('User already has active entry access');
      return NextResponse.json(
        { error: 'You already have entry access' },
        { status: 400 }
      );
    }

    // Create or update entry_access record with pending status
    const entryAccessData = {
      user_id: user.id,
      email: user.email || '',
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('entry_access')
      .upsert(entryAccessData, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error upserting entry access:', upsertError);
      return NextResponse.json(
        { error: 'Failed to create entry access record' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session for $20 entry fee
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Exclusive Lex Entry Fee',
              description: 'One-time entry fee for access to Exclusive Lex. This fee grants access to browse the site only and does not unlock any collections.',
            },
            unit_amount: 2000, // $20.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/entry/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/entry`,
      metadata: {
        purpose: 'entry_fee',
        user_id: user.id,
        email: user.email || '',
      },
      // Mobile-friendly settings
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true,
      },
    });

    // Update entry_access with stripe_session_id
    await supabase
      .from('entry_access')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    console.log('Entry fee Stripe session created successfully:', session.id);

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Entry fee checkout session creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to create entry fee checkout session' },
      { status: 500 }
    );
  }
}
