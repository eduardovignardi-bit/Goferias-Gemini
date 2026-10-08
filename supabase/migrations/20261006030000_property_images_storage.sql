insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10485760,
  array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Property owners can upload their images"
  on storage.objects;
create policy "Property owners can upload their images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Property owners can delete their images"
  on storage.objects;
create policy "Property owners can delete their images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
