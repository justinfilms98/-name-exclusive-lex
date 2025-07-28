-- Extend all test purchases to be active for testing
-- This is for development/testing purposes only

-- First, let's see the current state of purchases
SELECT 
  id,
  user_id,
  collection_id,
  created_at,
  expires_at,
  is_active,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN expires_at > NOW() THEN 'ACTIVE'
    ELSE 'UNKNOWN'
  END as status
FROM purchases 
ORDER BY created_at DESC;

-- Extend all purchases to expire 30 minutes from now
UPDATE purchases 
SET expires_at = (NOW() + INTERVAL '30 minutes')::timestamp with time zone;

-- Ensure all purchases are active
UPDATE purchases SET is_active = true;
UPDATE purchases SET deactivated_at = NULL;

-- Verify the changes
SELECT 
  id,
  user_id,
  collection_id,
  created_at,
  expires_at,
  is_active,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN expires_at > NOW() THEN 'ACTIVE'
    ELSE 'UNKNOWN'
  END as status
FROM purchases 
ORDER BY created_at DESC; 