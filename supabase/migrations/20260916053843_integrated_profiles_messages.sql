-- Upgrade the existing Vibe system in place. No copied message store.
-- profiles holds private account information; vibe_profiles remains the public directory.
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 email text,
 username text NOT NULL UNIQUE,
 full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name)<=120),
 avatar_url text CHECK (avatar_url IS NULL OR (char_length(avatar_url)<=2048 AND avatar_url ~ '^https://[^[:space:]]+$')),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK (username ~ '^[a-z][a-z0-9_]{2,39}$'),
 CHECK (username !~ '^u_' OR username='u_'||replace(id::text,'-',''))
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(username,avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE POLICY account_read ON public.profiles FOR SELECT TO authenticated
 USING(id=(SELECT auth.uid()) AND NOT vibe_private.blocked(id));
CREATE POLICY account_update ON public.profiles FOR UPDATE TO authenticated
 USING(id=(SELECT auth.uid()) AND NOT vibe_private.blocked(id))
 WITH CHECK(id=(SELECT auth.uid()) AND NOT vibe_private.blocked(id));

CREATE FUNCTION vibe_private.sync_auth_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE name_value text;
BEGIN
 -- Auth creation has no user JWT; only the auth.users trigger can invoke this.
 name_value := CASE
  WHEN jsonb_typeof(NEW.raw_user_meta_data->'display_name')='string'
   THEN NEW.raw_user_meta_data->>'display_name'
  WHEN jsonb_typeof(NEW.raw_user_meta_data->'full_name')='string'
   THEN NEW.raw_user_meta_data->>'full_name'
  ELSE 'Vibe' END;
 name_value:=coalesce(nullif(btrim(name_value),''),'Vibe');
 INSERT INTO public.profiles(id,email,username,full_name,created_at)
 VALUES(NEW.id,NEW.email,'u_'||replace(NEW.id::text,'-',''),left(name_value,120),coalesce(NEW.created_at,statement_timestamp()))
 ON CONFLICT(id) DO UPDATE SET email=excluded.email;
 INSERT INTO public.vibe_profiles(id,display_name,created_at)
 VALUES(NEW.id,left(name_value,24),coalesce(NEW.created_at,statement_timestamp()))
 ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.vibe_settings(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.sync_auth_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER vibe_auth_profile AFTER INSERT OR UPDATE OF email ON auth.users
 FOR EACH ROW EXECUTE FUNCTION vibe_private.sync_auth_profile();

-- Backfill preserves existing public profiles. Never write credentials or confirm users.
INSERT INTO public.profiles(id,email,username,full_name,created_at)
 SELECT u.id,u.email,'u_'||replace(u.id::text,'-',''),coalesce(p.display_name,'Vibe'),coalesce(u.created_at,statement_timestamp())
 FROM auth.users u LEFT JOIN public.vibe_profiles p ON p.id=u.id;
INSERT INTO public.vibe_profiles(id,display_name,created_at)
 SELECT id,left(full_name,24),created_at FROM public.profiles ON CONFLICT(id) DO NOTHING;
INSERT INTO public.vibe_settings(user_id)
 SELECT id FROM public.profiles ON CONFLICT(user_id) DO NOTHING;

CREATE FUNCTION vibe_private.sync_display_name() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR auth.uid()<>NEW.id THEN
  RAISE EXCEPTION 'invalid_profile_owner' USING errcode='42501';
 END IF;
 UPDATE public.profiles SET full_name=NEW.display_name WHERE id=NEW.id;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.sync_display_name() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER vibe_sync_display_name AFTER UPDATE OF display_name ON public.vibe_profiles
 FOR EACH ROW EXECUTE FUNCTION vibe_private.sync_display_name();
DROP POLICY profiles_create ON public.vibe_profiles;
REVOKE INSERT ON public.vibe_profiles FROM authenticated;

-- Rename retains all rows, indexes, room relations and existing RLS dependencies.
ALTER TABLE public.vibe_messages RENAME TO messages;
ALTER TABLE public.messages RENAME COLUMN author_id TO sender_id;
ALTER TABLE public.messages RENAME COLUMN recipient_id TO receiver_id;
ALTER TABLE public.messages RENAME COLUMN body TO content;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_account_fkey
 FOREIGN KEY(sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_account_fkey
 FOREIGN KEY(receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_nonblank_text
 CHECK(kind<>'text' OR content ~ '[^[:space:]]');
-- receiver_id is mandatory for DMs; room messages instead require room_id.
-- Existing XOR, distinct-party, media-path and room-membership constraints remain.
REVOKE ALL ON public.messages FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.messages TO authenticated;
GRANT INSERT(id,sender_id,receiver_id,room_id,kind,content,object_path)
 ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
CREATE INDEX messages_dm_cursor ON public.messages(sender_id,receiver_id,created_at DESC,id DESC)
 WHERE room_id IS NULL;
CREATE INDEX messages_room_cursor ON public.messages(room_id,created_at DESC,id DESC)
 WHERE room_id IS NOT NULL;

CREATE OR REPLACE FUNCTION vibe_private.message_insert_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NEW.sender_id<>auth.uid() THEN
  RAISE EXCEPTION 'invalid_author' USING errcode='42501';
 END IF;
 -- Serialize writes per sender: the quota applies across Workers/devices.
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.sender_id::text,917));
 -- A retry of an existing ID is handled by ON CONFLICT and payload comparison.
 IF NOT EXISTS(SELECT 1 FROM public.messages WHERE id=NEW.id AND sender_id=NEW.sender_id)
 AND (SELECT count(*) FROM public.messages WHERE sender_id=NEW.sender_id
      AND created_at>statement_timestamp()-interval '1 minute')>=60 THEN
  RAISE EXCEPTION 'message_rate_limit' USING errcode='P0001';
 END IF;
 NEW.created_at:=clock_timestamp();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.message_insert_guard() FROM PUBLIC,anon,authenticated;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
 AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages')
 THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; END IF;
END $$;
NOTIFY pgrst,'reload schema';

