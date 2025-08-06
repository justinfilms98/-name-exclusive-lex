-- Test if webhook is working
-- Run this in Supabase SQL Editor

-- Check for any recent purchases (last 24 hours)
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

-- Check for any purchases for your user ID
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    amount_paid,
    status,
    created_at
FROM purchases 
WHERE user_id = 'c7197642-a5eb-4f90-8632-7eb50560adad'
ORDER BY created_at DESC
LIMIT 10;

-- Check if the webhook endpoint is being called
-- (This will show if any purchases were created via webhook)
SELECT 
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN stripe_session_id LIKE 'cs_%' THEN 1 END) as webhook_purchases,
    COUNT(CASE WHEN stripe_session_id NOT LIKE 'cs_%' THEN 1 END) as manual_purchases
FROM purchases 
WHERE created_at >= NOW() - INTERVAL '24 hours'; 