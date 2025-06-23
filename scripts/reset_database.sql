-- WARNING: This script will completely delete all data in your 'public' schema
-- and reset it according to the application's needs.
--
-- BACK UP YOUR DATA BEFORE RUNNING THIS SCRIPT.
--

-- Step 1: Drop the existing public schema and recreate it.
-- This will cascade and delete all tables, views, functions, and data within it.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant usage on the new public schema to the default roles.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- The 'auth.users' table is managed by Supabase Auth and is not in the 'public' schema,
-- so it will not be deleted. Our new tables will reference it.

--------------------------------------------------------------------------------
-- Step 2: Create the application tables
--------------------------------------------------------------------------------

-- Collections Table: A group of media, like an album or a gallery.
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.collections IS 'A collection represents a group of media items that can be purchased together.';

-- Collection Media Table: Individual media items belonging to a collection.
CREATE TABLE public.collection_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- URLs for the media content, managed via Supabase Storage.
  video_url TEXT,
  thumbnail_url TEXT,
  -- The price for this specific media item.
  price NUMERIC(10, 2) CHECK (price >= 0),
  -- Duration of the video in seconds.
  duration_seconds INT,
  -- SEO tags for better searchability.
  seo_tags TEXT[],
  -- Order for displaying items within a collection.
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.collection_media IS 'Individual media items (videos, images) that are part of a collection.';

-- Hero Videos Table: Videos for the homepage hero section.
CREATE TABLE public.hero_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  video_url TEXT NOT NULL,
  -- Order for rotating videos on the homepage.
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.hero_videos IS 'Rotating videos displayed on the homepage hero section.';

-- Purchases Table: Tracks user purchases of collections.
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  media_id UUID NOT NULL REFERENCES public.collection_media(id),
  -- The amount paid for the purchase.
  amount_paid NUMERIC(10, 2),
  -- Stripe charge ID for reference.
  stripe_charge_id TEXT,
  -- The purchase link will expire based on this timestamp.
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.purchases IS 'Records a user''s purchase of a single media item, granting timed access.';


--------------------------------------------------------------------------------
-- Step 3: Set up Row Level Security (RLS)
--------------------------------------------------------------------------------

-- Helper function to check if the current user is an admin.
-- This function checks the 'role' column on the 'auth.users' table.
-- It's defined as SECURITY DEFINER to have the necessary permissions to read auth.users.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  ELSE
    RETURN (
      SELECT role = 'admin'
      FROM auth.users
      WHERE id = auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANT: For the admin policies to work, you must ensure your admin user(s)
-- have their 'role' set to 'admin' in the 'auth.users' table.
-- You can update this directly in the Supabase table editor or with an SQL command:
-- UPDATE auth.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Enable RLS on all tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;


-- Policies for `collections` table
CREATE POLICY "Allow authenticated users to read collections"
  ON public.collections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to manage collections"
  ON public.collections FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies for `collection_media` table
CREATE POLICY "Allow authenticated users to read collection media"
  ON public.collection_media FOR SELECT
  USING (auth.role() = 'authenticated');
  
CREATE POLICY "Allow admin to manage collection media"
  ON public.collection_media FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies for `hero_videos` table
CREATE POLICY "Allow public read access to hero videos"
  ON public.hero_videos FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to manage hero videos"
  ON public.hero_videos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies for `purchases` table
CREATE POLICY "Allow users to see their own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Allow users to create their own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin to manage all purchases"
  ON public.purchases FOR ALL
  USING (public.is_admin());

--------------------------------------------------------------------------------
-- Step 4: Set up Supabase Storage Policies
-- These are just examples. You should review your storage policies in the Supabase dashboard.
--------------------------------------------------------------------------------

-- Example policy for a 'hero-videos' bucket
-- This policy allows admin to upload and authenticated users to view.
-- CREATE POLICY "Admin upload access" ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'hero-videos' AND public.is_admin() );

-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT
-- USING ( bucket_id = 'hero-videos' );

-- Example policy for a 'collection-media' bucket
-- CREATE POLICY "Admin upload access" ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'collection-media' AND public.is_admin() );

-- For collection media, read access should be granted only after purchase.
-- This requires a more complex setup involving a function to check for a valid purchase.
-- Example function:
/*
CREATE OR REPLACE FUNCTION public.can_view_media(media_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchase BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.purchases p
    WHERE p.media_id = media_id
      AND p.user_id = auth.uid()
      AND (p.expires_at IS NULL OR p.expires_at > NOW()) -- Handle permanent and expiring access
  ) INTO has_purchase;
  RETURN has_purchase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- Example policy using the function:
-- CREATE POLICY "Allow read access for valid purchasers" ON storage.objects FOR SELECT
-- USING ( bucket_id = 'collection-media' AND public.can_view_media( (storage.foldername[2])::uuid ) );


-- The policies above are commented out. You need to create buckets and uncomment/adjust
-- policies according to your needs in the Supabase Dashboard under Storage -> Policies.

SELECT 'Database reset script executed successfully.'; 