create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_interests jsonb not null default '[]'::jsonb,
  personality_answers jsonb not null default '[]'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.preferences enable row level security;
revoke all on public.preferences from public, anon;
grant select, insert, update on public.preferences to authenticated;
grant all on public.preferences to service_role;

create policy preferences_own on public.preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
