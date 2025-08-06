-- Quick fix for current failed purchases
-- Run this in Supabase SQL Editor

-- First, let's see what purchases exist for the failing session
SELECT id, user_id, collection_id, stripe_session_id, amount_paid, status, created_at 
FROM purchases 
WHERE stripe_session_id = 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8';

-- Check what collections exist
SELECT id, title, price FROM collections ORDER BY title;

-- Check if there are any existing purchases for this user in the last hour
SELECT id, user_id, collection_id, stripe_session_id, amount_paid, status, created_at 
FROM purchases 
WHERE user_id = 'c7197642-a5eb-4f90-8632-7eb50560adad' 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- If no purchases exist for the session, we need to create them
-- This is a fallback for purchases made before the webhook fix

-- Based on the session ID and user, let's create the missing purchases
-- You'll need to replace the collection IDs with the actual ones that were purchased

-- First, let's check what collections this user might have purchased
-- (This is a manual step - you need to know which collections were in the cart)

-- Example: If you purchased specific collections, uncomment and modify the INSERT below
-- Replace the collection IDs with the actual ones you purchased

/*
INSERT INTO purchases (
  user_id,
  collection_id, 
  stripe_session_id,
  amount_paid,
  currency,
  status,
  is_active,
  created_at
) VALUES 
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'REPLACE_WITH_ACTUAL_COLLECTION_ID_1', 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8', 1.00, 'usd', 'completed', true, NOW()),
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'REPLACE_WITH_ACTUAL_COLLECTION_ID_2', 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8', 1.00, 'usd', 'completed', true, NOW());
*/

-- Alternative: If you want to create a purchase for a specific collection, uncomment and modify:
/*
INSERT INTO purchases (
  user_id,
  collection_id, 
  stripe_session_id,
  amount_paid,
  currency,
  status,
  is_active,
  created_at
) VALUES 
  ('c7197642-a5eb-4f90-8632-7eb50560adad', '6650dc44-266a-4cf6-b2ca-7f77a1643967', 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8', 1.00, 'usd', 'completed', true, NOW());
*/ 