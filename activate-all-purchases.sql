-- Activate all existing purchases and ensure they work properly

-- Set all purchases to active
UPDATE purchases SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- Set deactivated_at to NULL for all purchases
UPDATE purchases SET deactivated_at = NULL;

-- Ensure all purchases have proper expiration dates (30 minutes from now if NULL)
UPDATE purchases 
SET expires_at = (NOW() + INTERVAL '30 minutes')::timestamp with time zone
WHERE expires_at IS NULL;

-- Verify the changes
SELECT 
  id, 
  user_id, 
  collection_id, 
  is_active,
  expires_at,
  created_at
FROM purchases 
ORDER BY created_at DESC 
LIMIT 10; 