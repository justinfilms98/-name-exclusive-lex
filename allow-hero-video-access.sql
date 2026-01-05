-- Allow public access to hero videos for logged-out users
-- Hero videos should be accessible to anyone (after age verification on frontend)
-- Run this in Supabase SQL Editor

-- Create policy to allow SELECT access to hero videos for all users (authenticated and anonymous)
CREATE POLICY "Allow public access to hero videos" ON storage.objects
  FOR SELECT USING (
    -- Allow access to files in the 'hero/' folder
    bucket_id = 'media' 
    AND (storage.objects.name LIKE 'hero/%' OR storage.objects.name LIKE 'hero/%/%')
  );

-- Note: This policy allows anyone (including unauthenticated users) to access hero videos
-- The age gate is enforced on the frontend, but the videos themselves are publicly accessible
-- This is necessary for the hero video to play for logged-out users after age verification
