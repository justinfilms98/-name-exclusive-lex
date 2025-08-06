-- Fix current purchases with correct collection IDs
-- Run this in Supabase SQL Editor

-- Step 1: See what collections exist
SELECT id, title, price FROM collections ORDER BY title;

-- Step 2: See what purchases already exist for this session
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    amount_paid,
    status,
    created_at
FROM purchases 
WHERE stripe_session_id = 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2'
ORDER BY created_at DESC;

-- Step 3: Create the missing purchases (replace collection IDs with actual ones from Step 1)
-- Only run this after you've identified the correct collection IDs from Step 1

-- Example (replace with actual collection IDs):
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
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'ACTUAL_COLLECTION_ID_1', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'ACTUAL_COLLECTION_ID_2', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
--   ('c7197642-a5eb-4f90-8632-7eb50560adad', 'ACTUAL_COLLECTION_ID_3', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW());

-- Step 4: Verify the purchases were created
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