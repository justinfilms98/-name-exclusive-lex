-- Fix watch_logs table for activity logging
-- Run this in your Supabase SQL Editor

-- Check if watch_logs table exists and create it if it doesn't
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'watch_logs') THEN
        CREATE TABLE watch_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
            purchase_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            event_type TEXT DEFAULT 'watch_start',
            ip_address TEXT,
            user_agent TEXT,
            session_duration INTEGER DEFAULT 0,
            video_progress INTEGER DEFAULT 0
        );
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add purchase_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'purchase_id') THEN
        ALTER TABLE watch_logs ADD COLUMN purchase_id UUID;
    END IF;
    
    -- Add event_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'event_type') THEN
        ALTER TABLE watch_logs ADD COLUMN event_type TEXT DEFAULT 'watch_start';
    END IF;
    
    -- Add ip_address column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'ip_address') THEN
        ALTER TABLE watch_logs ADD COLUMN ip_address TEXT;
    END IF;
    
    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE watch_logs ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Add session_duration column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'session_duration') THEN
        ALTER TABLE watch_logs ADD COLUMN session_duration INTEGER DEFAULT 0;
    END IF;
    
    -- Add video_progress column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'watch_logs' AND column_name = 'video_progress') THEN
        ALTER TABLE watch_logs ADD COLUMN video_progress INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_created_at ON watch_logs(created_at);

-- Enable RLS if not already enabled
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can create their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;

-- Create RLS policies
CREATE POLICY "Users can view their own watch logs" ON watch_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watch logs" ON watch_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all watch logs" ON watch_logs
    FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Grant necessary permissions
GRANT SELECT, INSERT ON watch_logs TO authenticated;
GRANT SELECT ON watch_logs TO anon;

-- Verify the table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'watch_logs' 
ORDER BY ordinal_position; 