
alter table public.vibe_settings
 add column theme text not null default 'dark' check(theme in ('dark','light')),
 add column smart_photos_enabled boolean not null default false,
 add column hide_age boolean not null default true,
 add column hide_distance boolean not null default true;
-- Preserve the existing preference when it was stored in the legacy JSON document.
update public.vibe_settings set theme=data->>'appearance' where data->>'appearance' in ('dark','light');

create table public.vibe_profile_details(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 living_in text not null default '' check(length(living_in)<=120),
 height_cm smallint check(height_cm between 80 and 260),
 job text not null default '' check(length(job)<=120),
 education text not null default '' check(length(education)<=160),
 basics jsonb not null default '{}' check(jsonb_typeof(basics)='object' and octet_length(basics::text)<=2000),
 lifestyle jsonb not null default '{}' check(jsonb_typeof(lifestyle)='object' and octet_length(lifestyle::text)<=2000)
);
alter table public.vibe_profile_details enable row level security;
revoke all on public.vibe_profile_details from anon,authenticated;
grant select,insert,update,delete on public.vibe_profile_details to authenticated;
create policy details_read on public.vibe_profile_details for select to authenticated
 using ((select vibe_private.active_session()) and (user_id=(select auth.uid()) or ((select vibe_private.onboarding_complete()) and not vibe_private.blocked(user_id))));
create policy details_insert on public.vibe_profile_details for insert to authenticated
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()));
create policy details_update on public.vibe_profile_details for update to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()))
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()));
create policy details_delete on public.vibe_profile_details for delete to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()));

create table public.vibe_profile_photos(
 user_id uuid not null references public.profiles(id) on delete cascade,
 slot smallint not null check(slot between 0 and 5),
 object_path text not null check(length(object_path)<=500),
 created_at timestamptz not null default statement_timestamp(),
 primary key(user_id,slot),unique(object_path),
 check(object_path like user_id::text||'/profile/'||user_id::text||'/%')
);
alter table public.vibe_profile_photos enable row level security;
revoke all on public.vibe_profile_photos from anon,authenticated;
grant select,insert,update,delete on public.vibe_profile_photos to authenticated;
create policy photos_read on public.vibe_profile_photos for select to authenticated
 using((select vibe_private.active_session()) and (user_id=(select auth.uid()) or ((select vibe_private.onboarding_complete()) and not vibe_private.blocked(user_id))));
create policy photos_insert on public.vibe_profile_photos for insert to authenticated
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()) and exists(select 1 from storage.objects o where o.bucket_id='vibe-media' and o.name=object_path and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')));
create policy photos_update on public.vibe_profile_photos for update to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()))
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()) and exists(select 1 from storage.objects o where o.bucket_id='vibe-media' and o.name=object_path and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')));
create policy photos_delete on public.vibe_profile_photos for delete to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()));

create table public.vibe_profile_prompts(
 user_id uuid not null references public.profiles(id) on delete cascade,
 slot smallint not null check(slot between 0 and 2),
 question text not null check(length(btrim(question)) between 1 and 160),
 answer text not null check(length(btrim(answer)) between 1 and 600),
 primary key(user_id,slot)
);
alter table public.vibe_profile_prompts enable row level security;
revoke all on public.vibe_profile_prompts from anon,authenticated;
grant select,insert,update,delete on public.vibe_profile_prompts to authenticated;
create policy prompts_read on public.vibe_profile_prompts for select to authenticated
 using((select vibe_private.active_session()) and (user_id=(select auth.uid()) or ((select vibe_private.onboarding_complete()) and not vibe_private.blocked(user_id))));
create policy prompts_insert on public.vibe_profile_prompts for insert to authenticated
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()));
create policy prompts_update on public.vibe_profile_prompts for update to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()))
 with check(user_id=(select auth.uid()) and (select vibe_private.active_session()));
create policy prompts_delete on public.vibe_profile_prompts for delete to authenticated
 using(user_id=(select auth.uid()) and (select vibe_private.active_session()));

-- Only the fixed public profile attributes are accepted. No private birth dates or coordinates.
create function vibe_private.validate_profile_attributes() returns trigger
language plpgsql set search_path='' as $$
declare k text; v jsonb;
begin
for k,v in select * from jsonb_each(NEW.basics) loop
 if k not in ('zodiac','personality','communication','love_style','family_plans') or jsonb_typeof(v)<>'string' or length(v#>>'{}')>120 then raise exception 'invalid_basics' using errcode='22023'; end if;
end loop;
for k,v in select * from jsonb_each(NEW.lifestyle) loop
 if k not in ('pets','drinking','smoking','workout','sleeping') or jsonb_typeof(v)<>'string' or length(v#>>'{}')>120 then raise exception 'invalid_lifestyle' using errcode='22023'; end if;
end loop;
return NEW;
end $$;
revoke all on function vibe_private.validate_profile_attributes() from public,anon,authenticated;
create trigger validate_profile_attributes before insert or update on public.vibe_profile_details
 for each row execute function vibe_private.validate_profile_attributes();

create or replace function vibe_private.onboarding_complete() returns boolean
language sql stable security definer set search_path='' as $$
 select vibe_private.active_session()
 and exists(select 1 from public.profiles where id=auth.uid() and onboarding_step=3 and onboarding_completed_at is not null)
 and (select count(distinct category)=3 from public.user_interests where user_id=auth.uid());
$$;

create function public.vibe_onboarding_status() returns jsonb
language sql stable security invoker set search_path='' as $$
select jsonb_build_object(
 'step',coalesce((select onboarding_step from public.profiles where id=auth.uid()),0),
 'complete',vibe_private.onboarding_complete(),
 'next_step',case
 when not exists(select 1 from public.user_interests where user_id=auth.uid() and category='nature') then 1
 when not exists(select 1 from public.user_interests where user_id=auth.uid() and category='interests')
   or not exists(select 1 from public.user_interests where user_id=auth.uid() and category='types') then 2
 when not vibe_private.onboarding_complete() then 3
 else null end
) where vibe_private.active_session();
$$;
revoke all on function public.vibe_onboarding_status() from public,anon;
grant execute on function public.vibe_onboarding_status() to authenticated;

create function public.vibe_profile_completion() returns jsonb
language sql stable security invoker set search_path='' as $$
with d as(select * from public.vibe_profile_details where user_id=auth.uid()),
photos as(select count(*)::integer n from public.vibe_profile_photos where user_id=auth.uid()),
prompts as(select count(*)::integer n from public.vibe_profile_prompts where user_id=auth.uid())
select jsonb_build_object(
 'photo_count',photos.n,'photos_remaining',greatest(0,6-photos.n),
 'prompt_count',prompts.n,
 'living_in',coalesce((select length(btrim(living_in))>0 from d),false),
 'height',coalesce((select height_cm is not null from d),false),
 'job',coalesce((select length(btrim(job))>0 from d),false),
 'education',coalesce((select length(btrim(education))>0 from d),false),
 'basics_count',coalesce((select count(*) from d,jsonb_each_text(d.basics) e where length(btrim(e.value))>0),0),
 'lifestyle_count',coalesce((select count(*) from d,jsonb_each_text(d.lifestyle) e where length(btrim(e.value))>0),0),
 'lifestyle_total',5
) from photos,prompts where vibe_private.active_session();
$$;
revoke all on function public.vibe_profile_completion() from public,anon;
grant execute on function public.vibe_profile_completion() to authenticated;

do $$ begin
if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='vibe_settings') then
 alter publication supabase_realtime add table public.vibe_settings;
end if;
if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='message_reactions') then
 alter publication supabase_realtime add table public.message_reactions;
end if;
end $$;

