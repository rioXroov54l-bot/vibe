-- Vibe — Onboarding grants & RLS policies
-- Applied: 2026-09-22
-- Project: hsvcdyxelshvgofjvlim
--
-- Fixes the missing privileges/policies that prevented the iOS app from
-- completing onboarding and sending room chat messages.

-- ---------------------------------------------------------------------------
-- 1. user_interests — allow authenticated users to manage their own interests.
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;

-- The table only had a SELECT policy (`interests_own`), so INSERT/DELETE were
-- blocked by RLS. Add explicit per-user INSERT/DELETE policies (idempotent).
DROP POLICY IF EXISTS interests_insert ON public.user_interests;
CREATE POLICY interests_insert ON public.user_interests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS interests_delete ON public.user_interests;
CREATE POLICY interests_delete ON public.user_interests
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. profiles — allow the user to update their onboarding state.
-- ---------------------------------------------------------------------------

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. message_reactions — allow reactions in room chat.
-- ---------------------------------------------------------------------------

GRANT INSERT ON public.message_reactions TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. notifications — allow creating and marking notifications as read.
-- ---------------------------------------------------------------------------

GRANT INSERT, UPDATE ON public.notifications TO authenticated;
