-- Activate all existing purchases
-- Run this in your Supabase SQL Editor

-- Update all purchases to be active
UPDATE purchases 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Verify the changes
SELECT 
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_purchases,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_purchases
FROM purchases;

-- Show recent purchases
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    created_at,
    is_active,
    amount_paid
FROM purchases 
ORDER BY created_at DESC 
LIMIT 10; 