-- Remove Timer and Duration Functionality
-- This migration removes all timer-related fields and duration limits from the system

-- 1. Remove timer-related columns from purchases table
ALTER TABLE purchases DROP COLUMN IF EXISTS expires_at;
ALTER TABLE purchases DROP COLUMN IF EXISTS timer_started;
ALTER TABLE purchases DROP COLUMN IF EXISTS timer_started_at;

-- 2. Remove duration column from collections table (if it exists)
ALTER TABLE collections DROP COLUMN IF EXISTS duration;

-- 3. Remove duration column from CollectionVideo table (if it exists)
-- First check if the table exists before trying to modify it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CollectionVideo') THEN
        ALTER TABLE "CollectionVideo" DROP COLUMN IF EXISTS duration;
    END IF;
END $$;

-- 4. Remove any indexes related to expiration
DROP INDEX IF EXISTS idx_purchases_expires_at;

-- 5. Update any existing purchases to remove expiration dates
-- (This will make all existing purchases permanent)
UPDATE purchases SET expires_at = NULL WHERE expires_at IS NOT NULL;

-- 6. Update RLS policies to remove expiration checks
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'purchases';

-- 7. Create new simplified policies without expiration checks
-- (This will be done in the application code)

-- 8. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'collections' 
ORDER BY ordinal_position;

-- Check if CollectionVideo table exists before querying it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CollectionVideo') THEN
        PERFORM (
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'CollectionVideo' 
            ORDER BY ordinal_position
        );
    ELSE
        RAISE NOTICE 'CollectionVideo table does not exist - skipping column verification';
    END IF;
END $$;

-- 9. Show current purchase records (without expiration)
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    created_at,
    is_active,
    deactivated_at
FROM purchases 
LIMIT 5; 