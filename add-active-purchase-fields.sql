-- Add fields to track active purchases and deactivation
ALTER TABLE purchases 
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on active purchases
CREATE INDEX idx_purchases_user_active ON purchases(user_id, is_active);

-- Update existing purchases to be active
UPDATE purchases SET is_active = true WHERE is_active IS NULL; 