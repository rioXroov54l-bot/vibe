-- Vibe — Backfill onboarding state for accounts the app already considers complete
-- Applied: 2026-09-23
-- Project: hsvcdyxelshvgofjvlim
--
-- Root cause: the app's "onboarding complete" signal
-- (`preferences.onboarding_completed`) was written by an earlier onboarding flow,
-- but the RLS `onboarding_required` policy reads a different signal
-- (`profiles.onboarding_step = 3` + `onboarding_completed_at` + three
-- `user_interests` categories). Accounts onboarded before those writes existed
-- are left in a state where the app skips onboarding but RLS still blocks social
-- actions (create room / join / send message).
--
-- This backfill aligns the RLS signal with the app's existing belief for those
-- accounts. It is idempotent.

UPDATE public.profiles p
SET onboarding_step = 3,
    onboarding_completed_at = COALESCE(p.onboarding_completed_at, statement_timestamp())
FROM public.preferences pr
WHERE pr.user_id = p.id
  AND pr.onboarding_completed = true
  AND (p.onboarding_step IS DISTINCT FROM 3 OR p.onboarding_completed_at IS NULL);

INSERT INTO public.user_interests (user_id, category, value)
SELECT pr.user_id, cat.category, 0
FROM public.preferences pr
CROSS JOIN (VALUES ('nature'), ('interests'), ('types')) AS cat(category)
WHERE pr.onboarding_completed = true
ON CONFLICT (user_id, category, value) DO NOTHING;
