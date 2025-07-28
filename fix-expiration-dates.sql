-- Fix expiration dates to match collection duration settings
-- This restores the proper expiration logic based on each collection's duration

-- First, let's see what collections and their durations we have
SELECT 
  id, 
  title, 
  duration,
  CASE 
    WHEN duration IS NULL THEN 'No duration set'
    ELSE duration || ' seconds (' || ROUND(duration/60.0, 1) || ' minutes)'
  END as duration_formatted
FROM collections 
ORDER BY created_at DESC;

-- Now fix the purchases table to use proper expiration based on collection duration
-- For each purchase, calculate the correct expiration based on the collection's duration
UPDATE purchases 
SET expires_at = (
  created_at + (INTERVAL '1 second' * COALESCE(
    (SELECT duration FROM collections WHERE id = purchases.collection_id), 
    1800  -- Default to 30 minutes if no duration found
  ))
)
WHERE expires_at > (NOW() + INTERVAL '1 day'); -- Only fix purchases that were incorrectly set to 1 year

-- Also fix any purchases that have NULL expiration
UPDATE purchases 
SET expires_at = (
  created_at + (INTERVAL '1 second' * COALESCE(
    (SELECT duration FROM collections WHERE id = purchases.collection_id), 
    1800  -- Default to 30 minutes if no duration found
  ))
)
WHERE expires_at IS NULL;

-- Verify the changes
SELECT 
  p.id,
  p.user_id,
  c.title as collection_title,
  c.duration as collection_duration_seconds,
  ROUND(c.duration/60.0, 1) as collection_duration_minutes,
  p.created_at,
  p.expires_at,
  EXTRACT(EPOCH FROM (p.expires_at - p.created_at))/60 as actual_duration_minutes,
  CASE 
    WHEN p.expires_at > NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM purchases p
LEFT JOIN collections c ON p.collection_id = c.id
ORDER BY p.created_at DESC 
LIMIT 10; 