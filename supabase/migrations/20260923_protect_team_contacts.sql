-- Team contact numbers must never be readable directly by anonymous clients.
-- Public team cards are served by app/api/teams using the server secret.
revoke select on table public.teams from anon, authenticated;
