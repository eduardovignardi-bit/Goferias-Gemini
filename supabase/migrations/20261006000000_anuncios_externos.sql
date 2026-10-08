create table if not exists public.anuncios_externos (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_listing_id text,
  title text not null,
  source_url text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  quartos integer not null check (quartos >= 0),
  banheiros numeric(4, 1) not null check (banheiros >= 0),
  daily_price numeric(12, 2) not null check (daily_price > 0),
  currency text not null default 'BRL',
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, source_listing_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'anuncios_externos' and column_name = 'bedrooms'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'anuncios_externos' and column_name = 'quartos'
  ) then
    alter table public.anuncios_externos rename column bedrooms to quartos;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'anuncios_externos' and column_name = 'bathrooms'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'anuncios_externos' and column_name = 'banheiros'
  ) then
    alter table public.anuncios_externos rename column bathrooms to banheiros;
  end if;
end;
$$;

create index if not exists anuncios_externos_match_idx
  on public.anuncios_externos (quartos, banheiros, latitude, longitude);

alter table public.anuncios_externos enable row level security;
revoke all on public.anuncios_externos from anon;
grant select on public.anuncios_externos to authenticated;

drop policy if exists "Authenticated users can read external listings"
  on public.anuncios_externos;
create policy "Authenticated users can read external listings"
  on public.anuncios_externos
  for select
  to authenticated
  using (true);

drop function if exists public.buscar_anuncios_externos_semelhantes(
  double precision, double precision, integer, numeric
);

create or replace function public.buscar_anuncios_externos_semelhantes(
  p_latitude double precision,
  p_longitude double precision,
  p_quartos integer,
  p_banheiros numeric
)
returns table (
  id uuid,
  source text,
  title text,
  source_url text,
  quartos integer,
  banheiros numeric,
  daily_price numeric,
  currency text,
  distance_meters double precision,
  scraped_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    listing.id,
    listing.source,
    listing.title,
    listing.source_url,
    listing.quartos,
    listing.banheiros,
    listing.daily_price,
    listing.currency,
    distance.meters,
    listing.scraped_at
  from public.anuncios_externos as listing
  cross join lateral (
    select 2 * 6371000 * asin(sqrt(least(1::double precision, greatest(
      0::double precision,
      power(sin(radians(listing.latitude - p_latitude) / 2), 2) +
      cos(radians(p_latitude)) * cos(radians(listing.latitude)) *
      power(sin(radians(listing.longitude - p_longitude) / 2), 2)
    )))) as meters
  ) as distance
  where p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and listing.quartos = p_quartos
    and listing.banheiros = p_banheiros
    and listing.latitude between p_latitude - (500.0 / 111320.0)
      and p_latitude + (500.0 / 111320.0)
    and listing.longitude between
      p_longitude - (500.0 / (111320.0 * greatest(abs(cos(radians(p_latitude))), 0.01)))
      and p_longitude + (500.0 / (111320.0 * greatest(abs(cos(radians(p_latitude))), 0.01)))
    and distance.meters <= 500
  order by distance.meters asc
  limit 30;
$$;

revoke all on function public.buscar_anuncios_externos_semelhantes(
  double precision, double precision, integer, numeric
) from public, anon;
grant execute on function public.buscar_anuncios_externos_semelhantes(
  double precision, double precision, integer, numeric
) to authenticated;
