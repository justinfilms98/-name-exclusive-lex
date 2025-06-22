-- Supabase Storage Policies for Exclusive Lex
-- Run this in your Supabase SQL editor

-- RLS is already enabled on storage.objects, so the ALTER TABLE command is not needed.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated uploads to thumbnails and videos buckets
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('thumbnails', 'videos'));

-- Policy for authenticated users to read their own uploads
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('thumbnails', 'videos'));

-- Policy for authenticated users to update their own uploads
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('thumbnails', 'videos'));

-- Policy for authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('thumbnails', 'videos'));

-- Public read access for thumbnails (optional - for public viewing)
CREATE POLICY "Public thumbnail reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Note: Videos should remain private and only accessible via signed URLs 