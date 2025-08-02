-- Fix Database Schema Mismatch
-- Run this in your Supabase SQL Editor to fix the column mismatch

-- 1. Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop the old 'amount' column if it exists and create the correct 'amount_paid' column
DO $$
BEGIN
    -- Check if 'amount' column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount') THEN
        -- Drop the old 'amount' column
        ALTER TABLE purchases DROP COLUMN amount;
        RAISE NOTICE 'Dropped old "amount" column';
    END IF;
    
    -- Check if 'amount_paid' column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount_paid') THEN
        -- Add the correct 'amount_paid' column
        ALTER TABLE purchases ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Added "amount_paid" column';
    END IF;
    
    -- Check if 'expires_at' column exists and remove it if it does
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'expires_at') THEN
        ALTER TABLE purchases DROP COLUMN expires_at;
        RAISE NOTICE 'Dropped "expires_at" column';
    END IF;
END $$;

-- 3. Verify the corrected table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Update any existing purchase records to have a default amount_paid if they don't have one
UPDATE purchases 
SET amount_paid = 0.00 
WHERE amount_paid IS NULL;

-- 5. Verify the fix
SELECT 
    'Schema fix complete' as status,
    (SELECT COUNT(*) FROM purchases) as total_purchases,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount_paid') as has_amount_paid,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount') as has_old_amount; 