-- Verify Supabase Database Schema
-- Run this to check the current state of your database

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES ('collections'), ('purchases'), ('hero_videos'), ('watch_logs')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public';

-- Check collections table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check purchases table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if storage bucket exists
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE id = 'media';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('collections', 'purchases', 'hero_videos', 'watch_logs');

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('collections', 'purchases', 'hero_videos', 'watch_logs');

-- Sample data check
SELECT 
    'collections' as table_name,
    COUNT(*) as row_count
FROM collections
UNION ALL
SELECT 
    'purchases' as table_name,
    COUNT(*) as row_count
FROM purchases
UNION ALL
SELECT 
    'hero_videos' as table_name,
    COUNT(*) as row_count
FROM hero_videos
UNION ALL
SELECT 
    'watch_logs' as table_name,
    COUNT(*) as row_count
FROM watch_logs; 