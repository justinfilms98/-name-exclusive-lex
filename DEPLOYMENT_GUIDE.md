# 🚀 Production-Ready Content Sales Platform Deployment Guide

## 📋 Overview

This guide covers the complete deployment of your content sales platform using:
- **Frontend & API**: Vercel (Next.js)
- **Database**: Railway PostgreSQL
- **File Storage**: UploadThing
- **Payments**: Stripe
- **Authentication**: NextAuth.js

## 🗄️ Database Setup (Railway)

### 1. Create Railway PostgreSQL Database

1. Go to [Railway](https://railway.app) and create a new project
2. Add a PostgreSQL service
3. Copy the connection string from the **Connect** tab
4. Format: `postgresql://username:password@host:port/database`

### 2. Configure Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

### 3. Environment Variables for Database

Add to your `.env.local`:
```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🔐 Authentication Setup (NextAuth.js)

### 1. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### 2. Generate NextAuth Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

### 3. Environment Variables for Auth

```bash
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your_generated_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## 💳 Payment Setup (Stripe)

### 1. Stripe Account Configuration

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the dashboard
3. Create a webhook endpoint:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### 2. Environment Variables for Stripe

```bash
STRIPE_SECRET_KEY="sk_live_your_stripe_secret"
STRIPE_PUBLIC_KEY="pk_live_your_stripe_public"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## 📁 File Upload Setup (UploadThing)

### 1. UploadThing Configuration

1. Sign up at [UploadThing](https://uploadthing.com)
2. Create a new project
3. Get your API token from the dashboard

### 2. Environment Variables for UploadThing

```bash
UPLOADTHING_TOKEN="your_uploadthing_token"
```

## 🌐 Frontend Deployment (Vercel)

### 1. Connect Repository

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. Environment Variables in Vercel

Add all environment variables from the sections above to Vercel's environment variables section.

### 3. Domain Configuration

1. Add your custom domain in Vercel
2. Update `NEXTAUTH_URL` to match your domain
3. Update Google OAuth redirect URIs

## 🔧 Railway Backend (Optional)

If you want to run backend services on Railway:

### 1. Create Railway Service

1. Add a new service to your Railway project
2. Connect your GitHub repository
3. Configure environment variables

### 2. Fix Build Issues

The project includes Node.js engine specification:
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

### 3. Environment Variables on Railway

Add the same environment variables to your Railway service.

## 📊 Monitoring & Analytics

### 1. Vercel Analytics (Optional)

Enable Vercel Analytics in your `next.config.js`:
```javascript
const nextConfig = {
  experimental: {
    analyticsId: 'your_analytics_id'
  }
};
```

### 2. Error Tracking

Consider adding error tracking services like Sentry or LogRocket.

## 🔒 Security Checklist

### 1. Environment Variables
- [ ] All secrets are in environment variables
- [ ] No secrets committed to repository
- [ ] Production secrets are different from development

### 2. Authentication
- [ ] NextAuth.js properly configured
- [ ] Google OAuth working
- [ ] Admin role protection implemented

### 3. Database
- [ ] Railway PostgreSQL connected
- [ ] Migrations applied
- [ ] Connection string secure

### 4. Payments
- [ ] Stripe webhook configured
- [ ] Test payments working
- [ ] Production keys in use

### 5. File Uploads
- [ ] UploadThing configured
- [ ] Large file uploads working
- [ ] File access secured

## 🧪 Testing Checklist

### 1. Authentication Flow
- [ ] User registration works
- [ ] User login works
- [ ] Admin access restricted
- [ ] Logout works

### 2. Content Management
- [ ] Admin can upload videos
- [ ] Content displays correctly
- [ ] File access is secure

### 3. Payment Flow
- [ ] Checkout session creation
- [ ] Payment processing
- [ ] Purchase verification
- [ ] Content access after purchase

### 4. User Experience
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` format
   - Verify Railway service is running
   - Check network connectivity

2. **Authentication Issues**
   - Verify Google OAuth credentials
   - Check redirect URIs
   - Ensure `NEXTAUTH_URL` is correct

3. **Payment Issues**
   - Verify Stripe keys
   - Check webhook endpoint
   - Test with Stripe test mode

4. **File Upload Issues**
   - Check UploadThing token
   - Verify file size limits
   - Check CORS settings

### Debug Commands

```bash
# Check database connection
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📈 Future Enhancements

The platform is prepared for these future features:

### 1. Email Notifications
- Resend or Postmark integration
- Purchase confirmations
- Admin notifications

### 2. WhatsApp Integration
- Twilio API setup
- Purchase notifications
- Customer support

### 3. Rate Limiting
- Upstash Redis integration
- API protection
- Abuse prevention

### 4. Analytics
- Vercel Analytics
- Custom event tracking
- User behavior analysis

## 📞 Support

For deployment issues:
1. Check Vercel and Railway logs
2. Verify environment variables
3. Test locally with production settings
4. Review this guide's troubleshooting section

## 🎉 Deployment Complete!

Once all steps are completed, your content sales platform will be:
- ✅ Production-ready
- ✅ Scalable
- ✅ Secure
- ✅ Monitored
- ✅ Future-proof

Your platform is now ready to sell content and grow your business! 