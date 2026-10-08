alter table public.properties
  add column if not exists full_address text,
  add column if not exists neighborhood text;
