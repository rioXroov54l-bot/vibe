create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username)
  );
$$;

revoke all on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;
