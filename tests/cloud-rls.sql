begin;
insert into auth.users(id,email) values ('10000000-0000-4000-8000-000000000001','vibe-test-a@example.invalid'),('10000000-0000-4000-8000-000000000002','vibe-test-b@example.invalid'),('10000000-0000-4000-8000-000000000003','vibe-test-c@example.invalid');
insert into public.vibe_profiles(id,display_name) values('10000000-0000-4000-8000-000000000001','test A'),('10000000-0000-4000-8000-000000000002','test B'),('10000000-0000-4000-8000-000000000003','test C');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.vibe_rooms(id,owner_id,title) values('20000000-0000-4000-8000-000000000001',auth.uid(),'Test room');
insert into public.vibe_members(room_id,user_id) values('20000000-0000-4000-8000-000000000001',auth.uid());
insert into public.vibe_messages(author_id,recipient_id,body) values(auth.uid(),'10000000-0000-4000-8000-000000000002','Private message');
insert into public.vibe_messages(author_id,room_id,body) values(auth.uid(),'20000000-0000-4000-8000-000000000001','Room message');
insert into public.vibe_settings(user_id,data) values(auth.uid(),'{"appearance":"dark"}') on conflict(user_id) do update set data=excluded.data;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.vibe_messages)<>1 then raise exception 'recipient visibility failed'; end if;
 if (select count(*) from public.vibe_settings)<>0 then raise exception 'settings isolation failed'; end if;
 begin insert into public.vibe_messages(author_id,recipient_id,body) values('10000000-0000-4000-8000-000000000001',auth.uid(),'forged'); raise exception 'forged author accepted'; exception when insufficient_privilege then null; end;
 begin insert into public.vibe_messages(author_id,room_id,body) values(auth.uid(),'20000000-0000-4000-8000-000000000001','outsider'); raise exception 'outsider accepted'; exception when insufficient_privilege then null; end;
 if not vibe_private.file_access('10000000-0000-4000-8000-000000000001/dm/10000000-0000-4000-8000-000000000002/photo.jpg',false) then raise exception 'recipient media denied'; end if;
end $$;
insert into public.vibe_members(room_id,user_id) values('20000000-0000-4000-8000-000000000001',auth.uid()) on conflict do nothing;
do $$ begin if (select count(*) from public.vibe_messages)<>2 then raise exception 'member visibility failed'; end if; end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.vibe_messages)<>0 then raise exception 'third-party message leak'; end if;
 if vibe_private.file_access('10000000-0000-4000-8000-000000000001/dm/10000000-0000-4000-8000-000000000002/photo.jpg',false) then raise exception 'third-party media leak'; end if;
 if vibe_private.file_access('10000000-0000-4000-8000-000000000001/profile/10000000-0000-4000-8000-000000000001/photo.jpg',true) then raise exception 'foreign file overwrite'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.vibe_blocks(user_id,blocked_id) values(auth.uid(),'10000000-0000-4000-8000-000000000001');
do $$ begin if (select count(*) from public.vibe_messages)<>0 then raise exception 'blocked messages visible'; end if; end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 begin insert into public.vibe_messages(author_id,recipient_id,body) values(auth.uid(),'10000000-0000-4000-8000-000000000002','blocked'); raise exception 'block bypass'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'RLS ownership, direct messages, room membership, blocks, settings and media checks passed; test data rolled back.' as result;
