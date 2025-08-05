-- Create watch_logs table for activity logging
-- Run this in your Supabase SQL Editor

-- Create watch_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS watch_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT DEFAULT 'watch_start',
    ip_address TEXT,
    user_agent TEXT,
    session_duration INTEGER DEFAULT 0,
    video_progress INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_purchase_id ON watch_logs(purchase_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_created_at ON watch_logs(created_at);

-- Enable RLS
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can create their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;

-- Users can view their own watch logs
CREATE POLICY "Users can view their own watch logs" ON watch_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own watch logs
CREATE POLICY "Users can create their own watch logs" ON watch_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all watch logs
CREATE POLICY "Admins can view all watch logs" ON watch_logs
    FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Grant necessary permissions
GRANT SELECT, INSERT ON watch_logs TO authenticated;
GRANT SELECT ON watch_logs TO anon;

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'watch_logs' 
ORDER BY ordinal_position; 