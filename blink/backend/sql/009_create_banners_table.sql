create table public.banners (
  id uuid not null default gen_random_uuid (),
  title text not null,
  subtitle text null,
  button_text text null,
  image_url text null,
  color text null,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint banners_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_banners_display_order on public.banners using btree (display_order) TABLESPACE pg_default;