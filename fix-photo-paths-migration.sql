-- Fix photo_paths column in collections table
-- This migration ensures the photo_paths column exists and is properly configured

-- Check if photo_paths column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'photo_paths'
    ) THEN
        ALTER TABLE collections ADD COLUMN photo_paths TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added photo_paths column to collections table';
    ELSE
        RAISE NOTICE 'photo_paths column already exists in collections table';
    END IF;
END $$;

-- Update existing collections to have empty photo_paths array if NULL
UPDATE collections 
SET photo_paths = '{}' 
WHERE photo_paths IS NULL;

-- Create index on photo_paths for better performance
CREATE INDEX IF NOT EXISTS idx_collections_photo_paths ON collections USING GIN (photo_paths);

-- Success message
SELECT 'Photo paths migration completed successfully! ✅' as status; 