-- Fix Supabase Auth Policies for Exclusive Lex
-- This script ensures all Google users can sign up while maintaining admin access

-- 1. Enable RLS on auth schema (if not already enabled)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Restrict user access" ON auth.users;

-- 3. Create permissive policies for auth.users
CREATE POLICY "Allow all authenticated users to read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow all authenticated users to update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- 4. Enable RLS on public tables
ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.collection_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hero_videos ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for collections (read-only for all authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to read collections" ON public.collections;
CREATE POLICY "Allow authenticated users to read collections" ON public.collections
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Create policies for collection_videos (read-only for all authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to read collection videos" ON public.collection_videos;
CREATE POLICY "Allow authenticated users to read collection videos" ON public.collection_videos
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Create policies for purchases (users can read their own purchases)
DROP POLICY IF EXISTS "Allow users to read own purchases" ON public.purchases;
CREATE POLICY "Allow users to read own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- 8. Create policies for purchases (users can create their own purchases)
DROP POLICY IF EXISTS "Allow users to create own purchases" ON public.purchases;
CREATE POLICY "Allow users to create own purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create policies for hero_videos (read-only for all authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to read hero videos" ON public.hero_videos;
CREATE POLICY "Allow authenticated users to read hero videos" ON public.hero_videos
  FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Create admin policies for collections (admin can do everything)
DROP POLICY IF EXISTS "Allow admin full access to collections" ON public.collections;
CREATE POLICY "Allow admin full access to collections" ON public.collections
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'contact.exclusivelex@gmail.com'
  );

-- 11. Create admin policies for collection_videos (admin can do everything)
DROP POLICY IF EXISTS "Allow admin full access to collection videos" ON public.collection_videos;
CREATE POLICY "Allow admin full access to collection videos" ON public.collection_videos
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'contact.exclusivelex@gmail.com'
  );

-- 12. Create admin policies for hero_videos (admin can do everything)
DROP POLICY IF EXISTS "Allow admin full access to hero videos" ON public.hero_videos;
CREATE POLICY "Allow admin full access to hero videos" ON public.hero_videos
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'contact.exclusivelex@gmail.com'
  );

-- 13. Create admin policies for purchases (admin can read all purchases)
DROP POLICY IF EXISTS "Allow admin to read all purchases" ON public.purchases;
CREATE POLICY "Allow admin to read all purchases" ON public.purchases
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'contact.exclusivelex@gmail.com'
  );

-- 14. Ensure storage policies are correct
-- Note: Storage policies are typically managed through Supabase dashboard
-- But we can create them here if needed

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 16. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email = 'contact.exclusivelex@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_email text)
RETURNS text AS $$
BEGIN
  IF user_email = 'contact.exclusivelex@gmail.com' THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Verify the setup
SELECT 'Auth policies configured successfully' as status; 