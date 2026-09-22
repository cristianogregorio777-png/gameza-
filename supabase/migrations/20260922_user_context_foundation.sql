-- Foundation for the server-driven user context.
-- Safe to run after the original users table migration.

alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.user_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  locale text not null default 'pt-AO',
  timezone text not null default 'Africa/Luanda',
  notifications_enabled boolean not null default true,
  profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'members')),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_personalization (
  user_id uuid primary key references public.users (id) on delete cascade,
  theme text not null default 'dark'
    check (theme in ('system', 'dark', 'light')),
  accent text not null default 'lime',
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
alter table public.user_personalization enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
create policy "Users can read own settings"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own personalization" on public.user_personalization;
create policy "Users can read own personalization"
  on public.user_personalization for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own personalization" on public.user_personalization;
create policy "Users can update own personalization"
  on public.user_personalization for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.user_settings (user_id)
select id from public.users
on conflict (user_id) do nothing;

insert into public.user_personalization (user_id)
select id from public.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_personalization (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
