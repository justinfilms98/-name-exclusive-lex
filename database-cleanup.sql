-- Option B: Clean Slate - Remove Everything and Start Fresh
-- ⚠️  WARNING: This will DELETE ALL your existing data!
-- Only run this if you want to start completely over

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS watch_logs CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS collections CASCADE;

-- Drop old hero/collection video tables if they exist
DROP TABLE IF EXISTS hero_videos CASCADE;
DROP TABLE IF EXISTS collection_videos CASCADE;
DROP TABLE IF EXISTS media_items CASCADE;

-- Drop old Prisma tables if they exist
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;

-- Clean up storage policies
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- Remove storage bucket if it exists
DELETE FROM storage.buckets WHERE id = 'media';

-- Now run the fresh schema
-- (Copy and paste the original database-schema.sql content after running this) 