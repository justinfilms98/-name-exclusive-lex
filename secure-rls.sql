-- Supabase Security Advisor: enable RLS and add safe policies
-- Run this entire file in Supabase SQL Editor (on your project DB)

-- Helper: enable RLS if table exists
create or replace function public._enable_rls_if_exists(tbl regclass) returns void as $$
begin
  execute format('alter table %s enable row level security', tbl);
exception when undefined_table then
  -- ignore
  null;
end; $$ language plpgsql security definer;

-- 1) profiles: users can read/update their own row; inserts guarded to self
do $$ begin
  if to_regclass('public.profiles') is not null then
    perform public._enable_rls_if_exists('public.profiles');

    -- drop existing policies to avoid duplicates
    drop policy if exists profiles_select_self on public.profiles;
    drop policy if exists profiles_update_self on public.profiles;
    drop policy if exists profiles_insert_self on public.profiles;

    create policy profiles_select_self on public.profiles
      for select using (auth.uid() = id);

    create policy profiles_update_self on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);

    create policy profiles_insert_self on public.profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

-- 2) collections: allow read to everyone; writes restricted (no policies)
do $$ begin
  if to_regclass('public.collections') is not null then
    perform public._enable_rls_if_exists('public.collections');
    drop policy if exists collections_read_all on public.collections;
    create policy collections_read_all on public.collections
      for select using (true);
  end if;
end $$;

-- 3) collection_videos (legacy): deny public access by default
do $$ begin
  if to_regclass('public.collection_videos') is not null then
    perform public._enable_rls_if_exists('public.collection_videos');
    -- Ensure no public access
    drop policy if exists collection_videos_no_access on public.collection_videos;
    create policy collection_videos_no_access on public.collection_videos
      for all using (false) with check (false);
  end if;
end $$;

-- 4) security_logs: service role only; revoke public privileges and enable RLS
do $$ begin
  if to_regclass('public.security_logs') is not null then
    perform public._enable_rls_if_exists('public.security_logs');
    revoke all on table public.security_logs from anon, authenticated;
    drop policy if exists security_logs_block_all on public.security_logs;
    create policy security_logs_block_all on public.security_logs
      for all using (false) with check (false);
  end if;
end $$;

-- 5) purchases: typical per-user read; writes via server only
do $$ begin
  if to_regclass('public.purchases') is not null then
    perform public._enable_rls_if_exists('public.purchases');
    drop policy if exists purchases_select_self on public.purchases;
    create policy purchases_select_self on public.purchases
      for select using (auth.uid() = user_id);
    -- No insert/update/delete policies: handled via service role only
  end if;
end $$;

-- Cleanup helper
drop function if exists public._enable_rls_if_exists(regclass);


