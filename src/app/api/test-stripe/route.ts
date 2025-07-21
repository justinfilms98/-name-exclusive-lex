import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET() {
  try {
    console.log('Testing Stripe configuration...');
    console.log('Stripe secret key length:', process.env.STRIPE_SECRET_KEY?.length || 0);
    console.log('Stripe publishable key length:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0);
    
    // Test Stripe connection by listing products
    const products = await stripe.products.list({ limit: 1 });
    
    return NextResponse.json({
      success: true,
      message: 'Stripe is configured correctly',
      productsCount: products.data.length,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    }, { status: 500 });
  }
} 