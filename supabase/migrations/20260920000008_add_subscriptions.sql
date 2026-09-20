create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  transaction_id text,
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled', 'grace_period')),
  start_date timestamptz not null default now(),
  expiry_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_expiry_idx on public.subscriptions(expiry_date);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from public, anon;
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

create policy subscriptions_read on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()));
