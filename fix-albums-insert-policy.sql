-- Fix albums table RLS policies to allow admin inserts
-- Run this in Supabase SQL Editor if you want to use RLS instead of service role

-- Add INSERT policy for authenticated admin users
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        -- Drop existing INSERT policy if it exists
        DROP POLICY IF EXISTS "albums_insert_admin" ON "albums";
        
        -- Allow admin users to insert albums
        -- This checks if the user's email matches the admin email
        CREATE POLICY "albums_insert_admin" ON "albums"
            FOR INSERT 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.email = 'contact.exclusivelex@gmail.com'
                )
            );
    END IF;
END $$;

-- Also add UPDATE and DELETE policies for completeness
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "albums_update_admin" ON "albums";
        DROP POLICY IF EXISTS "albums_delete_admin" ON "albums";
        
        -- Allow admin users to update albums
        CREATE POLICY "albums_update_admin" ON "albums"
            FOR UPDATE 
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.email = 'contact.exclusivelex@gmail.com'
                )
            );
        
        -- Allow admin users to delete albums
        CREATE POLICY "albums_delete_admin" ON "albums"
            FOR DELETE 
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.email = 'contact.exclusivelex@gmail.com'
                )
            );
    END IF;
END $$;

