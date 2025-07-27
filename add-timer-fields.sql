-- Add timer tracking fields to purchases table
ALTER TABLE purchases 
ADD COLUMN timer_started BOOLEAN DEFAULT false,
ADD COLUMN timer_started_at TIMESTAMP WITH TIME ZONE;

-- Create index for timer queries
CREATE INDEX idx_purchases_timer_started ON purchases(timer_started, timer_started_at); 