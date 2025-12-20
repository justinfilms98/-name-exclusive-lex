-- Add thumbnail_path column to albums table if it doesn't exist
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'albums' AND column_name = 'thumbnail_path') THEN
        ALTER TABLE "albums" ADD COLUMN "thumbnail_path" TEXT;
    END IF;
END $$;

