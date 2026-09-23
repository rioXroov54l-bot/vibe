-- Vibe — Temporary room lifecycle & automated expiry
-- Applied: 2026-09-23
-- Project: hsvcdyxelshvgofjvlim
-- User-created rooms are temporary and live in the lower dynamic feed.
-- Presence is represented by vibe_members rows. When the final member leaves
-- a temporary room (active_listeners == 0), the room is deleted. Deleting a
-- room cascades to its members, messages and likes via existing FKs.
ALTER TABLE public.vibe_rooms
  ADD COLUMN IF NOT EXISTS is_anchor boolean NOT NULL DEFAULT false;
UPDATE public.vibe_rooms
SET is_anchor = true
WHERE id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005'
);
CREATE OR REPLACE FUNCTION vibe_private.expire_empty_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.vibe_members WHERE room_id = OLD.room_id
  ) THEN
    DELETE FROM public.vibe_rooms
    WHERE id = OLD.room_id
      AND is_anchor = false;
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS expire_empty_room ON public.vibe_members;
CREATE TRIGGER expire_empty_room
AFTER DELETE ON public.vibe_members
FOR EACH ROW
EXECUTE FUNCTION vibe_private.expire_empty_room();
