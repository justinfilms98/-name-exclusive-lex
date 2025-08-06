-- Quick fix for current failed purchases
-- Run this in Supabase SQL Editor

-- First, let's see what collections exist
SELECT id, title, price FROM collections WHERE title LIKE '%test%' OR title LIKE '%Malibu%' ORDER BY title;

-- Now create the missing purchases for your recent session
-- Session: cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2
-- User: c7197642-a5eb-4f90-8632-7eb50560adad

-- You need to replace the collection IDs below with the actual ones you purchased
-- Run the SELECT above first to see the available collections

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
  -- Replace these with the actual collection IDs you purchased
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'REPLACE_WITH_ACTUAL_COLLECTION_ID_1', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'REPLACE_WITH_ACTUAL_COLLECTION_ID_2', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()),
  ('c7197642-a5eb-4f90-8632-7eb50560adad', 'REPLACE_WITH_ACTUAL_COLLECTION_ID_3', 'cs_live_b1mswf4CUsJudz9PThV8eWJ5ikTKysj5NXGUNWX37QnCLOa5x4uvrHXCx2', 1.00, 'usd', 'completed', true, NOW()); 