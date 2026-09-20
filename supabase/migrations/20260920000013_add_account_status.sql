alter table public.profiles
  add column if not exists account_status text not null default 'active'
  check (account_status in ('active', 'suspended', 'deleted'));
