-- Check Purchase Limits - Focused Diagnostic
-- Run this in your Supabase SQL Editor

-- 1. Count total purchases
SELECT 
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_purchases,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_purchases
FROM purchases;

-- 2. Show all purchases with details
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

-- 3. Check for unique constraints that might prevent multiple purchases
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'purchases' 
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 4. Check if there are any duplicate user_id + collection_id combinations
SELECT 
    user_id,
    collection_id,
    COUNT(*) as purchase_count
FROM purchases 
WHERE is_active = true
GROUP BY user_id, collection_id
HAVING COUNT(*) > 1;

-- 5. Check RLS policies on purchases table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchases';

-- 6. Test access for a specific user (replace with actual user_id)
-- SELECT 
--     p.id,
--     p.user_id,
--     p.collection_id,
--     p.is_active,
--     c.title as collection_title
-- FROM purchases p
-- JOIN collections c ON p.collection_id = c.id
-- WHERE p.user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY p.created_at DESC; 