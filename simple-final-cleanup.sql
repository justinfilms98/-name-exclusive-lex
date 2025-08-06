-- Simple Final Cleanup - Remove the legacy policy
-- This script removes the last remaining legacy policy

-- Step 1: Drop the legacy policy (direct approach)
DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects;

-- Step 2: Alternative approach if the above doesn't work
-- Try dropping with different quoting if needed
-- DROP POLICY IF EXISTS 'Allow purchasers to access media Ips738_0' ON storage.objects;

-- Step 3: Verify the final clean state
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