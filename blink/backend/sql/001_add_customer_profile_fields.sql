-- Migration: add profile fields to customers
alter table if exists public.customers
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists marketing_opt_in boolean default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists last_login_at timestamptz null,
  add column if not exists metadata jsonb default '{}'::jsonb;

-- index for fast lookups by email
create index if not exists idx_customers_email on public.customers(email);
