-- Remove Timer and Duration Functionality
-- This migration removes all timer-related fields and duration limits from the system

-- 1. Remove timer-related columns from purchases table
ALTER TABLE purchases DROP COLUMN IF EXISTS expires_at;
ALTER TABLE purchases DROP COLUMN IF EXISTS timer_started;
ALTER TABLE purchases DROP COLUMN IF EXISTS timer_started_at;

-- 2. Remove duration column from collections table
ALTER TABLE purchases DROP COLUMN IF EXISTS duration;

-- 3. Remove duration column from CollectionVideo table
ALTER TABLE "CollectionVideo" DROP COLUMN IF EXISTS duration;

-- 4. Update any existing purchases to remove expiration dates
-- (This will make all existing purchases permanent)
UPDATE purchases SET expires_at = NULL WHERE expires_at IS NOT NULL;

-- 5. Remove any indexes related to expiration
DROP INDEX IF EXISTS idx_purchases_expires_at;

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

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'CollectionVideo' 
ORDER BY ordinal_position;

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