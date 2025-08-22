-- Enable extensions
create extension if not exists pgcrypto;

-- CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'INR',
  category_id uuid references public.categories(id) on delete set null,
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_category on public.products(category_id);

-- PRODUCT IMAGES (path stored in Supabase Storage)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  path text not null,
  is_primary boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_product_images_product on public.product_images(product_id);

-- CUSTOMERS (link to Supabase Auth user id)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- CARTS
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'pending',
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  shipping_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'INR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  title text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  total_cents integer not null,
  created_at timestamptz default now()
);

-- EVENTS (optional analytics)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  customer_id uuid,
  product_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Session table for connect-pg-simple
create table if not exists public."session" (
  sid varchar not null collate "default",
  sess json not null,
  expire timestamp(6) not null
);
alter table public."session" add constraint "session_pkey" primary key ("sid");
create index if not exists "IDX_session_expire" on public."session" ("expire");

-- updated_at triggers
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
for each row execute procedure set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute procedure set_updated_at();