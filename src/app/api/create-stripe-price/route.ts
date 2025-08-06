import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { product_name, amount, collection_id } = await request.json();

    if (!product_name || !amount || !collection_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_name, amount, collection_id' },
        { status: 400 }
      );
    }

    console.log('Creating Stripe price:', { product_name, amount, collection_id });

    // Create a product first
    const product = await stripe.products.create({
      name: product_name,
      metadata: {
        collection_id: collection_id,
      },
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount), // amount should already be in cents
      currency: 'usd',
      metadata: {
        collection_id: collection_id,
      },
    });

    console.log('Stripe price created successfully:', price.id);

    return NextResponse.json({ 
      price_id: price.id,
      product_id: product.id,
      success: true 
    });

  } catch (error) {
    console.error('Error creating Stripe price:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe price' },
      { status: 500 }
    );
  }
} 