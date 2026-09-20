-- Applied using the hosted Supabase migration tool.
create or replace function vibe_private.message_insert_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'invalid_author' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 917));
  if (select count(*) from public.vibe_messages where author_id = new.author_id and created_at > now() - interval '1 minute') >= 60 then
    raise exception 'message_rate_limit' using errcode = 'P0001';
  end if;
  new.created_at := clock_timestamp();
  return new;
end $$;
revoke all on function vibe_private.message_insert_guard() from public, anon, authenticated;
create trigger vibe_message_insert_guard before insert on public.vibe_messages
for each row execute function vibe_private.message_insert_guard();
-- Never expose settings/messages to unsigned visitors, independently of policy checks.
revoke all on public.vibe_profiles, public.vibe_settings, public.vibe_blocks,
 public.vibe_rooms, public.vibe_members, public.vibe_messages,
 public.vibe_likes, public.vibe_reports from anon;

