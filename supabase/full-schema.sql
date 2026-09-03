-- ============================================================
-- SheetNative — complete database schema
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Core domain tables
create table if not exists public.workbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  status text not null default 'migrated',
  analysis jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.entity_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  rule jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'general',
  amount numeric(14,2),
  status text not null default 'pending',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'Custom role',
  instructions text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'starter',
  interval text not null default 'monthly',
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

create index if not exists idx_entity_rows_user_entity on public.entity_rows (user_id, entity);
create index if not exists idx_workbooks_user on public.workbooks (user_id, created_at desc);

-- Row Level Security: every user only sees their own data
alter table public.workbooks enable row level security;
alter table public.entity_rows enable row level security;
alter table public.automations enable row level security;
alter table public.approvals enable row level security;
alter table public.ai_employees enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "workbooks_owner_all" on public.workbooks;
create policy "workbooks_owner_all" on public.workbooks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entity_rows_owner_all" on public.entity_rows;
create policy "entity_rows_owner_all" on public.entity_rows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "automations_owner_all" on public.automations;
create policy "automations_owner_all" on public.automations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "approvals_owner_all" on public.approvals;
create policy "approvals_owner_all" on public.approvals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_employees_owner_all" on public.ai_employees;
create policy "ai_employees_owner_all" on public.ai_employees for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read" on public.subscriptions for select using (auth.uid() = user_id);
