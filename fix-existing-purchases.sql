-- Fix existing purchases for user 6650dc44-266a-4cf6-b2ca-7f77a1643967
-- Run this in Supabase SQL Editor

-- First, let's see what purchases exist for this collection
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    status,
    is_active,
    created_at
FROM purchases 
WHERE collection_id = 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a'
AND is_active = true;

-- Now fix the purchase record by correcting the user_id and collection_id
UPDATE purchases 
SET 
    user_id = '6650dc44-266a-4cf6-b2ca-7f77a1643967',
    collection_id = 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a'
WHERE collection_id = '6650dc44-266a-4cf6-b2ca-7f77a1643967'
AND user_id = 'f469ed29-e368-4af9-9cd3-3755c01b045d'
AND is_active = true;

-- Also check for any purchases where the collection_id is stored in stripe_session_id
UPDATE purchases 
SET 
    user_id = '6650dc44-266a-4cf6-b2ca-7f77a1643967',
    collection_id = 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a'
WHERE stripe_session_id = 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a'
AND user_id != '6650dc44-266a-4cf6-b2ca-7f77a1643967'
AND is_active = true;

-- Verify the update worked
SELECT 
    id,
    user_id,
    collection_id,
    stripe_session_id,
    status,
    is_active,
    created_at
FROM purchases 
WHERE collection_id = 'aa9ddaf3-fe57-4973-9950-87b63bc4f57a'
AND user_id = '6650dc44-266a-4cf6-b2ca-7f77a1643967'
AND is_active = true; 