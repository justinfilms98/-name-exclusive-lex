-- ================================================================================================
--
--  EXCLUSIVE LEX - CORRECTED RLS & STORAGE POLICIES
--
--  Instructions:
--  1.  Review this script carefully.
--  2.  Run this script in your Supabase SQL Editor.
--  3.  This script assumes you are using Supabase Authentication for your users.
--      If you are using a hybrid NextAuth setup, these policies will NOT work as expected
--      without significant architectural changes to your application.
--
-- ================================================================================================

-- Drop all existing policies to start fresh.
-- NOTE: This will temporarily remove all access restrictions. Do this during maintenance.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Allow full access for admins" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual read access" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual write access" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to view their own purchases" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to view their own timed access" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Allow read access to all users" ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;


-- ================================================================================================
--  Step 1: Helper Functions & Custom Types
-- ================================================================================================

-- Helper function to get the role of the currently authenticated user from your public.User table.
-- It's marked as SECURITY DEFINER to run with the privileges of the user who defined it,
-- allowing it to read the User table.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search path to prevent hijacking.
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  ELSE
    -- Assumes the `id` in your `public.User` table is a text representation of the auth.users.id UUID.
    RETURN (SELECT "role" FROM public."User" WHERE id = auth.uid()::text LIMIT 1);
  END IF;
END;
$$;


-- ================================================================================================
--  Step 2: Table Creation for TimedAccess
-- ================================================================================================

-- Create the TimedAccess table to store temporary access grants for purchased content.
-- This table is populated by your Stripe webhook upon a successful purchase.
CREATE TABLE IF NOT EXISTS public."TimedAccess" (
    id BIGSERIAL PRIMARY KEY,
    "purchaseId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "mediaId" TEXT NOT NULL, -- Can be videoId, collectionId, etc.
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Foreign key to your user table.
    -- Ensure your public."User".id is compatible with UUIDs.
    CONSTRAINT "TimedAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for efficient lookups of a user's access records.
CREATE INDEX IF NOT EXISTS "idx_timedaccess_user_media" ON public."TimedAccess" ("userId", "mediaId");


-- ================================================================================================
--  Step 3: Row Level Security (RLS) Policies
-- ================================================================================================

--
-- Table: User
-- Purpose: Users can see and manage their own profile data. Admins can manage all users.
--
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON public."User"
AS PERMISSIVE FOR ALL
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow individual read/write access" ON public."User"
AS PERMISSIVE FOR ALL
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);


--
-- Table: Collection & MediaItem (Content metadata)
-- Purpose: Admins can create, update, and delete all content. All users can view it.
--
ALTER TABLE public."Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Collection" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON public."Collection"
AS PERMISSIVE FOR ALL
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow read access to all users" ON public."Collection"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);


ALTER TABLE public."MediaItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MediaItem" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON public."MediaItem"
AS PERMISSIVE FOR ALL
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow read access to all users" ON public."MediaItem"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);


--
-- Tables: Video & CollectionVideo (Assuming these are also admin-managed content)
--
ALTER TABLE public."Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Video" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access for admins" ON public."Video" FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Allow read access to all users" ON public."Video" FOR SELECT USING (true);

ALTER TABLE public."CollectionVideo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CollectionVideo" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access for admins" ON public."CollectionVideo" FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Allow read access to all users" ON public."CollectionVideo" FOR SELECT USING (true);


--
-- Table: Purchase
-- Purpose: Users can only see their own purchase history. Admins can see all purchases.
--
ALTER TABLE public."Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Purchase" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON public."Purchase"
AS PERMISSIVE FOR ALL
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow users to view their own purchases" ON public."Purchase"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ("userId"::uuid = auth.uid());


--
-- Table: TimedAccess
-- Purpose: Users can only access their own valid (non-expired) access records.
--
ALTER TABLE public."TimedAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TimedAccess" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON public."TimedAccess"
AS PERMISSIVE FOR ALL
TO authenticated
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow users to view their own timed access" ON public."TimedAccess"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  "userId" = auth.uid() AND
  "expiresAt" > now()
);


-- ================================================================================================
--  Step 4: Storage Policies
-- ================================================================================================

-- Drop existing, overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public thumbnail reads" ON storage.objects;

--
-- Bucket: thumbnails
--
CREATE POLICY "Allow public read access to thumbnails"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'thumbnails' );

CREATE POLICY "Allow admin write access to thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'thumbnails' AND public.get_user_role() = 'admin' );

CREATE POLICY "Allow admin update access to thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'thumbnails' AND public.get_user_role() = 'admin' );

CREATE POLICY "Allow admin delete access to thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'thumbnails' AND public.get_user_role() = 'admin' );

--
-- Bucket: videos
--
CREATE POLICY "Allow admin write access to videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'videos' AND public.get_user_role() = 'admin' );

CREATE POLICY "Allow admin update access to videos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'videos' AND public.get_user_role() = 'admin' );

CREATE POLICY "Allow admin delete access to videos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'videos' AND public.get_user_role() = 'admin' );

-- NOTE on Video Access:
-- Videos should NOT be publicly readable.
-- Your backend should generate secure, time-limited signed URLs for authenticated users
-- who have a valid record in the "TimedAccess" table.
-- The service_role key can be used on the server to bypass RLS and create these URLs.

-- ================================================================================================
--                                    END OF SCRIPT
-- ================================================================================================ 