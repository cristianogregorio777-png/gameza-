create extension if not exists "pgcrypto";

do $$
begin
  create type public.location_type as enum ('SCHOOL', 'NEIGHBORHOOD');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.location_type not null,
  region text not null,
  constraint locations_name_not_blank check (length(btrim(name)) > 0),
  constraint locations_region_not_blank check (length(btrim(region)) > 0)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  logo_url text,
  association_type text not null default 'NEIGHBORHOOD'
    check (association_type in ('SCHOOL', 'NEIGHBORHOOD')),
  origin text not null default 'Angola',
  location_id uuid references public.locations (id) on delete set null,
  modality text not null,
  home_field text,
  whatsapp_number text,
  description text,
  created_at timestamptz not null default now(),
  constraint teams_name_not_blank check (length(btrim(name)) > 0),
  constraint teams_modality_not_blank check (length(btrim(modality)) > 0)
);

create table if not exists public.moderation_audits (
  id uuid primary key default gen_random_uuid(),
  text_evaluated text not null,
  flagged boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists teams_owner_id_idx on public.teams (owner_id);
create index if not exists teams_location_id_idx on public.teams (location_id);
create index if not exists locations_type_region_idx on public.locations (type, region);
create index if not exists moderation_audits_created_at_idx
  on public.moderation_audits (created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.locations enable row level security;
alter table public.teams enable row level security;
alter table public.moderation_audits enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Public can read locations" on public.locations;
create policy "Public can read locations"
  on public.locations for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams"
  on public.teams for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners can create teams" on public.teams;
create policy "Owners can create teams"
  on public.teams for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update teams" on public.teams;
create policy "Owners can update teams"
  on public.teams for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

revoke all on public.moderation_audits from anon, authenticated;
