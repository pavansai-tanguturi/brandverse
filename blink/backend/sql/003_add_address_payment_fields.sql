-- Migration: add address and payment fields
alter table if exists public.customers
  add column if not exists shipping_address jsonb default null,
  add column if not exists billing_address jsonb default null;

alter table if exists public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text default null,
  add column if not exists shipping_address jsonb default null,
  add column if not exists billing_address jsonb default null,
  add column if not exists notes text default null;
