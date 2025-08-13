-- Fix broken/infinite-recursive policies on public.profiles that block other queries
-- Run this in Supabase SQL editor

-- 1) Drop ALL existing policies on public.profiles (names unknown)
do $$
declare p record;
begin
  for p in select polname from pg_policies where schemaname='public' and tablename='profiles' loop
    execute format('drop policy if exists %I on public.profiles', p.polname);
  end loop;
end $$;

-- 2) Enable RLS (idempotent) and recreate minimal non-recursive policies
alter table public.profiles enable row level security;

-- Allow anyone to SELECT basic profile rows (adjust if you need stricter privacy)
create policy profiles_read_all on public.profiles
  for select using (true);

-- Allow users to manage only their own profile row
create policy profiles_self_write on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


