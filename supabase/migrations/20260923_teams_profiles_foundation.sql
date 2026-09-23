-- Extends the legacy teams table with the fields used by the creation API.
alter table public.teams
  add column if not exists association_type text not null default 'NEIGHBORHOOD'
    check (association_type in ('SCHOOL', 'NEIGHBORHOOD'));

alter table public.teams
  add column if not exists origin text not null default 'Angola';

-- Profile fields are kept separate from auth.users while preserving the current users table.
alter table public.users
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text;

alter table public.users
  drop constraint if exists users_bio_length;

alter table public.users
  add constraint users_bio_length check (bio is null or length(btrim(bio)) <= 240);

create policy "Users can insert own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Public can view public team logos"
  on storage.objects for select
  to public
  using (bucket_id = 'logosdostimes');
