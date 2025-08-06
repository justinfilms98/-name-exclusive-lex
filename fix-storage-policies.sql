-- Fix Supabase Storage Policies for Media Access - PRODUCTION READY
-- This script sets up the correct RLS policies for the 'media' bucket

-- Step 1: Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (if they exist)
DROP POLICY IF EXISTS "Allow access to purchased media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes" ON storage.objects;

-- Step 3: Create policy to allow access to purchased media files
-- This policy allows users to access media files if they have purchased the corresponding collection
CREATE POLICY "Allow access to purchased media" ON storage.objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchases p
      JOIN collections c ON p.collection_id = c.id
      WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        -- Check if the file path matches the collection's media_filename
        (c.media_filename IS NOT NULL AND storage.objects.name = c.media_filename)
        OR
        -- Check if the file path matches the collection's video_path
        (c.video_path IS NOT NULL AND storage.objects.name = c.video_path)
        OR
        -- Check if the file is in the collection's directory (for photos, thumbnails, etc.)
        (c.media_filename IS NOT NULL AND storage.objects.name LIKE c.media_filename || '%')
        OR
        (c.video_path IS NOT NULL AND storage.objects.name LIKE c.video_path || '%')
      )
    )
  );

-- Step 4: Create policy to allow ONLY contact.exclusivelex@gmail.com to upload files
CREATE POLICY "Allow admin uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'contact.exclusivelex@gmail.com'
    )
  );

-- Step 5: Create policy to allow ONLY contact.exclusivelex@gmail.com to update files
CREATE POLICY "Allow admin updates" ON storage.objects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'contact.exclusivelex@gmail.com'
    )
  );

-- Step 6: Create policy to allow ONLY contact.exclusivelex@gmail.com to delete files
CREATE POLICY "Allow admin deletes" ON storage.objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'contact.exclusivelex@gmail.com'
    )
  );

-- Step 7: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname; 