-- Fix database schema to match the working state
-- This ensures all necessary columns exist and are properly configured

-- Add is_active and deactivated_at columns if they don't exist
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Create index for active purchases if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_purchases_user_active ON purchases(user_id, is_active);

-- Update all existing purchases to be active
UPDATE purchases SET is_active = true WHERE is_active IS NULL;

-- Ensure expires_at is NOT NULL and has proper values
ALTER TABLE purchases ALTER COLUMN expires_at SET NOT NULL;

-- Update any purchases with NULL expires_at to expire in 30 minutes from now
UPDATE purchases 
SET expires_at = (NOW() + INTERVAL '30 minutes')::timestamp with time zone
WHERE expires_at IS NULL;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position; 