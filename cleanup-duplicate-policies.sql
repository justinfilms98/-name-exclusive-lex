-- Clean up duplicate storage policies
-- This script removes redundant policies to avoid conflicts

-- Step 1: Drop old/duplicate policies
DROP POLICY IF EXISTS "Admin delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin update" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated view" ON storage.objects;
DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects;

-- Step 2: Keep only the essential policies
-- These are the policies we want to keep:
-- 1. "Allow authenticated access to media" - for immediate access
-- 2. "Allow admin uploads" - for admin uploads
-- 3. "Allow admin updates" - for admin updates  
-- 4. "Allow admin deletes" - for admin deletes

-- Step 3: Verify the final policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname; 