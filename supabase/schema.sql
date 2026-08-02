-- ============================================================
-- BudgetPilot — Supabase schema
-- Paste this entire file into your Supabase project's SQL Editor
-- and click "Run". Safe to re-run.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user','admin')),
  currency text default 'USD',
  workspace_name text default 'My Finances',
  monthly_income_target numeric default 0,
  monthly_expense_limit numeric default 0,
  created_at timestamptz default now()
);

-- ---------- ACCOUNTS ----------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text default 'bank',
  balance numeric default 0,
  color text default '#3b82f6',
  created_at timestamptz default now()
);
create index if not exists accounts_user_idx on public.accounts(user_id);

-- ---------- TRANSACTIONS ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric not null,
  category text,
  account_id uuid references public.accounts on delete set null,
  person_id uuid,
  transfer_id uuid,
  date date default current_date,
  note text,
  created_at timestamptz default now()
);
create index if not exists tx_user_idx on public.transactions(user_id);
create index if not exists tx_date_idx on public.transactions(date desc);

-- ---------- GOALS ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  target numeric default 0,
  saved numeric default 0,
  deadline date,
  category text default '🎯',
  note text,
  created_at timestamptz default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

-- ---------- PEOPLE ----------
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  role text,
  monthly_pay numeric default 0,
  hire_date date,
  phone text,
  note text,
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists people_user_idx on public.people(user_id);

-- ---------- PAYMENTS ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  person_id uuid references public.people on delete cascade,
  account_id uuid references public.accounts on delete set null,
  amount numeric not null,
  date date default current_date,
  note text,
  created_at timestamptz default now()
);
create index if not exists payments_user_idx on public.payments(user_id);

-- ---------- BUDGETS (per category) ----------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz default now(),
  unique(user_id, category)
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  -- Auto-promote known owner email(s) to admin on signup
  assigned_role := case
    when lower(new.email) in ('stevewambugu31@gmail.com') then 'admin'
    else 'user'
  end;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), assigned_role);

  -- Seed 4 starter accounts in USD
  insert into public.accounts (user_id, name, type, color) values
    (new.id, 'Checking',    'bank',    '#3b82f6'),
    (new.id, 'Savings',     'savings', '#10b981'),
    (new.id, 'Credit Card', 'credit',  '#ef4444'),
    (new.id, 'Cash',        'cash',    '#f59e0b');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;
alter table public.goals        enable row level security;
alter table public.people       enable row level security;
alter table public.payments     enable row level security;
alter table public.budgets      enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Profiles: user reads/updates own; admin reads/updates all
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert
  with check (auth.uid() = id);

-- Generic per-user policy generator: 6 tables × 4 ops
do $$
declare t text;
begin
  foreach t in array array['accounts','transactions','goals','people','payments','budgets'] loop
    execute format('drop policy if exists "%I_all" on public.%I', t, t);
    execute format(
      'create policy "%I_all" on public.%I for all '
      'using (auth.uid() = user_id or public.is_admin()) '
      'with check (auth.uid() = user_id or public.is_admin())',
      t, t
    );
  end loop;
end$$;

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  perform pg_catalog.set_config('search_path', 'public, extensions', false);
  -- Enable realtime publication for our tables (idempotent-ish)
  begin
    alter publication supabase_realtime add table public.accounts;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.transactions;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.goals;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.people;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.payments;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.budgets;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null; end;
end$$;

-- ============================================================
-- ROLE SYSTEM + RLS POLICIES
-- Roles: 'user' | 'it' | 'admin' | 'superadmin'
--   user        – sees own data
--   it          – read-only across platform
--   admin       – full read+write across platform
--   superadmin  – everything + can change anyone's role
-- ============================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user','it','admin','superadmin'));

create or replace function public.is_superadmin()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce((select role = 'superadmin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce((select role in ('admin','superadmin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin_or_it()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce((select role in ('it','admin','superadmin') from public.profiles where id = auth.uid()), false)
$$;

grant execute on function public.is_superadmin()  to authenticated, anon;
grant execute on function public.is_admin()       to authenticated, anon;
grant execute on function public.is_admin_or_it() to authenticated, anon;

do $$
declare t text;
begin
  foreach t in array array['profiles','accounts','transactions','goals','people','payments','budgets']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_it_read',   t);
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

-- ============================================================
-- PROMOTE OWNER (idempotent — if profile already exists)
-- ============================================================
update public.profiles
  set role = 'superadmin'
  where lower(email) = 'stevewambugu31@gmail.com';

-- ============================================================
-- DONE.
--   1. Run this whole file once in your Supabase SQL Editor.
--   2. Sign up at http://localhost:5174 with stevewambugu31@gmail.com
--      → you'll automatically be an admin.
--   3. To make someone else admin later:
--        update public.profiles set role='admin' where email='them@example.com';
-- ============================================================
