-- Debug Purchases - Check for any limits or issues
-- Run this in your Supabase SQL Editor

-- 1. Check all purchases for the user (replace with actual user_id)
-- First, let's see all purchases to understand the pattern
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    created_at,
    is_active,
    amount_paid
FROM purchases 
ORDER BY created_at DESC;

-- 2. Check if there are any constraints or limits on the purchases table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'purchases';

-- 3. Check RLS policies on purchases table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchases';

-- 4. Check if there are any triggers that might limit purchases
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'purchases';

-- 5. Check the collections table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
ORDER BY ordinal_position;

-- 6. Check if there are any unique constraints that might prevent multiple purchases
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'purchases' 
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 7. Check for any views that might limit access
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%purchase%' 
    OR table_name LIKE '%collection%'; 