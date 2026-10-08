grant update on public.reservations to authenticated;

drop policy if exists "Owners can review reservations for their properties"
  on public.reservations;

create policy "Owners can review reservations for their properties"
  on public.reservations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.properties as property
      where property.id = reservations.property_id
        and property.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.properties as property
      where property.id = reservations.property_id
        and property.user_id = (select auth.uid())
    )
  );
