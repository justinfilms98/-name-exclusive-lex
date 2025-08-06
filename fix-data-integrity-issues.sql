-- Fix data integrity issues with purchases
-- Run this in Supabase SQL Editor

-- Step 1: Check for duplicate session IDs
SELECT 
    stripe_session_id,
    COUNT(*) as purchase_count,
    STRING_AGG(user_id::text, ', ') as user_ids,
    STRING_AGG(collection_id::text, ', ') as collection_ids
FROM purchases 
WHERE stripe_session_id LIKE 'cs_%'
GROUP BY stripe_session_id
HAVING COUNT(*) > 1
ORDER BY purchase_count DESC;

-- Step 2: Check for incorrect amount_paid values (should be in dollars, not cents)
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    amount_paid,
    CASE 
        WHEN amount_paid >= 100 THEN amount_paid / 100.0 
        ELSE amount_paid 
    END as amount_paid_dollars,
    status,
    created_at
FROM purchases 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Step 3: Fix the amount_paid values (convert from cents to dollars)
UPDATE purchases 
SET amount_paid = amount_paid / 100.0
WHERE amount_paid >= 100 
AND created_at >= NOW() - INTERVAL '24 hours';

-- Step 4: Verify the fix
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    amount_paid,
    status,
    created_at
FROM purchases 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC; 