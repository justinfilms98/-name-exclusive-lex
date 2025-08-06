-- Prevent future user_id/collection_id issues
-- Run this in Supabase SQL Editor

-- 1. Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_user_id_format_check;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_collection_id_format_check;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_user_collection_session_unique;

-- 2. Add check constraints to ensure user_id and collection_id are valid UUIDs
ALTER TABLE purchases 
ADD CONSTRAINT purchases_user_id_format_check 
CHECK (user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

ALTER TABLE purchases 
ADD CONSTRAINT purchases_collection_id_format_check 
CHECK (collection_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- 3. Add a trigger to validate data before insertion
CREATE OR REPLACE FUNCTION validate_purchase_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id and collection_id are not the same
  IF NEW.user_id = NEW.collection_id THEN
    RAISE EXCEPTION 'user_id and collection_id cannot be the same';
  END IF;
  
  -- Ensure user_id is not empty
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  -- Ensure collection_id is not empty
  IF NEW.collection_id IS NULL THEN
    RAISE EXCEPTION 'collection_id cannot be null';
  END IF;
  
  -- Ensure stripe_session_id is not empty
  IF NEW.stripe_session_id IS NULL OR NEW.stripe_session_id = '' THEN
    RAISE EXCEPTION 'stripe_session_id cannot be null or empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS validate_purchase_data_trigger ON purchases;
CREATE TRIGGER validate_purchase_data_trigger
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION validate_purchase_data();

-- 5. Add a unique constraint to prevent duplicate purchases
ALTER TABLE purchases 
ADD CONSTRAINT purchases_user_collection_session_unique 
UNIQUE (user_id, collection_id, stripe_session_id);

-- 6. Verify the constraints are in place
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'purchases' 
AND constraint_name IN (
    'purchases_user_id_format_check',
    'purchases_collection_id_format_check',
    'purchases_user_collection_session_unique'
); 