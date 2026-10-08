alter table public.reservations
  add column if not exists guest_id uuid references auth.users(id) on delete set null;

create index if not exists reservations_guest_id_idx
  on public.reservations (guest_id);

grant insert on public.reservations to authenticated;

drop policy if exists "Guests can request their own reservations"
  on public.reservations;

create policy "Guests can request their own reservations"
  on public.reservations
  for insert
  to authenticated
  with check (
    guest_id = (select auth.uid())
    and status = 'pendente'
    and total_price > 0
    and check_in < check_out
    and exists (
      select 1
      from public.properties as property
      where property.id = reservations.property_id
    )
  );
