# Environment Variables Setup

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Admin Configuration
ADMIN_EMAIL=justinfilms98@gmail.com

# WhatsApp API (Optional)
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER=your_whatsapp_business_number
```

## Supabase Setup Steps

1. **Create Supabase Project**: Go to https://supabase.com and create a new project

2. **Get API Keys**: 
   - Go to Settings > API in your Supabase dashboard
   - Copy the Project URL and anon/public key

3. **Apply Database Schema**:
   - Go to SQL Editor in Supabase dashboard
   - Paste the contents of `database-schema.sql`
   - Run the SQL to create all tables and policies

4. **Configure Storage**:
   - Go to Storage > Settings
   - The `media` bucket should be created automatically
   - Verify RLS policies are in place

5. **Setup Google OAuth**:
   - Go to Authentication > Settings > Auth Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL to: `https://your-domain.com/auth/callback`

## Stripe Setup Steps

1. **Create Stripe Account**: Go to https://stripe.com and create account

2. **Get API Keys**:
   - Go to Developers > API keys
   - Copy Secret key and Publishable key

3. **Setup Webhook**:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe-webhook`
   - Select events: `checkout.session.completed`
   - Copy webhook secret

## Google OAuth Setup

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create new project

2. **Enable Google+ API**:
   - Go to APIs & Services > Library
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**:
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized domains:
     - `your-domain.com`
     - `supabase.co` (for auth callback)

4. **Configure in Supabase**:
   - Add Client ID and Secret to Supabase Auth settings
   - Set redirect URL correctly

## Vercel Deployment

Add all environment variables to Vercel:

1. Go to your Vercel project dashboard
2. Settings > Environment Variables
3. Add all variables from your `.env.local`
4. Redeploy the application

## Testing Checklist

- [ ] Google OAuth login works
- [ ] Admin can upload collections
- [ ] Users can purchase collections
- [ ] Stripe payments process correctly
- [ ] Webhook creates purchase records
- [ ] Users can access purchased content
- [ ] Content expires after time limit
- [ ] Signed URLs work for media access

## Security Notes

- Never commit `.env.local` to git
- Use test keys during development
- Switch to live keys for production
- Verify webhook signatures
- Test RLS policies thoroughly
- Monitor access logs regularly 