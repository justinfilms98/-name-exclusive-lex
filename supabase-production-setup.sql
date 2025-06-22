-- =====================================================
-- SUPABASE PRODUCTION SETUP
-- Complete database configuration for production deployment
-- =====================================================

-- 1. DISABLE RLS ON USER-FACING TABLES (since we're using app-level security)
-- This allows our Next.js API routes to handle all data access securely

ALTER TABLE public."CollectionVideo" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."HeroVideo" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Purchase" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."TimedAccess" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" DISABLE ROW LEVEL SECURITY;

-- 2. STORAGE POLICIES FOR SECURE FILE ACCESS
-- These policies control access to uploaded videos and thumbnails

-- Policy for collection video files - only authenticated users with valid access
CREATE POLICY "Collection videos accessible to authenticated users with valid access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public."TimedAccess" ta
    WHERE ta."videoId" = (storage.foldername(name))[1]::text
    AND ta."userId" = auth.uid()::text
    AND ta."expiresAt" > NOW()
  )
);

-- Policy for hero video files - publicly accessible
CREATE POLICY "Hero videos publicly accessible" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos' AND
  storage.foldername(name) = ARRAY['hero']
);

-- Policy for thumbnails - publicly accessible
CREATE POLICY "Thumbnails publicly accessible" ON storage.objects
FOR SELECT USING (
  bucket_id = 'thumbnails'
);

-- Policy for admin uploads - only admin users
CREATE POLICY "Admin uploads only" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('videos', 'thumbnails') AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text
    AND u.role = 'admin'
  )
);

-- 3. CREATE NECESSARY INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_purchase_user_id ON public."Purchase"("userId");
CREATE INDEX IF NOT EXISTS idx_purchase_video_id ON public."Purchase"("videoId");
CREATE INDEX IF NOT EXISTS idx_purchase_created_at ON public."Purchase"("createdAt");
CREATE INDEX IF NOT EXISTS idx_timed_access_user_id ON public."TimedAccess"("userId");
CREATE INDEX IF NOT EXISTS idx_timed_access_video_id ON public."TimedAccess"("videoId");
CREATE INDEX IF NOT EXISTS idx_timed_access_expires_at ON public."TimedAccess"("expiresAt");
CREATE INDEX IF NOT EXISTS idx_collection_video_price ON public."CollectionVideo"(price);
CREATE INDEX IF NOT EXISTS idx_hero_video_status ON public."HeroVideo"(status);
CREATE INDEX IF NOT EXISTS idx_hero_video_moderated ON public."HeroVideo"(moderated);

-- 4. CREATE STORAGE BUCKETS IF THEY DON'T EXIST
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('videos', 'videos', false),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 5. SET UP CORS POLICIES FOR STORAGE
UPDATE storage.buckets 
SET cors_origins = ARRAY['https://your-domain.vercel.app', 'http://localhost:3000']
WHERE id IN ('videos', 'thumbnails');

-- 6. CREATE HELPER FUNCTIONS FOR ACCESS CONTROL

-- Function to check if user has access to a video
CREATE OR REPLACE FUNCTION public.check_video_access(video_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."TimedAccess" ta
    WHERE ta."videoId" = video_id
    AND ta."userId" = auth.uid()::text
    AND ta."expiresAt" > NOW()
  );
END;
$$;

-- Function to get user's active purchases
CREATE OR REPLACE FUNCTION public.get_user_purchases(user_id text)
RETURNS TABLE (
  purchase_id int,
  video_id int,
  video_title text,
  purchase_date timestamp,
  expires_at timestamp,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p."videoId",
    cv.title,
    p."createdAt",
    ta."expiresAt",
    (ta."expiresAt" > NOW()) as is_active
  FROM public."Purchase" p
  LEFT JOIN public."CollectionVideo" cv ON p."videoId" = cv.id
  LEFT JOIN public."TimedAccess" ta ON ta."videoId" = p."videoId"::text AND ta."userId" = p."userId"
  WHERE p."userId" = user_id
  ORDER BY p."createdAt" DESC;
END;
$$;

-- 7. SET UP TRIGGERS FOR AUTOMATIC CLEANUP

-- Trigger to clean up expired timed access records (optional)
CREATE OR REPLACE FUNCTION public.cleanup_expired_access()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public."TimedAccess" 
  WHERE "expiresAt" < NOW() - INTERVAL '1 day';
END;
$$;

-- 8. GRANT NECESSARY PERMISSIONS

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. SET UP ENVIRONMENT-SPECIFIC CONFIGURATIONS

-- Create a configuration table for app settings
CREATE TABLE IF NOT EXISTS public."AppConfig" (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO public."AppConfig" (key, value, description) VALUES
  ('stripe_webhook_secret', '', 'Stripe webhook secret for production'),
  ('stripe_publishable_key', '', 'Stripe publishable key'),
  ('stripe_secret_key', '', 'Stripe secret key'),
  ('nextauth_secret', '', 'NextAuth.js secret'),
  ('nextauth_url', '', 'NextAuth.js URL'),
  ('google_client_id', '', 'Google OAuth client ID'),
  ('google_client_secret', '', 'Google OAuth client secret')
ON CONFLICT (key) DO NOTHING;

-- 10. CREATE VIEWS FOR COMMON QUERIES

-- View for active user purchases
CREATE OR REPLACE VIEW public."ActiveUserPurchases" AS
SELECT 
  u.id as user_id,
  u.email,
  p.id as purchase_id,
  cv.id as video_id,
  cv.title as video_title,
  cv.description as video_description,
  cv.thumbnail_path,
  cv.price,
  p."createdAt" as purchase_date,
  ta."expiresAt" as access_expires,
  CASE WHEN ta."expiresAt" > NOW() THEN true ELSE false END as is_active
FROM public."User" u
JOIN public."Purchase" p ON u.id = p."userId"
JOIN public."CollectionVideo" cv ON p."videoId" = cv.id
LEFT JOIN public."TimedAccess" ta ON ta."videoId" = cv.id::text AND ta."userId" = u.id
ORDER BY p."createdAt" DESC;

-- Grant access to views
GRANT SELECT ON public."ActiveUserPurchases" TO authenticated;

-- =====================================================
-- DEPLOYMENT CHECKLIST
-- =====================================================
/*
1. Run this SQL file in your Supabase SQL editor
2. Update your .env.local with production values:
   - DATABASE_URL (from Supabase)
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

3. Deploy to Vercel:
   - Connect your GitHub repo
   - Set environment variables in Vercel
   - Deploy

4. Update Supabase storage CORS origins with your Vercel domain

5. Test the complete flow:
   - User registration/login
   - Browse collections
   - Add to cart
   - Checkout with Stripe
   - Access purchased content
   - Account page functionality
*/ 