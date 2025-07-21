-- Fix Hero Videos Thumbnail Issue
-- Make thumbnail_url nullable since hero videos don't require thumbnails

-- =====================================================
-- STEP 1: Make thumbnail_url nullable
-- =====================================================

-- Make thumbnail_url nullable
ALTER TABLE hero_videos ALTER COLUMN thumbnail_url DROP NOT NULL;

-- =====================================================
-- STEP 2: Update existing records if needed
-- =====================================================

-- Set thumbnail_url to NULL for records that don't have it
UPDATE hero_videos 
SET thumbnail_url = NULL 
WHERE thumbnail_url = '';

-- =====================================================
-- STEP 3: Verify the fix
-- =====================================================

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hero_videos' 
AND column_name IN ('thumbnail_url', 'video_url', 'video_path')
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Hero videos thumbnail issue fixed successfully! ✅' as status; 