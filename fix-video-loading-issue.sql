-- Fix video loading issue for permanent access
-- Run this in your Supabase SQL Editor

-- 1. Ensure is_active column exists in purchases table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE purchases ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column to purchases table';
    ELSE
        RAISE NOTICE 'is_active column already exists in purchases table';
    END IF;
END $$;

-- 2. Remove expires_at column if it exists (for permanent access)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE purchases DROP COLUMN expires_at;
        RAISE NOTICE 'Removed expires_at column from purchases table';
    ELSE
        RAISE NOTICE 'expires_at column does not exist - skipping';
    END IF;
END $$;

-- 3. Update all existing purchases to be active
UPDATE purchases SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- 4. Ensure RLS policies allow access to purchased content
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view purchased collections" ON collections;

-- Create new policies for permanent access
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Users can view purchased collections" ON collections
    FOR SELECT USING (
        id IN (
            SELECT collection_id 
            FROM purchases 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- 5. Ensure collections table has all required columns
DO $$
BEGIN
    -- Add video_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'video_url'
    ) THEN
        ALTER TABLE collections ADD COLUMN video_url TEXT;
        RAISE NOTICE 'Added video_url column to collections table';
    ELSE
        RAISE NOTICE 'video_url column already exists in collections table';
    END IF;
    
    -- Add photo_paths column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'photo_paths'
    ) THEN
        ALTER TABLE collections ADD COLUMN photo_paths TEXT[];
        RAISE NOTICE 'Added photo_paths column to collections table';
    ELSE
        RAISE NOTICE 'photo_paths column already exists in collections table';
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_active ON purchases(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_collection_active ON purchases(collection_id, is_active);

-- 7. Grant necessary permissions
GRANT SELECT ON purchases TO authenticated;
GRANT SELECT ON collections TO authenticated;

-- 8. Verify the structure
SELECT 
    'purchases' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

SELECT 
    'collections' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'collections' 
ORDER BY ordinal_position; 