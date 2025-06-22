# 🚀 Production Deployment Guide

This guide will walk you through deploying your video streaming application to production using Supabase, Vercel, and GitHub.

## 📋 Prerequisites

- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)
- Stripe account (for payments)
- Google Cloud Console access (for OAuth)

## 🔄 Step 1: Push Code to GitHub

First, ensure your `package.json` build script is correct and push all changes to GitHub.

Your `"build"` script in `package.json` should look like this:
`"build": "prisma generate && prisma migrate deploy && next build"`

This command ensures that every time you deploy to Vercel, your database schema is automatically created and updated before the application is built.

```bash
# Add all your recent changes
git add .
# Commit the changes
git commit -m "feat: Configure automatic migrations for deployment"
# Push to your main branch
git push origin main
```

## 🗄️ Step 2: Initial Setup of Services

### 2.1 Create Supabase Project
1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  Go to **Settings > Database** and copy the **Connection string** (URI). You will need this for Vercel.

### 2.2 Configure Google OAuth
1.  Go to the [Google Cloud Console](https://console.cloud.google.com) and set up an OAuth 2.0 Client ID.
2.  Copy the **Client ID** and **Client Secret**.

### 2.3 Configure Stripe
1.  Go to the [Stripe Dashboard](https://dashboard.stripe.com) and get your **live** API keys.
2.  Create a webhook endpoint but leave it pointing to a placeholder for now. You'll get the final URL from Vercel after deployment.

## 🌐 Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository
1.  Go to [vercel.com](https://vercel.com) and create a **New Project**.
2.  Import your GitHub repository. Vercel should automatically detect it as a Next.js project.

### 3.2 Set Environment Variables
In the Vercel project settings, go to **Settings > Environment Variables** and add all the secrets you gathered in Step 2. Use `env.production.example` as a reference.

The most important variable for the first deployment is the `DATABASE_URL`.

### 3.3 Deploy
1.  Click **Deploy**.
2.  Vercel will start the build process. You can monitor the logs. The `prisma migrate deploy` command will run, creating all the tables from your `prisma/migrations` directory in your Supabase database.
3.  Once the deployment is successful, your app will be live at a Vercel-provided domain (e.g., `your-project.vercel.app`).

## 🔧 Step 4: Post-Deployment Configuration

Now that the database tables exist, you can apply your security policies and other configurations.

### 4.1 Apply Supabase SQL Policies
1.  Go to your Supabase project dashboard.
2.  Navigate to **SQL Editor**.
3.  Copy the entire contents of `supabase-production-setup.sql` and paste it into the editor.
4.  Click **Run** to execute the script. This will set up your RLS policies, functions, views, and storage policies.

### 4.2 Update Service URLs
1.  **Google OAuth**: Go back to your Google Cloud credentials and add the Vercel domain to your Authorized redirect URIs: `https://your-project.vercel.app/api/auth/callback/google`
2.  **Stripe Webhook**: Go to your Stripe dashboard and update your webhook endpoint URL to point to your Vercel deployment: `https://your-project.vercel.app/api/webhooks/stripe`
3.  **Supabase Storage CORS**: Go to your Supabase Storage settings and add your Vercel domain to the CORS origins for your buckets.

## ✅ Step 5: Final Testing

You are now ready to test the entire application flow on your live production URL.
1.  **User Registration/Login**: Sign in with Google.
2.  **Shopping Cart**: Add items to the cart.
3.  **Stripe Checkout**: Complete a test purchase.
4.  **Content Access**: Verify that you can watch purchased videos.
5.  **Account Page**: Check that your purchase history is displayed correctly.

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check if Supabase project is active
   - Ensure SQL setup was run successfully

2. **Authentication Issues**
   - Verify Google OAuth redirect URI matches exactly
   - Check NEXTAUTH_SECRET is set
   - Ensure NEXTAUTH_URL matches your domain

3. **Stripe Webhook Failures**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Ensure endpoint is accessible

4. **Storage Access Issues**
   - Verify storage buckets exist
   - Check CORS settings
   - Ensure storage policies are correct

### Debug Commands:

```bash
# Check Vercel deployment logs
vercel logs

# Test database connection locally
npx prisma db pull

# Verify environment variables
vercel env ls
```

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics in your project
- Monitor performance and errors

### Supabase Monitoring
- Check database performance in Supabase dashboard
- Monitor storage usage

### Stripe Dashboard
- Monitor payment success rates
- Check webhook delivery status

## 🔄 Continuous Deployment

Your app will automatically redeploy when you push to the `main` branch on GitHub.

To update your app:
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Vercel will automatically deploy

## 🎉 Success!

Your video streaming application is now live and ready for users! 

**Next Steps:**
- Add your own video content through the admin panel
- Customize the design and branding
- Set up monitoring and analytics
- Consider adding more payment methods
- Implement user feedback and support systems

---

**Need Help?**
- Check the troubleshooting section above
- Review Vercel and Supabase documentation
- Test thoroughly in development before deploying changes 