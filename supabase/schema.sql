-- Supabase schema for paywalled video template

-- Users table (optional, if not using Supabase Auth)
-- CREATE TABLE users (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   email text UNIQUE NOT NULL
-- );

-- Videos table
CREATE TABLE IF NOT EXISTS "CollectionVideo" (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  videoUrl text NOT NULL,
  thumbnail text,
  price float,
  duration int,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now()
);

-- Purchase tokens table
CREATE TABLE IF NOT EXISTS purchase_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  video_id int NOT NULL REFERENCES "CollectionVideo"(id),
  token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Example: create a storage bucket called 'videos' in Supabase Storage
-- (do this in the Supabase dashboard) 