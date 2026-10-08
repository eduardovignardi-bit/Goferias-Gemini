alter table public.properties
  add column if not exists quartos integer
    check (quartos is null or quartos >= 0),
  add column if not exists banheiros numeric(4, 1)
    check (banheiros is null or banheiros >= 0),
  add column if not exists latitude double precision
    check (latitude is null or latitude between -90 and 90),
  add column if not exists longitude double precision
    check (longitude is null or longitude between -180 and 180);
