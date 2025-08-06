-- Fix recent failed purchases
-- Run this in Supabase SQL Editor

-- First, let's see what collections you have
SELECT id, title, price FROM collections ORDER BY title;

-- Now let's manually create the missing purchases for the recent failed session
-- Replace the collection IDs below with the actual ones you purchased

-- For the session: cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2
-- User ID: c7197642-a5eb-4f90-8632-7eb50560adad

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
  -- Replace these collection IDs with the actual ones you purchased
  ('c7197642-a5eb-4f90-8632-7eb50560adad', '200bea64-99da-49ef-8566-5d6cfde10d4c', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'c5b9558a-5884-4d83-8b81-3619782cf6fa', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW());

-- Verify the purchases were created
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