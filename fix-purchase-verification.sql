-- Fix purchase verification for multiple collections
-- This script adds the necessary unique constraint and trigger for proper multi-collection purchase handling

-- 1. Add unique constraint to prevent duplicate purchases
ALTER TABLE purchases 
ADD CONSTRAINT unique_user_collection_session 
UNIQUE (user_id, collection_id, stripe_session_id);

-- 2. Create function to auto-complete purchases
CREATE OR REPLACE FUNCTION auto_complete_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- If stripe_session_id is not null and status is pending, mark as completed
  IF NEW.stripe_session_id IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'completed';
    NEW.is_active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-complete purchases
DROP TRIGGER IF EXISTS trg_auto_complete_purchase ON purchases;
CREATE TRIGGER trg_auto_complete_purchase
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_purchase();

-- 4. Update any existing pending purchases to completed
UPDATE purchases 
SET status = 'completed', is_active = true 
WHERE stripe_session_id IS NOT NULL AND status = 'pending';

-- 5. Verify the changes
SELECT 
  COUNT(*) as total_purchases,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_purchases,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_purchases
FROM purchases; 