-- Debug Upload Issues - Database Check
-- Run this in Supabase SQL Editor to identify potential issues

-- =====================================================
-- STEP 1: Check if tables exist
-- =====================================================

SELECT 'Checking table existence...' as status;

SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('collections', 'hero_videos', 'purchases', 'watch_logs')
ORDER BY table_name;

-- =====================================================
-- STEP 2: Check collections table structure
-- =====================================================

SELECT 'Checking collections table structure...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'collections'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 3: Check RLS policies
-- =====================================================

SELECT 'Checking RLS policies...' as status;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('collections', 'hero_videos', 'purchases')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 4: Check storage buckets
-- =====================================================

SELECT 'Checking storage buckets...' as status;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'media';

-- =====================================================
-- STEP 5: Check storage policies
-- =====================================================

SELECT 'Checking storage policies...' as status;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- =====================================================
-- STEP 6: Test basic operations
-- =====================================================

SELECT 'Testing basic operations...' as status;

-- Test insert (this will fail if RLS is blocking)
INSERT INTO collections (id, title, description, price, duration, video_path, thumbnail_path)
VALUES (
  gen_random_uuid(),
  'TEST_COLLECTION',
  'Test description',
  29.99,
  1800,
  'test/video.mp4',
  'test/thumbnail.jpg'
) ON CONFLICT DO NOTHING;

-- Check if insert worked
SELECT COUNT(*) as test_collections_count
FROM collections 
WHERE title = 'TEST_COLLECTION';

-- Clean up test data
DELETE FROM collections WHERE title = 'TEST_COLLECTION';

-- =====================================================
-- STEP 7: Check for any errors
-- =====================================================

SELECT 'Checking for recent errors...' as status;

-- This will show recent database errors if any
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start DESC
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Database check completed! Check the results above for any issues.' as status; 