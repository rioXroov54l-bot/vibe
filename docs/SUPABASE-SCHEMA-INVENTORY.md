# Supabase public schema inventory

Generated from the live Supabase PostgREST OpenAPI schema on 2026-09-20.
This file documents structure only and contains no data or secrets.

## Tables and columns

| Table | Column | Type |
| --- | --- | --- |
| `vibe_profiles` | `id` | uuid |
| `vibe_profiles` | `display_name` | text |
| `vibe_profiles` | `bio` | text |
| `vibe_profiles` | `data` | jsonb |
| `vibe_profiles` | `created_at` | timestamptz |
| `vibe_settings` | `user_id` | uuid |
| `vibe_settings` | `data` | jsonb |
| `vibe_settings` | `theme` | text |
| `vibe_settings` | `smart_photos_enabled` | boolean |
| `vibe_settings` | `hide_age` | boolean |
| `vibe_settings` | `hide_distance` | boolean |
| `vibe_blocks` | `user_id` | uuid |
| `vibe_blocks` | `blocked_id` | uuid |
| `vibe_rooms` | `id` | uuid |
| `vibe_rooms` | `owner_id` | uuid |
| `vibe_rooms` | `title` | text |
| `vibe_rooms` | `category` | integer |
| `vibe_rooms` | `kind` | text |
| `vibe_rooms` | `created_at` | timestamptz |
| `vibe_rooms` | `legacy_id` | integer |
| `vibe_rooms` | `legacy_snapshot` | jsonb |
| `vibe_members` | `room_id` | uuid |
| `vibe_members` | `user_id` | uuid |
| `vibe_members` | `joined_at` | timestamptz |
| `messages` | `id` | uuid |
| `messages` | `sender_id` | uuid |
| `messages` | `room_id` | uuid |
| `messages` | `receiver_id` | uuid |
| `messages` | `kind` | text |
| `messages` | `content` | text |
| `messages` | `object_path` | text |
| `messages` | `created_at` | timestamptz |
| `message_reactions` | `message_id` | uuid |
| `message_reactions` | `user_id` | uuid |
| `message_reactions` | `emoji` | text |
| `message_reactions` | `created_at` | timestamptz |
| `notifications` | `id` | uuid |
| `notifications` | `user_id` | uuid |
| `notifications` | `actor_id` | uuid |
| `notifications` | `message_id` | uuid |
| `notifications` | `created_at` | timestamptz |
| `notifications` | `read_at` | timestamptz |
| `profiles` | `id` | uuid |
| `profiles` | `email` | text |
| `profiles` | `username` | text |
| `profiles` | `full_name` | text |
| `profiles` | `avatar_url` | text |
| `profiles` | `created_at` | timestamptz |
| `profiles` | `onboarding_step` | smallint |
| `profiles` | `onboarding_completed_at` | timestamptz |
| `user_interests` | `user_id` | uuid |
| `user_interests` | `category` | text |
| `user_interests` | `value` | smallint |
| `vibe_likes` | `user_id` | uuid |
| `vibe_likes` | `room_id` | uuid |
| `vibe_reports` | `id` | uuid |
| `vibe_reports` | `reporter_id` | uuid |
| `vibe_reports` | `target_kind` | text |
| `vibe_reports` | `target_id` | text |
| `vibe_reports` | `reason` | text |
| `vibe_reports` | `details` | text |
| `vibe_reports` | `status` | text |
| `vibe_reports` | `created_at` | timestamptz |
| `vibe_profile_details` | `user_id` | uuid |
| `vibe_profile_details` | `living_in` | text |
| `vibe_profile_details` | `height_cm` | smallint |
| `vibe_profile_details` | `job` | text |
| `vibe_profile_details` | `education` | text |
| `vibe_profile_details` | `basics` | jsonb |
| `vibe_profile_details` | `lifestyle` | jsonb |
| `vibe_profile_photos` | `user_id` | uuid |
| `vibe_profile_photos` | `slot` | smallint |
| `vibe_profile_photos` | `object_path` | text |
| `vibe_profile_photos` | `created_at` | timestamptz |
| `vibe_profile_prompts` | `user_id` | uuid |
| `vibe_profile_prompts` | `slot` | smallint |
| `vibe_profile_prompts` | `question` | text |
| `vibe_profile_prompts` | `answer` | text |

## RPC functions

- `rls_auto_enable`
- `vibe_inbox`
- `vibe_onboarding_status`
- `vibe_onboarding_step`
- `vibe_profile_completion`
- `vibe_session_valid`

## Observations

- The live messaging table is `messages`, not `vibe_messages`.
- The old committed `db/supabase-schema.sql` is incomplete and should not be
  reapplied to production.
- This inventory does not yet include constraints, indexes, or RLS policies;
  those require direct database-catalog access.
