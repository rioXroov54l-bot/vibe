# Vibe — Supabase Database Setup

This folder documents the Supabase database configuration required for the
Vibe iOS app to work end-to-end.

## Project

- Reference: `hsvcdyxelshvgofjvlim`
- URL: `https://hsvcdyxelshvgofjvlim.supabase.co`

## Migrations

- `migrations/20260922_onboarding_grants_and_policies.sql`

  Applies the missing table privileges and row-level-security (RLS) policies
  required for the onboarding flow and live chat to work.

  **Why:** the live database was missing `INSERT`/`UPDATE` privileges on
  `user_interests` and `profiles`, and `user_interests` had no INSERT/DELETE
  RLS policy. Without these, the app could not save onboarding selections or
  mark onboarding complete, which blocked the `messages.onboarding_required`
  policy from allowing chat sends.

## Applying a migration

Run it in the Supabase SQL Editor (Dashboard → SQL Editor), or via the
Management API:

```bash
curl -X POST "https://api.supabase.com/v1/projects/hsvcdyxelshvgofjvlim/database/query" \
  -H "Authorization: Bearer <management-token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "<SQL here>"}'
```

## Onboarding completion contract

The `messages` table enforces onboarding completion through the
`vibe_private.onboarding_complete()` function, which requires **all three**:

1. `vibe_private.active_session()` is true (a real, confirmed, non-banned session).
2. A `profiles` row with `onboarding_step = 3` and `onboarding_completed_at` set.
3. `user_interests` has exactly 3 distinct `category` values
   (`nature`, `interests`, `types`).

The app writes these in `saveOnboarding`:

- `vibe_profiles` (profile display name / bio / data) — UPDATE
- `preferences` (selected interests + onboarding flag) — INSERT
- `user_interests` (nature/interests/types categories) — INSERT
- `profiles` (onboarding_step + onboarding_completed_at) — UPDATE
