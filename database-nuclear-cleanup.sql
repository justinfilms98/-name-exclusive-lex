-- 🚨 NUCLEAR CLEANUP v2 - More Aggressive
-- This will find and destroy ALL tables, not just the ones we expect

-- First, disable all triggers to prevent conflicts
SET session_replication_role = replica;

-- Drop ALL custom tables in the public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Get all tables in public schema (excluding system tables)
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    ) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- Drop ALL custom functions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE pg_namespace.nspname = 'public'
        AND proname NOT LIKE 'pg_%'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
        RAISE NOTICE 'Dropped function: %', r.proname;
    END LOOP;
END $$;

-- Drop ALL storage policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'storage'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.' || quote_ident(r.tablename);
        RAISE NOTICE 'Dropped storage policy: % on %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- Clean storage buckets
DELETE FROM storage.buckets WHERE id != 'avatars'; -- Keep avatars bucket (system default)

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Drop any remaining sequences
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequencename;
    END LOOP;
END $$;

RAISE NOTICE '🚨 NUCLEAR CLEANUP COMPLETE - Everything destroyed!'; 