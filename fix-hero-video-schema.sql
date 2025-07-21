-- Fix Hero Videos Table Schema
-- This script aligns the database schema with the upload code

-- =====================================================
-- STEP 1: Check current table structure
-- =====================================================

-- Show current hero_videos table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hero_videos' 
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: Add missing columns if needed
-- =====================================================

-- Add video_url column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'video_url'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN video_url TEXT;
        RAISE NOTICE 'Added video_url column to hero_videos';
    ELSE
        RAISE NOTICE 'Video_url column already exists in hero_videos';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Update existing records to have video_url
-- =====================================================

-- Update existing records to set video_url = video_path
UPDATE hero_videos 
SET video_url = video_path 
WHERE video_url IS NULL AND video_path IS NOT NULL;

-- =====================================================
-- STEP 4: Make video_url NOT NULL if it has data
-- =====================================================

-- Only make video_url NOT NULL if all records have it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM hero_videos WHERE video_url IS NULL
    ) THEN
        ALTER TABLE hero_videos ALTER COLUMN video_url SET NOT NULL;
        RAISE NOTICE 'Made video_url NOT NULL';
    ELSE
        RAISE NOTICE 'Some records have NULL video_url - keeping nullable';
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Hero videos schema fixed successfully! ✅' as status; 