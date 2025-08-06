-- Final cleanup - Remove the last legacy policy
-- This removes the old "Allow purchasers to access media Ips738_0" policy

-- Step 1: Drop the legacy policy
DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects;

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