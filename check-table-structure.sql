-- Check if the table exists and what its structure is
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%purchase%';

-- If the table exists, show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'purchases'
ORDER BY ordinal_position; 