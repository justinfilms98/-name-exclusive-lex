-- Corrected Legacy Policy Removal
-- This script properly removes the legacy policy without syntax errors

-- Step 1: Try direct drop with double quotes (this should work)
DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects;

-- Step 2: Use a DO block to handle the policy removal more robustly
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Find policies that match the pattern and drop them
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname LIKE '%Allow purchasers to access media%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

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