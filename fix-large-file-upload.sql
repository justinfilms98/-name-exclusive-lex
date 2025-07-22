-- Configure Supabase Storage for Large File Uploads
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Update storage bucket settings for large files
-- =====================================================

-- Update the media bucket to allow larger files
UPDATE storage.buckets 
SET file_size_limit = 2147483648  -- 2GB in bytes
WHERE name = 'media';

-- =====================================================
-- STEP 2: Update storage policies to allow large uploads
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- Create new policies with better error handling
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
-- STEP 3: Verify bucket configuration
-- =====================================================

SELECT 
  name,
  file_size_limit,
  allowed_mime_types,
  public
FROM storage.buckets 
WHERE name = 'media';

-- =====================================================
-- STEP 4: Test storage access
-- =====================================================

-- This will show if the bucket is accessible
SELECT COUNT(*) as bucket_exists
FROM storage.buckets 
WHERE name = 'media';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Storage configured for large file uploads! ✅' as status; 