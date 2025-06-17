# ExclusiveLex.com Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Database
DATABASE_URL=your_database_connection_string

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Supabase Setup

1. Create a new Supabase project
2. Set up the following storage buckets:
   - `thumbnails` (for video thumbnails)
   - `videos` (for video files)
3. Configure CORS for your domain in Supabase Storage settings
4. Set up Row Level Security (RLS) policies for the `purchases` table
5. Enable Google OAuth in Authentication settings (optional)

## Database Schema

The application uses the following key tables:
- `users` - User accounts
- `collection_videos` - Video content
- `purchases` - User video purchases
- `hero_videos` - Featured videos

## Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Configure webhook endpoints for payment processing

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Key Features Implemented

✅ **Admin Dashboard**
- Supabase upload for thumbnails and videos with authentication
- Fallback to signed upload URL flow
- Proper error handling and progress tracking

✅ **Supabase Client**
- Initialized with proper environment variables
- Authenticated user sessions for secure operations

✅ **Secure Video Playback**
- `/api/video-url` endpoint with authentication and purchase verification
- 1-hour signed URLs for video access
- Purchase expiration checking

✅ **Stripe Checkout**
- Server-side checkout with user authentication
- User ID and email in metadata for post-purchase processing
- Proper error handling

✅ **Post-Checkout Processing**
- `/api/verify-purchase` endpoint for Stripe session verification
- Automatic purchase record creation in Supabase
- 30-day access expiration

✅ **Watch Page Security**
- Supabase session authentication
- Watermark with user email
- Right-click and developer tools disabled
- Secure video URL fetching

✅ **Authentication System**
- Supabase authentication with email/password
- Google OAuth support
- Protected routes with middleware
- Proper session management

## Security Features

- All API routes require authentication
- Video access verified against purchase records
- Signed URLs with expiration
- CORS protection
- Input validation and sanitization

## Production Deployment

1. Set up environment variables in your hosting platform
2. Configure Supabase production settings
3. Set up Stripe webhooks for production
4. Update CORS settings for your production domain
5. Configure proper SSL certificates

## Troubleshooting

- Ensure all environment variables are set correctly
- Check Supabase storage bucket permissions
- Verify Stripe webhook configurations
- Monitor authentication logs in Supabase dashboard 