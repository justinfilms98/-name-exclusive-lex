# Deployment Checklist

This document provides a step-by-step checklist for deploying the Exclusive Lex application to production.

## 🏗️ Pre-Deployment Setup

### 1. Environment Variables

- [ ] Run environment setup script:
  ```bash
  npm run setup-env init
  ```
- [ ] Update `.env.local` with production values
- [ ] Verify all required variables are set:
  ```bash
  npm run setup-env check
  npm run setup-env validate
  ```

### 2. Database Setup

- [ ] Ensure Prisma schema is up to date
- [ ] Run database migrations:
  ```bash
  npm run db:generate
  npm run db:push
  ```
- [ ] Verify database connection
- [ ] Test with sample data:
  ```bash
  npm run seed-data
  ```

### 3. Supabase Configuration

#### Authentication
- [ ] Enable Google OAuth provider
- [ ] Configure redirect URLs:
  - `http://localhost:3000/account` (development)
  - `https://your-domain.vercel.app/account` (production)
- [ ] Set up email templates
- [ ] Test authentication flow

#### Storage
- [ ] Create storage buckets:
  - `thumbnails` (public)
  - `videos` (private)
- [ ] Configure storage policies
- [ ] Test file upload functionality

#### Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Configure policies for each table

### 4. Stripe Configuration

#### Webhooks
- [ ] Create webhook endpoint in Stripe dashboard
- [ ] Set endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- [ ] Listen for events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- [ ] Copy webhook signing secret to environment variables

#### Products
- [ ] Create products in Stripe dashboard
- [ ] Set up pricing tiers
- [ ] Configure metadata for video IDs
- [ ] Test checkout flow

## 🚀 Vercel Deployment

### 1. Project Setup

- [ ] Install Vercel CLI:
  ```bash
  npm i -g vercel
  ```
- [ ] Link to Vercel project:
  ```bash
  vercel link
  ```
- [ ] Configure project settings in Vercel dashboard

### 2. Environment Variables

- [ ] Sync environment variables to Vercel:
  ```bash
  npm run setup-env sync
  ```
- [ ] Or manually add in Vercel dashboard

### 3. Build and Deploy

- [ ] Run pre-deployment checks:
  ```bash
  npm run predeploy
  ```
- [ ] Deploy to production:
  ```bash
  vercel --prod
  ```
- [ ] Verify deployment URL
- [ ] Test all functionality

## 🧪 Post-Deployment Testing

### 1. Authentication Flow

- [ ] Test Google OAuth sign-in
- [ ] Verify redirect to `/account`
- [ ] Test admin role detection
- [ ] Verify protected routes

### 2. API Endpoints

- [ ] Test collection videos API
- [ ] Test hero videos API
- [ ] Verify CORS headers
- [ ] Test error handling

### 3. Payment Flow

- [ ] Test Stripe checkout creation
- [ ] Verify webhook processing
- [ ] Test purchase verification
- [ ] Verify access control

### 4. Admin Panel

- [ ] Access `/admin` with admin user
- [ ] Test video CRUD operations
- [ ] Verify file uploads
- [ ] Test analytics

### 5. Public Site

- [ ] Verify homepage loads
- [ ] Test video collections
- [ ] Check responsive design
- [ ] Verify search and filtering

## 🔧 Monitoring and Maintenance

### 1. Error Monitoring

- [ ] Set up error logging
- [ ] Configure alerts for 500 errors
- [ ] Monitor API response times
- [ ] Track failed payments

### 2. Performance Monitoring

- [ ] Set up Vercel Analytics
- [ ] Monitor Core Web Vitals
- [ ] Track video loading times
- [ ] Monitor database performance

### 3. Security Monitoring

- [ ] Monitor authentication attempts
- [ ] Track API usage patterns
- [ ] Monitor file uploads
- [ ] Check for suspicious activity

## 🚨 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check connection
npx prisma db push
npx prisma generate
```

#### Environment Variables
```bash
# Verify setup
npm run setup-env check
npm run setup-env validate
```

#### Supabase Issues
- Verify URL and keys
- Check RLS policies
- Test with Supabase dashboard

#### Stripe Issues
- Verify webhook endpoint
- Check payment status
- Validate session verification

### Debug Commands

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check build logs
vercel logs

# Test API endpoints
curl -v https://your-domain.vercel.app/api/health
```

## 📊 Health Checks

### Daily Checks

- [ ] Verify all API endpoints respond
- [ ] Check authentication flow
- [ ] Monitor error rates
- [ ] Verify payment processing

### Weekly Checks

- [ ] Review analytics data
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Review security logs

### Monthly Checks

- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Backup database
- [ ] Performance optimization

## 🔄 Update Process

### 1. Development

- [ ] Create feature branch
- [ ] Implement changes
- [ ] Add tests
- [ ] Update documentation

### 2. Testing

- [ ] Run local tests
- [ ] Test in staging environment
- [ ] Verify all functionality
- [ ] Performance testing

### 3. Deployment

- [ ] Merge to main branch
- [ ] Run pre-deployment checks
- [ ] Deploy to production
- [ ] Verify deployment

### 4. Post-Deployment

- [ ] Monitor for errors
- [ ] Verify new features
- [ ] Update documentation
- [ ] Notify stakeholders

## 📞 Support Contacts

- **Technical Issues**: Check troubleshooting section
- **Supabase Support**: [Supabase Documentation](https://supabase.com/docs)
- **Stripe Support**: [Stripe Documentation](https://stripe.com/docs)
- **Vercel Support**: [Vercel Documentation](https://vercel.com/docs)
- **Project Contact**: contact.exclusivelex@gmail.com

## 📝 Deployment Log

Keep a log of all deployments:

| Date | Version | Changes | Status | Notes |
|------|---------|---------|--------|-------|
| YYYY-MM-DD | v1.0.0 | Initial deployment | ✅ | All systems operational |

---

**Last Updated**: [Current Date]
**Deployment Version**: v1.0.0
**Next Review**: [Date + 30 days] 