-- ============================================================
-- BudgetPilot — 4-tier role system + RLS policies
-- Roles: 'user' | 'it' | 'admin' | 'superadmin'
-- Run this in Supabase SQL Editor (idempotent — safe to re-run).
-- ============================================================

-- ─── Lock down which roles are allowed ───────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user','it','admin','superadmin'));
  end if;
end$$;

-- ─── Role helper functions (security definer = bypass RLS) ──
create or replace function public.is_superadmin()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select role = 'superadmin' from public.profiles where id = auth.uid()),
    false
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select role in ('admin','superadmin') from public.profiles where id = auth.uid()),
    false
  )
$$;

create or replace function public.is_admin_or_it()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select role in ('it','admin','superadmin') from public.profiles where id = auth.uid()),
    false
  )
$$;

grant execute on function public.is_superadmin()  to authenticated, anon;
grant execute on function public.is_admin()       to authenticated, anon;
grant execute on function public.is_admin_or_it() to authenticated, anon;

-- ─── RLS policies ────────────────────────────────────────────
-- IT: read-only across the platform
-- Admin/Superadmin: full read+write across the platform
do $$
declare t text;
begin
  foreach t in array array['profiles','accounts','transactions','goals','people','payments','budgets']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all',  t);
    execute format('drop policy if exists %I on public.%I', t || '_it_read',    t);

    execute format(
      'create policy %I on public.%I for select using (public.is_admin_or_it())',
      t || '_it_read', t
    );

    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end$$;

-- ─── Promote known owner ─────────────────────────────────────
update public.profiles
  set role = 'superadmin'
  where lower(email) = 'stevewambugu31@gmail.com';

-- Show recent profiles to confirm
select email, full_name, role, created_at
  from public.profiles
  order by created_at desc
  limit 5;
