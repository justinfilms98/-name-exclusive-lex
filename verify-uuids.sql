-- Verify the exact UUIDs for the collections
SELECT id, title, price FROM collections 
WHERE title IN ('test 4', 'test 3', 'test') 
ORDER BY title;

-- Test if the UUIDs are valid by checking if they exist
SELECT id, title FROM collections 
WHERE id IN (
  'fb692d78-a978-441f-872c-a11e1532f5d4',
  'cc760c68-bce1-4be3-bb9b-7049469581d2',
  'aaddaf3-fe57-4973-9058-87b63bc4f57a'
); 