-- Manual purchase fix for failed webhook processing
-- Run this in Supabase SQL Editor

-- First, let's see what sessions we have
SELECT DISTINCT stripe_session_id, created_at 
FROM purchases 
WHERE stripe_session_id LIKE 'cs_%'
ORDER BY created_at DESC
LIMIT 10;

-- Now let's check for any recent sessions that might be missing
-- This will help identify which sessions need manual processing

-- Example: If you have a specific session ID that failed, you can manually create the purchase
-- Replace the values below with your actual session data

-- INSERT INTO purchases (
--   user_id,
--   collection_id, 
--   stripe_session_id,
--   amount_paid,
--   currency,
--   status,
--   is_active,
--   created_at
-- ) VALUES (
--   'c7197642-a5eb-4f90-8632-7eb50560adad', -- Replace with actual user_id
--   'your-collection-id', -- Replace with actual collection_id
--   'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', -- Replace with actual session_id
--   1.00, -- Replace with actual amount in dollars
--   'usd',
--   'completed',
--   true,
--   NOW()
-- ); 