-- Migration: add discount field to products
alter table if exists public.products
  add column if not exists discount_percent numeric(5,2) default 0 check (discount_percent >= 0 and discount_percent <= 100);

-- Add some default categories if they don't exist
insert into public.categories (name, slug) values 
  ('Electronics', 'electronics'),
  ('Clothing', 'clothing'),
  ('Books', 'books'),
  ('Home & Garden', 'home-garden'),
  ('Sports', 'sports'),
  ('Beauty', 'beauty'),
  ('Food & Beverage', 'food-beverage'),
  ('Toys & Games', 'toys-games')
on conflict (slug) do nothing;
