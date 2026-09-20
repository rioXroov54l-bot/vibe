create table if not exists public.username_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  old_username text,
  new_username text,
  changed_at timestamptz not null default now()
);

create index if not exists username_history_user_idx
  on public.username_history(user_id, changed_at desc);

alter table public.username_history enable row level security;
revoke all on public.username_history from public, anon;
grant select on public.username_history to authenticated;
grant all on public.username_history to service_role;

create policy username_history_own on public.username_history
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.track_username_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.username is distinct from new.username then
    insert into public.username_history(user_id, old_username, new_username)
    values (old.id, old.username, new.username);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_username_history on public.profiles;
create trigger profiles_username_history
before update of username on public.profiles
for each row execute function public.track_username_change();
