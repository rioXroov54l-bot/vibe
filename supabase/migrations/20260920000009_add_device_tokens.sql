create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from public, anon;
grant select, insert, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

create policy device_tokens_own on public.device_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
