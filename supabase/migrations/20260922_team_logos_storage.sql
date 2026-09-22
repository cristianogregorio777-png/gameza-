-- Bucket público para servir as logos dos times.
insert into storage.buckets (id, name, public)
values ('logosdostimes', 'logosdostimes', true)
on conflict (id) do update set public = excluded.public;

-- Qualquer visitante pode visualizar uma logo pública.
drop policy if exists "Public can view team logos" on storage.objects;
create policy "Public can view team logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logosdostimes');

-- Apenas utilizadores autenticados podem adicionar logos.
drop policy if exists "Authenticated users can upload team logos" on storage.objects;
create policy "Authenticated users can upload team logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logosdostimes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- O dono da pasta pode atualizar a sua logo.
drop policy if exists "Users can update their team logos" on storage.objects;
create policy "Users can update their team logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logosdostimes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logosdostimes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- O dono da pasta pode apagar a sua logo.
drop policy if exists "Users can delete their team logos" on storage.objects;
create policy "Users can delete their team logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logosdostimes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
