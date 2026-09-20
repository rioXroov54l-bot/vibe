-- Session revocation applies to REST and Realtime, not just the UI.
CREATE FUNCTION vibe_private.active_session() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
  WHERE s.user_id=auth.uid() AND s.id::text=auth.jwt()->>'session_id'
  AND (s.not_after IS NULL OR s.not_after>now())
  AND u.email_confirmed_at IS NOT NULL
  AND (u.banned_until IS NULL OR u.banned_until<=now())
  AND NOT u.is_anonymous
 );
$$;
REVOKE ALL ON FUNCTION vibe_private.active_session() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION vibe_private.active_session() TO authenticated;
CREATE FUNCTION public.vibe_session_valid() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT vibe_private.active_session();
$$;
REVOKE ALL ON FUNCTION public.vibe_session_valid() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.vibe_session_valid() TO authenticated;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','messages','vibe_profiles','vibe_settings','vibe_blocks','vibe_rooms','vibe_members','vibe_likes','vibe_reports'] LOOP
  EXECUTE format('CREATE POLICY session_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT vibe_private.active_session())) WITH CHECK ((SELECT vibe_private.active_session()))',t);
 END LOOP;
END $$;
CREATE POLICY vibe_media_session ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
 USING(bucket_id<>'vibe-media' OR (SELECT vibe_private.active_session()))
 WITH CHECK(bucket_id<>'vibe-media' OR (SELECT vibe_private.active_session()));

-- Notifications contain routing identifiers only; never duplicate message bodies.
CREATE TABLE public.notifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 read_at timestamptz,
 UNIQUE(user_id,message_id), CHECK(user_id<>actor_id)
);
CREATE INDEX notifications_inbox ON public.notifications(user_id,created_at DESC,id DESC);
CREATE INDEX notifications_unread ON public.notifications(user_id,created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notifications_message ON public.notifications(message_id);
CREATE INDEX notifications_actor ON public.notifications(actor_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.active_session()) AND NOT vibe_private.blocked(actor_id));
CREATE POLICY notifications_ack ON public.notifications FOR UPDATE TO authenticated
 USING(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.active_session()) AND NOT vibe_private.blocked(actor_id))
 WITH CHECK(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.active_session()) AND NOT vibe_private.blocked(actor_id));
CREATE FUNCTION vibe_private.stamp_notification_read() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 NEW.read_at:=coalesce(OLD.read_at,statement_timestamp()); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.stamp_notification_read() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER notification_read_time BEFORE UPDATE ON public.notifications
 FOR EACH ROW EXECUTE FUNCTION vibe_private.stamp_notification_read();

-- Persistent quota: deleting a sent message cannot reset the budget.
CREATE TABLE vibe_private.message_budget(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 window_start timestamptz NOT NULL,n integer NOT NULL CHECK(n BETWEEN 1 AND 60)
);
ALTER TABLE vibe_private.message_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vibe_private.message_budget FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION vibe_private.message_insert_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE used integer; bucket timestamptz:=date_trunc('minute',statement_timestamp());
BEGIN
 IF auth.uid() IS NULL OR NEW.sender_id<>auth.uid() OR NOT vibe_private.active_session() THEN
  RAISE EXCEPTION 'invalid_author' USING errcode='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.messages WHERE id=NEW.id AND sender_id=NEW.sender_id) THEN
  INSERT INTO vibe_private.message_budget AS b(user_id,window_start,n) VALUES(NEW.sender_id,bucket,1)
  ON CONFLICT(user_id) DO UPDATE SET window_start=excluded.window_start,
   n=CASE WHEN b.window_start=excluded.window_start THEN b.n+1 ELSE 1 END
  WHERE b.window_start<>excluded.window_start OR b.n<60 RETURNING n INTO used;
  IF used IS NULL THEN RAISE EXCEPTION 'message_rate_limit' USING errcode='P0001'; END IF;
 END IF;
 NEW.created_at:=clock_timestamp(); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.message_insert_guard() FROM PUBLIC,anon,authenticated;

-- Append-only operational telemetry: no account IDs, IPs, tokens or message text.
CREATE TABLE vibe_private.operational_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 occurred_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 event text NOT NULL CHECK(event IN ('message_created','message_deleted','account_created','account_deleted','report_created'))
);
CREATE INDEX operational_events_time ON vibe_private.operational_events(occurred_at);
ALTER TABLE vibe_private.operational_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vibe_private.operational_events FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE vibe_private.operational_events_id_seq FROM PUBLIC,anon,authenticated;
CREATE FUNCTION vibe_private.after_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NULL OR NEW.sender_id<>auth.uid() THEN RAISE EXCEPTION 'invalid_author' USING errcode='42501'; END IF;
  IF NEW.receiver_id IS NOT NULL THEN
   INSERT INTO public.notifications(user_id,actor_id,message_id)
   VALUES(NEW.receiver_id,NEW.sender_id,NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO vibe_private.operational_events(event) VALUES('message_created'); RETURN NEW;
 END IF;
 INSERT INTO vibe_private.operational_events(event) VALUES('message_deleted'); RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION vibe_private.after_message() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER message_notifications AFTER INSERT OR DELETE ON public.messages
 FOR EACH ROW EXECUTE FUNCTION vibe_private.after_message();
CREATE FUNCTION vibe_private.audit_lifecycle() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 -- Trigger-only: Auth creation/deletion and cascades may have no JWT.
 INSERT INTO vibe_private.operational_events(event) VALUES(
  CASE WHEN TG_TABLE_NAME='vibe_reports' THEN 'report_created'
       WHEN TG_OP='INSERT' THEN 'account_created' ELSE 'account_deleted' END);
 RETURN coalesce(NEW,OLD);
END $$;
REVOKE ALL ON FUNCTION vibe_private.audit_lifecycle() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER auth_operational_audit AFTER INSERT OR DELETE ON auth.users
 FOR EACH ROW EXECUTE FUNCTION vibe_private.audit_lifecycle();
CREATE TRIGGER report_operational_audit AFTER INSERT ON public.vibe_reports
 FOR EACH ROW EXECUTE FUNCTION vibe_private.audit_lifecycle();

CREATE FUNCTION vibe_private.maintenance() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 DELETE FROM public.notifications WHERE created_at<now()-interval '90 days';
 DELETE FROM vibe_private.operational_events WHERE occurred_at<now()-interval '90 days';
 DELETE FROM vibe_private.message_budget WHERE window_start<now()-interval '2 days';
END $$;
REVOKE ALL ON FUNCTION vibe_private.maintenance() FROM PUBLIC,anon,authenticated;
-- The newer index has the same predicate and keys plus id for stable pagination.
DROP INDEX public.vibe_messages_room_time;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
 END IF;
END $$;
NOTIFY pgrst,'reload schema';

