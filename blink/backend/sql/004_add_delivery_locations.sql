-- Migration: add delivery locations management
create table if not exists public.delivery_locations (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  region text default null,
  city text default null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create unique constraint to prevent duplicate locations
create unique index if not exists idx_delivery_locations_unique 
on public.delivery_locations(lower(country), lower(coalesce(region, '')), lower(coalesce(city, '')));

-- Create index for fast lookups
create index if not exists idx_delivery_locations_active 
on public.delivery_locations(is_active, country);

-- Insert some default allowed delivery locations
insert into public.delivery_locations (country, region, city) values 
  ('India', null, null),
  ('Canada', null, null),
  ('United Kingdom', null, null),
  ('Australia', null, null)
on conflict do nothing;

-- Add trigger to update updated_at column
create or replace function update_delivery_locations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_delivery_locations_updated_at
  before update on public.delivery_locations
  for each row execute function update_delivery_locations_updated_at();
