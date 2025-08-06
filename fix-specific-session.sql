-- Fix specific session: cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8
-- User: c7197642-a5eb-4f90-8632-7eb50560adad

-- First, check if purchases already exist for this session
SELECT id, user_id, collection_id, stripe_session_id, amount_paid, status, created_at 
FROM purchases 
WHERE stripe_session_id = 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8';

-- Find the collection IDs for the 3 items that were purchased: "test 4", "test 3", "test"
SELECT id, title, price FROM collections 
WHERE title IN ('test 4', 'test 3', 'test') 
ORDER BY title;

-- Check recent purchases for this user to understand what they might have purchased
SELECT id, user_id, collection_id, stripe_session_id, amount_paid, status, created_at 
FROM purchases 
WHERE user_id = 'c7197642-a5eb-4f90-8632-7eb50560adad' 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create the 3 missing purchases for this session using dynamic queries
-- This approach will automatically find the correct UUIDs

INSERT INTO purchases (
  user_id,
  collection_id, 
  stripe_session_id,
  amount_paid,
  currency,
  status,
  is_active,
  created_at
)
SELECT 
  'c7197642-a5eb-4f90-8632-7eb50560adad' as user_id,
  c.id as collection_id,
  'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8' as stripe_session_id,
  1.00 as amount_paid,
  'usd' as currency,
  'completed' as status,
  true as is_active,
  NOW() as created_at
FROM collections c
WHERE c.title IN ('test 4', 'test 3', 'test')
AND NOT EXISTS (
  SELECT 1 FROM purchases p 
  WHERE p.user_id = 'c7197642-a5eb-4f90-8632-7eb50560adad' 
  AND p.collection_id = c.id 
  AND p.stripe_session_id = 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8'
);

-- After creating the purchases, verify they exist:
SELECT id, user_id, collection_id, stripe_session_id, amount_paid, status, created_at 
FROM purchases 
WHERE stripe_session_id = 'cs_live_b1MHE4DDCtYgvhUaJ0CRkViSwACNM7bD1FztGwrmeQIapkEjk1HsGWiP8'; 