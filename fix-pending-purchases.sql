-- Fix pending purchases by marking them as completed
-- Run this in your Supabase SQL Editor

-- Update all pending purchases to completed status
UPDATE purchases 
SET 
  status = 'completed',
  is_active = true
WHERE 
  status = 'pending' 
  AND stripe_session_id IS NOT NULL;

-- Add unique constraint to prevent duplicate entries
ALTER TABLE purchases
ADD CONSTRAINT unique_user_collection_session
UNIQUE (user_id, collection_id, stripe_session_id);

-- Create trigger to automatically mark purchases as completed
CREATE OR REPLACE FUNCTION auto_complete_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_session_id IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'completed';
    NEW.is_active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_complete_purchase ON purchases;

CREATE TRIGGER trg_auto_complete_purchase
BEFORE INSERT OR UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION auto_complete_purchase();

-- Show the results
SELECT 
  COUNT(*) as total_purchases_updated,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_purchases,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as remaining_pending
FROM purchases 
WHERE stripe_session_id IS NOT NULL;

-- Show a sample of the updated purchases
SELECT 
  id,
  user_id,
  collection_id,
  stripe_session_id,
  status,
  is_active,
  amount_paid,
  created_at
FROM purchases 
WHERE status = 'completed' 
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10; 