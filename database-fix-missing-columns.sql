-- Fix missing columns for stable state
-- This adds any missing columns that the stable commit expects

-- Add is_active column to hero_videos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Recreate the index for is_active column
DROP INDEX IF EXISTS idx_hero_videos_active;
CREATE INDEX idx_hero_videos_active ON hero_videos(is_active);

-- Recreate the policy that uses is_active
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
CREATE POLICY "Everyone can view hero videos" ON hero_videos
  FOR SELECT USING (is_active = true);

-- Success message
SELECT 'Missing columns added successfully! ✅' as status; 