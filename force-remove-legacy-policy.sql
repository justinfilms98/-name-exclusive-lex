-- Force Remove Legacy Policy - Multiple Approaches
-- This script uses different methods to ensure the legacy policy is removed

-- Step 1: Try direct drop with exact name
DROP POLICY IF EXISTS "Allow purchasers to access media Ips738_0" ON storage.objects;

-- Step 2: Try with single quotes if double quotes don't work
DROP POLICY IF EXISTS 'Allow purchasers to access media Ips738_0' ON storage.objects;

-- Step 3: Try dropping by pattern (if the exact name doesn't work)
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Find policies that match the pattern
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

-- Step 4: Verify the final clean state
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