-- =================================================================
-- Fix for Storage Policies (v4 - Final)
-- =================================================================
-- This script is now idempotent and can be run multiple times safely.
-- It will drop any existing policies before recreating them to ensure a clean state.
-- =================================================================

-- Drop existing policies if they exist to allow re-running the script
DROP POLICY IF EXISTS "Allow public read on hero videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin writes on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow read for purchased media" ON storage.objects;


-- 1. Policies for Hero Videos (publicly readable)
-- Assumes hero videos are stored in a bucket named 'videos'.

CREATE POLICY "Allow public read on hero videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );


-- 2. Policies for Collection Media (protected)
-- Assumes collection media items are stored in a bucket named 'media'.

-- 2a. Allow admins to upload/insert new media.
CREATE POLICY "Allow admin writes on media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media' AND public.is_admin() );

-- 2b. Allow admins to update media.
CREATE POLICY "Allow admin updates on media"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'media' AND public.is_admin() );

-- 2c. Allow admins to delete media.
CREATE POLICY "Allow admin deletes on media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media' AND public.is_admin() );

-- 2d. Allow users to read media they have purchased.
-- This policy checks if a user has a valid purchase for the media item.
-- It extracts the media_id from the file path and passes it along with the
-- current user's ID to the can_view_media function.
CREATE POLICY "Allow read for purchased media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND
  public.can_view_media(
    (SELECT (storage.foldername(name))[1]::uuid),
    auth.uid()
  )
); 