-- Add video_duration field to collections table
-- This field will store the actual video length in seconds, separate from the access duration

ALTER TABLE collections ADD COLUMN video_duration INTEGER;

-- Update existing collections to have a default video duration
-- For now, set it to a reasonable default (e.g., 5 minutes = 300 seconds)
UPDATE collections SET video_duration = 300 WHERE video_duration IS NULL;

-- Make the field required after setting defaults
ALTER TABLE collections ALTER COLUMN video_duration SET NOT NULL;

-- Add a comment to clarify the difference between duration and video_duration
COMMENT ON COLUMN collections.duration IS 'Access duration in seconds (how long user has to watch)';
COMMENT ON COLUMN collections.video_duration IS 'Actual video length in seconds';

-- Create an index for video_duration for better query performance
CREATE INDEX idx_collections_video_duration ON collections(video_duration); 