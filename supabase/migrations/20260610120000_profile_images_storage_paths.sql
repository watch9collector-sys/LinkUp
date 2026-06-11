-- LinkUp: profile-images bucket paths avatars/{user_id}/ and banners/{user_id}/
-- Run in Supabase Dashboard → SQL Editor (safe to re-run)

-- Public read
drop policy if exists "profile_images_public_read" on storage.objects;
create policy "profile_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-images');

drop policy if exists "profile_images_insert_own" on storage.objects;
create policy "profile_images_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] in ('avatars', 'banners')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "profile_images_update_own" on storage.objects;
create policy "profile_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] in ('avatars', 'banners')
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] in ('avatars', 'banners')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "profile_images_delete_own" on storage.objects;
create policy "profile_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] in ('avatars', 'banners')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

select pg_notify('pgrst', 'reload schema');
