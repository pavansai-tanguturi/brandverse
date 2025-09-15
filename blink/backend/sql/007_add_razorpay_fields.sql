-- Migration: Add Razorpay and COD payment fields to orders table
alter table if exists public.orders
  add column if not exists razorpay_order_id text default null,
  add column if not exists razorpay_payment_id text default null,
  add column if not exists confirmed_at timestamptz default null,
  add column if not exists failure_reason text default null,
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_method text default null,
  add column if not exists shipping_address jsonb default null,
  add column if not exists billing_address jsonb default null;

-- Add index for faster lookups
create index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);

-- Function to reduce product stock
create or replace function reduce_product_stock(product_id uuid, quantity_to_reduce integer)
returns void
language plpgsql
as $$
begin
  update public.products 
  set stock_quantity = stock_quantity - quantity_to_reduce,
      updated_at = now()
  where id = product_id
    and stock_quantity >= quantity_to_reduce;
    
  if not found then
    raise exception 'Insufficient stock or product not found';
  end if;
end;
$$;