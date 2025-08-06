-- Fix missing purchases for recent failed sessions
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    amount_paid,
    status,
    created_at
FROM purchases 
WHERE stripe_session_id LIKE 'cs_%'
ORDER BY created_at DESC
LIMIT 5;

-- Now let's manually create the missing purchases
-- Replace the values below with your actual data from the failed sessions

-- Example for the recent failed session:
-- INSERT INTO purchases (
--   user_id,
--   collection_id, 
--   stripe_session_id,
--   amount_paid,
--   currency,
--   status,
--   is_active,
--   created_at
-- ) VALUES 
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'collection-id-1', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'collection-id-2', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'collection-id-3', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW());

-- After running the INSERT, verify the purchases were created:
-- SELECT 
--     id,
--     user_id,
--     collection_id,
--     stripe_session_id,
--     amount_paid,
--     status,
--     created_at
-- FROM purchases 
-- WHERE stripe_session_id = 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2'
-- ORDER BY created_at DESC; 