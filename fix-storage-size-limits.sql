-- Fix Storage Size Limits for 2GB Uploads
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Check current storage bucket configuration
-- =====================================================

SELECT 'Checking current storage configuration...' as status;

SELECT 
  name,
  file_size_limit,
  allowed_mime_types,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'media';

-- =====================================================
-- STEP 2: Update storage bucket for 2GB files
-- =====================================================

SELECT 'Updating storage bucket configuration...' as status;

-- Update the media bucket to allow 2GB files
UPDATE storage.buckets 
SET 
  file_size_limit = 2147483648,  -- 2GB in bytes
  allowed_mime_types = ARRAY['video/*', 'image/*', 'application/octet-stream']
WHERE name = 'media';

-- =====================================================
-- STEP 3: Verify the update worked
-- =====================================================

SELECT 'Verifying storage configuration...' as status;

SELECT 
  name,
  file_size_limit,
  file_size_limit / 1024 / 1024 / 1024 as size_limit_gb,
  allowed_mime_types,
  public
FROM storage.buckets 
WHERE name = 'media';

-- =====================================================
-- STEP 4: Update storage policies for better access
-- =====================================================

SELECT 'Updating storage policies...' as status;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- Create new comprehensive policies
CREATE POLICY "Authenticated users can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    (auth.email() = 'contact.exclusivelex@gmail.com' OR auth.role() = 'service_role')
  );

CREATE POLICY "Admins can update media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' AND 
    (auth.email() = 'contact.exclusivelex@gmail.com' OR auth.role() = 'service_role')
  );

CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND 
    (auth.email() = 'contact.exclusivelex@gmail.com' OR auth.role() = 'service_role')
  );

-- =====================================================
-- STEP 5: Test storage access
-- =====================================================

SELECT 'Testing storage access...' as status;

-- Check if bucket exists and is accessible
SELECT COUNT(*) as bucket_exists
FROM storage.buckets 
WHERE name = 'media';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- =====================================================
-- STEP 6: Create test bucket if media doesn't exist
-- =====================================================

SELECT 'Ensuring media bucket exists...' as status;

-- Insert media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,
  2147483648,  -- 2GB
  ARRAY['video/*', 'image/*', 'application/octet-stream']
) ON CONFLICT (name) DO UPDATE SET
  file_size_limit = 2147483648,
  allowed_mime_types = ARRAY['video/*', 'image/*', 'application/octet-stream'];

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Storage configuration updated for 2GB uploads! ✅' as status; 