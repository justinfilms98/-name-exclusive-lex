-- Create albums table if it doesn't exist and add thumbnail_path column
-- Run this in Supabase SQL Editor

-- First, create the albums table if it doesn't exist
CREATE TABLE IF NOT EXISTS "albums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add thumbnail_path column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'albums' AND column_name = 'thumbnail_path') THEN
        ALTER TABLE "albums" ADD COLUMN "thumbnail_path" TEXT;
    END IF;
END $$;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS "albums_slug_idx" ON "albums"("slug");

-- Add foreign key constraint from collections to albums if album_id column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'collections' AND column_name = 'album_id') THEN
        -- Check if foreign key constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'collections_album_id_fkey' 
            AND table_name = 'collections'
        ) THEN
            ALTER TABLE "collections" 
            ADD CONSTRAINT "collections_album_id_fkey" 
            FOREIGN KEY ("album_id") 
            REFERENCES "albums"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

