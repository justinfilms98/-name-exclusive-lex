-- Remove Timer and Duration Functionality
-- This migration removes all timer-related fields and duration limits from the system

-- 1. Remove timer-related columns from purchases table (only if they exist)
DO $$
BEGIN
    -- Remove expires_at column if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'expires_at') THEN
        ALTER TABLE purchases DROP COLUMN expires_at;
        RAISE NOTICE 'Removed expires_at column from purchases table';
    ELSE
        RAISE NOTICE 'expires_at column does not exist in purchases table - skipping';
    END IF;
    
    -- Remove timer_started column if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'timer_started') THEN
        ALTER TABLE purchases DROP COLUMN timer_started;
        RAISE NOTICE 'Removed timer_started column from purchases table';
    ELSE
        RAISE NOTICE 'timer_started column does not exist in purchases table - skipping';
    END IF;
    
    -- Remove timer_started_at column if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'timer_started_at') THEN
        ALTER TABLE purchases DROP COLUMN timer_started_at;
        RAISE NOTICE 'Removed timer_started_at column from purchases table';
    ELSE
        RAISE NOTICE 'timer_started_at column does not exist in purchases table - skipping';
    END IF;
END $$;

-- 2. Remove duration column from collections table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'duration') THEN
        ALTER TABLE collections DROP COLUMN duration;
        RAISE NOTICE 'Removed duration column from collections table';
    ELSE
        RAISE NOTICE 'duration column does not exist in collections table - skipping';
    END IF;
END $$;

-- 3. Remove duration column from CollectionVideo table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CollectionVideo') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'CollectionVideo' AND column_name = 'duration') THEN
            ALTER TABLE "CollectionVideo" DROP COLUMN duration;
            RAISE NOTICE 'Removed duration column from CollectionVideo table';
        ELSE
            RAISE NOTICE 'duration column does not exist in CollectionVideo table - skipping';
        END IF;
    ELSE
        RAISE NOTICE 'CollectionVideo table does not exist - skipping';
    END IF;
END $$;

-- 4. Remove any indexes related to expiration
DROP INDEX IF EXISTS idx_purchases_expires_at;

-- 5. Update RLS policies to remove expiration checks
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'purchases';

-- 6. Verify the changes
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

-- 7. Show current purchase records
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