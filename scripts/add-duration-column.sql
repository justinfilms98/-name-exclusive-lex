-- Add duration column to CollectionVideo table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Check if duration column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'CollectionVideo' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE "CollectionVideo" ADD COLUMN "duration" INTEGER;
        RAISE NOTICE 'Added duration column to CollectionVideo table';
    ELSE
        RAISE NOTICE 'Duration column already exists in CollectionVideo table';
    END IF;
END $$;

-- Update existing records with a default duration if needed
UPDATE "CollectionVideo" 
SET "duration" = 120 
WHERE "duration" IS NULL;

-- Add comment to the column
COMMENT ON COLUMN "CollectionVideo"."duration" IS 'Duration in minutes'; 