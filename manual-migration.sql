-- Manual migration to add video_duration column
-- Run this in your Supabase SQL editor

-- Add video_duration column to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS "video_duration" INTEGER;

-- Update existing collections to have a default video duration
UPDATE collections SET "video_duration" = 300 WHERE "video_duration" IS NULL;

-- Make the field required after setting defaults
ALTER TABLE collections ALTER COLUMN "video_duration" SET NOT NULL;

-- Add comments to clarify the difference between duration fields
COMMENT ON COLUMN collections.duration IS 'Access duration in seconds (how long user has to watch)';
COMMENT ON COLUMN collections."video_duration" IS 'Actual video length in seconds';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_collections_video_duration ON collections("video_duration");

-- Verify the changes
SELECT id, title, duration, "video_duration" FROM collections LIMIT 5; 