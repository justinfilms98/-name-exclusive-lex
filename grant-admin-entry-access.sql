-- Grant entry_access to a specific admin user
-- Replace 'USER_ID_HERE' with the actual UUID of the admin user from auth.users
-- Run this in Supabase SQL Editor

-- Example: Grant active entry access to a specific user
INSERT INTO entry_access (user_id, email, status, created_at, updated_at)
VALUES (
  'USER_ID_HERE'::uuid,  -- Replace with actual user UUID
  'admin@example.com',   -- Replace with admin email
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  updated_at = NOW();

-- To find a user's UUID, you can query:
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
