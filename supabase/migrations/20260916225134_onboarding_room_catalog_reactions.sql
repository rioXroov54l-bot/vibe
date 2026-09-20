-- Canonical, private onboarding state. UI pages are committed in order.
ALTER TABLE public.profiles ADD COLUMN onboarding_step smallint NOT NULL DEFAULT 0 CHECK(onboarding_step BETWEEN 0 AND 3), ADD COLUMN onboarding_completed_at timestamptz;
CREATE TABLE public.user_interests(
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN ('nature','interests','types')),
 value smallint NOT NULL,
 PRIMARY KEY(user_id,category,value),
 CHECK(value>=0 AND value<CASE category WHEN 'nature' THEN 6 WHEN 'interests' THEN 24 ELSE 12 END)
);
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_interests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.user_interests TO authenticated;
GRANT ALL ON public.user_interests TO service_role;
CREATE POLICY interests_own ON public.user_interests FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.active_session()));
CREATE FUNCTION vibe_private.onboarding_complete() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT vibe_private.active_session() AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND onboarding_step=3 AND onboarding_completed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION vibe_private.onboarding_complete() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION vibe_private.onboarding_complete() TO authenticated;
CREATE FUNCTION public.vibe_onboarding_step(p_step integer,p_values integer[] DEFAULT '{}',p_types integer[] DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); current_step integer; cat text; completed timestamptz;
BEGIN
 IF NOT vibe_private.active_session() THEN RAISE EXCEPTION 'session_expired' USING errcode='42501'; END IF;
 SELECT onboarding_step INTO current_step FROM public.profiles WHERE id=actor FOR UPDATE;
 IF p_step IS NULL OR p_step NOT BETWEEN 1 AND 3 OR p_step>current_step+1 THEN RAISE EXCEPTION 'onboarding_order' USING errcode='22023'; END IF;
 IF p_step<3 THEN
  cat:=CASE p_step WHEN 1 THEN 'nature' ELSE 'interests' END;
  IF coalesce(cardinality(p_values),0)<1 OR cardinality(p_values)>(CASE p_step WHEN 1 THEN 6 ELSE 24 END)
   OR EXISTS(SELECT 1 FROM unnest(p_values) v WHERE v IS NULL OR v<0 OR v>=(CASE p_step WHEN 1 THEN 6 ELSE 24 END)) THEN RAISE EXCEPTION 'invalid_interests' USING errcode='22023'; END IF;
  IF p_step=2 AND (coalesce(cardinality(p_types),0)<1 OR cardinality(p_types)>12 OR EXISTS(SELECT 1 FROM unnest(p_types) v WHERE v IS NULL OR v<0 OR v>=12)) THEN RAISE EXCEPTION 'invalid_types' USING errcode='22023'; END IF;
  DELETE FROM public.user_interests WHERE user_id=actor AND category=cat;
  INSERT INTO public.user_interests SELECT actor,cat,v FROM (SELECT DISTINCT unnest(p_values)::smallint v) x;
  UPDATE public.vibe_profiles SET data=jsonb_set(data,ARRAY[cat],to_jsonb(p_values)) WHERE id=actor;
  IF p_step=2 THEN
   DELETE FROM public.user_interests WHERE user_id=actor AND category='types';
   INSERT INTO public.user_interests SELECT actor,'types',v FROM (SELECT DISTINCT unnest(p_types)::smallint v) x;
   UPDATE public.vibe_profiles SET data=jsonb_set(data,'{types}',to_jsonb(p_types)) WHERE id=actor;
  END IF;
 ELSE
  IF (SELECT count(DISTINCT category) FROM public.user_interests WHERE user_id=actor)<>3 THEN RAISE EXCEPTION 'incomplete_interests' USING errcode='22023'; END IF;
 END IF;
 UPDATE public.profiles SET onboarding_step=greatest(onboarding_step,p_step),
 onboarding_completed_at=CASE WHEN p_step=3 THEN coalesce(onboarding_completed_at,statement_timestamp()) ELSE onboarding_completed_at END
 WHERE id=actor RETURNING onboarding_completed_at INTO completed;
 RETURN jsonb_build_object('step',greatest(current_step,p_step),'completed_at',completed);
END $$;
REVOKE ALL ON FUNCTION public.vibe_onboarding_step(integer,integer[],integer[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.vibe_onboarding_step(integer,integer[],integer[]) TO authenticated;
-- General profile edits cannot overwrite the canonical vectors or set completion.
CREATE FUNCTION vibe_private.preserve_interest_vectors() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF current_user='authenticated' THEN
  NEW.data:=(NEW.data-'nature'-'interests'-'types') || jsonb_build_object('nature',coalesce(OLD.data->'nature','[]'::jsonb),'interests',coalesce(OLD.data->'interests','[]'::jsonb),'types',coalesce(OLD.data->'types','[]'::jsonb));
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vibe_private.preserve_interest_vectors() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preserve_interest_vectors BEFORE UPDATE ON public.vibe_profiles FOR EACH ROW EXECUTE FUNCTION vibe_private.preserve_interest_vectors();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['messages','vibe_rooms','vibe_members','vibe_likes','notifications'] LOOP
 EXECUTE format('CREATE POLICY onboarding_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT vibe_private.onboarding_complete())) WITH CHECK ((SELECT vibe_private.onboarding_complete()))',t);
 END LOOP;
END $$;
CREATE POLICY directory_onboarding ON public.vibe_profiles AS RESTRICTIVE FOR SELECT TO authenticated USING(id=(SELECT auth.uid()) OR (SELECT vibe_private.onboarding_complete()));

-- Keep legacy identifiers as public aliases, with UUID keys for real conversations.
ALTER TABLE public.vibe_rooms ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.vibe_rooms ADD COLUMN legacy_id integer UNIQUE, ADD COLUMN legacy_snapshot jsonb;
ALTER TABLE public.vibe_rooms ADD CONSTRAINT room_identity CHECK((owner_id IS NOT NULL AND legacy_id IS NULL) OR (owner_id IS NULL AND legacy_id IS NOT NULL AND legacy_id BETWEEN 1 AND 6));
REVOKE INSERT ON public.vibe_rooms FROM authenticated;
GRANT INSERT(id,owner_id,title,category,kind) ON public.vibe_rooms TO authenticated;


INSERT INTO public.vibe_rooms(owner_id,legacy_id,title,category,kind,legacy_snapshot) VALUES
(NULL,1,'Late-night conversations ☾',1,'voice','{"id": 1, "title": ["سوالف آخر الليل ☾", "Late-night conversations ☾"], "category": 1, "desc": ["خذ راحتك… هنا كلنا أصحاب", "Get comfortable. You’re among friends."], "count": 128, "names": [1, 2, 3], "type": "voice"}'::jsonb),
(NULL,2,'A slower kind of night ♫',2,'cinema','{"id": 2, "title": ["على إيقاع هادي ♫", "A slower kind of night ♫"], "category": 2, "desc": ["موسيقى، قهوة، ومزاج رايق", "Music, coffee, and easy company."], "count": 86, "names": [4, 5, 6], "type": "cinema"}'::jsonb),
(NULL,3,'Game night with the crew 🎮',3,'game','{"id": 3, "title": ["تحدّي الشلة 🎮", "Game night with the crew 🎮"], "category": 3, "desc": ["أسئلة وكلمات… مين يكسب؟", "Questions, word challenges. Who’s in?"], "count": 64, "names": [2, 4, 7], "type": "game"}'::jsonb),
(NULL,4,'Let’s talk English ✦',4,'voice','{"id": 4, "title": ["Let’s talk English ✦", "Let’s talk English ✦"], "category": 4, "desc": ["نتعلم مع بعض، بدون أي تردد", "Learn together, one conversation at a time."], "count": 42, "names": [5, 2, 0], "type": "voice"}'::jsonb),
(NULL,5,'A little flash of connection ⚡',1,'flash','{"id": 5, "title": ["لحظة فلاش ⚡", "A little flash of connection ⚡"], "category": 1, "desc": ["سوالف عفوية، تعيش اللحظة", "Spontaneous conversations. Just for now."], "count": 12, "names": [6, 8], "type": "flash"}'::jsonb),
(NULL,6,'Voices worth hearing ✦',5,'echo','{"id": 6, "title": ["أصوات تستاهل تنسمع ✦", "Voices worth hearing ✦"], "category": 5, "desc": ["من سالفة بسيطة إلى بودكاست", "From a conversation to an episode."], "count": 57, "names": [3, 6, 8], "type": "echo"}'::jsonb);

-- Hearts are real rows, visible only while the underlying message is readable.
CREATE TABLE public.message_reactions(
 message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 emoji text NOT NULL DEFAULT '❤️' CHECK(emoji='❤️'),created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(message_id,user_id)
);
CREATE INDEX reactions_user ON public.message_reactions(user_id);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.message_reactions FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.message_reactions TO authenticated;
GRANT INSERT(message_id,user_id,emoji) ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
CREATE POLICY reactions_read ON public.message_reactions FOR SELECT TO authenticated USING((SELECT vibe_private.onboarding_complete()) AND EXISTS(SELECT 1 FROM public.messages WHERE id=message_id));
CREATE POLICY reactions_send ON public.message_reactions FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.onboarding_complete()) AND EXISTS(SELECT 1 FROM public.messages WHERE id=message_id));
CREATE POLICY reactions_delete ON public.message_reactions FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()) AND (SELECT vibe_private.active_session()));
NOTIFY pgrst,'reload schema';
CREATE FUNCTION public.vibe_inbox() RETURNS TABLE(peer_id uuid,last_at timestamptz,first_at timestamptz,unread bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH threads AS(SELECT CASE WHEN sender_id=auth.uid() THEN receiver_id ELSE sender_id END peer_id,max(created_at) last_at,min(created_at) first_at FROM public.messages WHERE room_id IS NULL GROUP BY 1),
 unread AS(SELECT actor_id,count(*) n FROM public.notifications WHERE read_at IS NULL GROUP BY actor_id)
 SELECT t.peer_id,t.last_at,t.first_at,coalesce(u.n,0) FROM threads t LEFT JOIN unread u ON u.actor_id=t.peer_id ORDER BY t.last_at DESC LIMIT 100;
$$;
REVOKE ALL ON FUNCTION public.vibe_inbox() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.vibe_inbox() TO authenticated;
-- Preserve valid questionnaire answers already saved by the previous version.
INSERT INTO public.user_interests(user_id,category,value)
SELECT p.id,k.category,(CASE WHEN v.item::text ~ '^[0-9]{1,2}$' THEN v.item::text::smallint ELSE -1 END)
FROM public.vibe_profiles p CROSS JOIN(VALUES('nature',6),('interests',24),('types',12)) k(category,max_value)
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.data->k.category)='array' THEN p.data->k.category ELSE '[]'::jsonb END) v(item)
WHERE jsonb_typeof(v.item)='number' AND v.item::text ~ '^[0-9]{1,2}$'
AND (CASE WHEN v.item::text ~ '^[0-9]{1,2}$' THEN v.item::text::numeric ELSE -1 END)>=0 AND (CASE WHEN v.item::text ~ '^[0-9]{1,2}$' THEN v.item::text::numeric ELSE -1 END)<k.max_value
ON CONFLICT DO NOTHING;
UPDATE public.profiles p SET onboarding_step=3,onboarding_completed_at=statement_timestamp()
WHERE (SELECT count(DISTINCT category) FROM public.user_interests WHERE user_id=p.id)=3;
NOTIFY pgrst,'reload schema';

