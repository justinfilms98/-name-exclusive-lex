-- Fix pending purchases by marking them as completed
-- Run this in your Supabase SQL Editor

-- Update all pending purchases to completed status
UPDATE purchases 
SET 
  status = 'completed',
  is_active = true
WHERE 
  status = 'pending' 
  AND stripe_session_id IS NOT NULL;

-- Show the results
SELECT 
  COUNT(*) as total_purchases_updated,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_purchases,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as remaining_pending
FROM purchases 
WHERE stripe_session_id IS NOT NULL;

-- Show a sample of the updated purchases
SELECT 
  id,
  user_id,
  collection_id,
  stripe_session_id,
  status,
  is_active,
  amount_paid,
  created_at
FROM purchases 
WHERE status = 'completed' 
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10; 