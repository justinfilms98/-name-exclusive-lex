# Stripe Webhook Setup Guide

## Step 1: Go to Stripe Dashboard
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Select your "Exclusive Lex" project
3. Navigate to **Developers** → **Webhooks**

## Step 2: Add Webhook Endpoint
1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://exclusivelex.com/api/webhooks/stripe`
3. **Events to send**: Select `checkout.session.completed`
4. Click **"Add endpoint"**

## Step 3: Copy Webhook Secret
1. After creating the endpoint, click on it
2. Scroll down to **"Signing secret"**
3. Click **"Reveal"** to see the secret
4. Copy the secret (starts with `whsec_`)

## Step 4: Update Environment Variables
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to **Environment Variables**
4. Add/update: `STRIPE_WEBHOOK_SECRET` with the copied secret
5. Redeploy your application

## Step 5: Test the Webhook
1. Make a test purchase
2. Check the webhook logs in Stripe dashboard
3. Verify purchases are created in Supabase

## Current Webhook Secret
Your current webhook secret is likely in your environment variables. You need to:
1. Check if it's configured in Vercel
2. If not, add it using the steps above
3. If yes, make sure it matches the one in Stripe dashboard 