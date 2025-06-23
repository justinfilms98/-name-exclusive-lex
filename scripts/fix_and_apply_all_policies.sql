-- =================================================================
-- Final Policy Fix Script
-- =================================================================
-- This single script will correct the function definition and apply all
-- necessary storage policies. It can be run safely multiple times.
-- =================================================================

-- 1. Drop and Recreate the function to ensure correctness.
-- This function checks if a user has a valid purchase for a given media item.
DROP FUNCTION IF EXISTS public.can_view_media(uuid, uuid);

CREATE OR REPLACE FUNCTION public.can_view_media(p_media_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.purchases
    WHERE
      media_id = p_media_id AND
      user_id = p_user_id AND
      (expires_at IS NULL OR expires_at > now())
  );
END;
$$;


-- 2. Drop all storage policies to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public read on hero videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin writes on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow read for purchased media" ON storage.objects;


-- 3. Recreate all storage policies with the correct logic.

-- 3a. Policies for Hero Videos (publicly readable bucket)
CREATE POLICY "Allow public read on hero videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- 3b. Policies for Collection Media (protected bucket)
CREATE POLICY "Allow admin writes on media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media' AND public.is_admin() );

CREATE POLICY "Allow admin updates on media"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'media' AND public.is_admin() );

CREATE POLICY "Allow admin deletes on media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media' AND public.is_admin() );

-- 3c. The policy that uses our function to grant access to paying users.
CREATE POLICY "Allow read for purchased media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND
  public.can_view_media(
    (SELECT (storage.foldername(name))[1]::uuid),
    auth.uid()
  )
); 