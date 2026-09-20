-- Vibe persistent social data. Apply once through Supabase migrations.
create schema if not exists vibe_private;
revoke all on schema vibe_private from public;
grant usage on schema vibe_private to authenticated;
create table public.vibe_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 24),
 bio text not null default '' check (char_length(bio)<=160),
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<=20000),
 created_at timestamptz not null default now()
);
create table public.vibe_settings(user_id uuid primary key references public.vibe_profiles(id) on delete cascade, data jsonb not null default '{}' check(jsonb_typeof(data)='object' and octet_length(data::text)<=10000));
create table public.vibe_blocks(user_id uuid references public.vibe_profiles(id) on delete cascade, blocked_id uuid references public.vibe_profiles(id) on delete cascade, primary key(user_id,blocked_id),check(user_id<>blocked_id));
create index vibe_blocks_reverse on public.vibe_blocks(blocked_id,user_id);
create table public.vibe_rooms(id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.vibe_profiles(id) on delete cascade, title text not null check(char_length(title) between 1 and 60), category integer not null default 1 check(category between 1 and 5), kind text not null default 'voice' check(kind in ('voice','flash','cinema','game','echo')), created_at timestamptz not null default now());
create index vibe_rooms_owner on public.vibe_rooms(owner_id);
create table public.vibe_members(room_id uuid references public.vibe_rooms(id) on delete cascade, user_id uuid references public.vibe_profiles(id) on delete cascade, joined_at timestamptz not null default now(), primary key(room_id,user_id));
create index vibe_members_user on public.vibe_members(user_id,room_id);
create table public.vibe_messages(id uuid primary key default gen_random_uuid(), author_id uuid not null references public.vibe_profiles(id) on delete cascade, room_id uuid references public.vibe_rooms(id) on delete cascade, recipient_id uuid references public.vibe_profiles(id) on delete cascade, kind text not null default 'text' check(kind in ('text','photo','voice')), body text not null default '' check(char_length(body)<=2000), object_path text, created_at timestamptz not null default now(), check((room_id is null)<>(recipient_id is null)), check(recipient_id is null or recipient_id<>author_id), check((kind='text' and char_length(body)>0 and object_path is null) or (kind<>'text' and object_path is not null)));
create index vibe_messages_room_time on public.vibe_messages(room_id,created_at desc) where room_id is not null;
create index vibe_messages_sender_time on public.vibe_messages(author_id,created_at desc);
create index vibe_messages_recipient_time on public.vibe_messages(recipient_id,created_at desc) where recipient_id is not null;
create table public.vibe_likes(user_id uuid references public.vibe_profiles(id) on delete cascade, room_id uuid references public.vibe_rooms(id) on delete cascade, primary key(user_id,room_id));
create index vibe_likes_room on public.vibe_likes(room_id);
create table public.vibe_reports(id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.vibe_profiles(id) on delete cascade, target_kind text not null check(target_kind in ('user','room','message','support')), target_id text not null check(char_length(target_id)<=100), reason text not null check(char_length(reason) between 1 and 100), details text not null default '' check(char_length(details)<=2000), status text not null default 'received' check(status in ('received','reviewed','closed')), created_at timestamptz not null default now());
create index vibe_reports_reporter on public.vibe_reports(reporter_id,created_at desc);
-- Internal helpers avoid recursive membership policies; identities are always auth.uid().
create function vibe_private.blocked(other uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is null or exists(select 1 from public.vibe_blocks where (user_id=auth.uid() and blocked_id=other) or (user_id=other and blocked_id=auth.uid())); $$;
create function vibe_private.room_access(r uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.vibe_rooms x where x.id=r and not vibe_private.blocked(x.owner_id) and (x.owner_id=auth.uid() or exists(select 1 from public.vibe_members m where m.room_id=r and m.user_id=auth.uid()))); $$;
create function vibe_private.room_owner(r uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.vibe_rooms where id=r and owner_id=auth.uid()); $$;
create function vibe_private.can_join(r uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.vibe_rooms where id=r and not vibe_private.blocked(owner_id)); $$;
create function vibe_private.file_access(path text,writing boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]:=string_to_array(path,'/'); actor uuid:=auth.uid(); owner uuid; target uuid;
begin
 if actor is null or array_length(parts,1)<>4 then return false; end if;
 begin owner:=parts[1]::uuid; target:=parts[3]::uuid; exception when invalid_text_representation then return false; end;
 if writing and owner<>actor then return false; end if;
 if parts[2]='profile' then return target=owner and (writing or not vibe_private.blocked(owner));
 elsif parts[2]='room' then return vibe_private.room_access(target);
 elsif parts[2]='dm' then return (actor=owner or actor=target) and not vibe_private.blocked(case when actor=owner then target else owner end);
 end if; return false;
end $$;
revoke all on all functions in schema vibe_private from public,anon;
grant execute on all functions in schema vibe_private to authenticated;
-- Explicit grants: new objects are not exposed automatically.
grant select,insert on public.vibe_profiles to authenticated;
grant update(display_name,bio,data) on public.vibe_profiles to authenticated;
grant select,insert,update,delete on public.vibe_settings to authenticated;
grant select,insert,delete on public.vibe_blocks,public.vibe_members,public.vibe_likes to authenticated;
grant select,insert,delete on public.vibe_rooms,public.vibe_messages to authenticated;
grant select,insert on public.vibe_reports to authenticated;
DO $$ declare tab text; begin foreach tab in array array['vibe_profiles','vibe_settings','vibe_blocks','vibe_rooms','vibe_members','vibe_messages','vibe_likes','vibe_reports'] loop execute format('alter table public.%I enable row level security',tab); end loop; end $$;
create policy profiles_read on public.vibe_profiles for select to authenticated using(not vibe_private.blocked(id));
create policy profiles_create on public.vibe_profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_update on public.vibe_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy settings_own on public.vibe_settings for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy blocks_own on public.vibe_blocks for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy rooms_read on public.vibe_rooms for select to authenticated using(not vibe_private.blocked(owner_id));
create policy rooms_create on public.vibe_rooms for insert to authenticated with check(owner_id=(select auth.uid()));
create policy rooms_delete on public.vibe_rooms for delete to authenticated using(owner_id=(select auth.uid()));
create policy members_read on public.vibe_members for select to authenticated using(vibe_private.room_access(room_id));
create policy members_join on public.vibe_members for insert to authenticated with check(user_id=(select auth.uid()) and vibe_private.can_join(room_id));
create policy members_leave on public.vibe_members for delete to authenticated using(user_id=(select auth.uid()) or vibe_private.room_owner(room_id));
create policy messages_read on public.vibe_messages for select to authenticated using((room_id is not null and vibe_private.room_access(room_id) and not vibe_private.blocked(author_id)) or (room_id is null and (author_id=(select auth.uid()) or recipient_id=(select auth.uid())) and not vibe_private.blocked(case when author_id=(select auth.uid()) then recipient_id else author_id end)));
create policy messages_send on public.vibe_messages for insert to authenticated with check(author_id=(select auth.uid()) and ((room_id is not null and vibe_private.room_access(room_id)) or (recipient_id is not null and not vibe_private.blocked(recipient_id))) and (kind='text' or (object_path like author_id::text||'/'||case when room_id is not null then 'room/'||room_id::text else 'dm/'||recipient_id::text end||'/%' and vibe_private.file_access(object_path,true))));
create policy messages_delete on public.vibe_messages for delete to authenticated using(author_id=(select auth.uid()));
create policy likes_own on public.vibe_likes for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and vibe_private.can_join(room_id));
create policy reports_own_read on public.vibe_reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy reports_send on public.vibe_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and status='received');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('vibe-media','vibe-media',false,8388608,array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/ogg','audio/mpeg','video/mp4']);
create policy vibe_media_read on storage.objects for select to authenticated using(bucket_id='vibe-media' and vibe_private.file_access(name,false));
create policy vibe_media_upload on storage.objects for insert to authenticated with check(bucket_id='vibe-media' and vibe_private.file_access(name,true));
create policy vibe_media_delete on storage.objects for delete to authenticated using(bucket_id='vibe-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

