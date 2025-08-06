-- Complete Final Cleanup - Remove ALL legacy policies
-- This script ensures all old/duplicate policies are removed

-- Step 1: Drop the legacy policy (with proper error handling)
DO $$
BEGIN
    -- Try to drop the legacy policy
    EXECUTE 'DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects';
    
    -- Log the action
    RAISE NOTICE 'Legacy policy "Allow purchasers to access media Ips738_0" dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping legacy policy: %', SQLERRM;
END $$;

-- Step 2: Verify the final clean state
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname; 