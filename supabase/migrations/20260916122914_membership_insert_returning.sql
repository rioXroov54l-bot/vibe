-- INSERT RETURNING must see the caller's newly created membership.
-- Other members remain visible only through room authorization.
ALTER POLICY members_read ON public.vibe_members
USING (user_id=(SELECT auth.uid()) OR vibe_private.room_access(room_id));
NOTIFY pgrst,'reload schema';

