# Supabase health report

Generated: 2026-09-20
Status: production stabilization in progress

## Project

- Ref: `hsvcdyxelshvgofjvlim`
- Region: `eu-west-1`
- PostgreSQL: `17.6.1.166`
- Status: `ACTIVE_HEALTHY`

## Database catalog

- Public tables: 15
- RLS policies: 55
- Constraints: 86
- Indexes: 53
- Public routines: 6
- Triggers: 9

## Storage

- Bucket: `vibe-media`
- Public: false
- File size limit: 8 MB
- Allowed MIME types: JPEG, PNG, WebP, WebM, audio MP4, OGG, MPEG, video MP4

## Authentication

- Email/OTP signup and recovery enabled.
- Site URL corrected to the production ChatGPT Sites URL.
- Password minimum length corrected to 8.
- OTP expiry corrected to 10 minutes.
- Refresh token rotation enabled.
- Leaked-password protection remains platform-controlled and is currently not
  enabled.

## RLS findings

- `messages` uses restrictive onboarding/session policies plus room, block, and
  direct-message checks.
- `profiles` is private and self-only.
- `vibe_profiles` is the public directory with block and onboarding checks.
- Profile details, photos, and prompts are self-owned with public read after
  onboarding.
- Notifications are self-owned and block-aware.
- Storage `vibe-media` uses path ownership and session checks.

No data was deleted or overwritten during this audit.

## Completed fixes

- Corrected report status from unsupported `open` to `received`.
- Broadened report target kinds for legal/copyright/privacy reports.
- Deprecated the obsolete legacy schema file.
- Imported all live Supabase migrations into GitHub.
- Registered local migrations in Supabase.
- Added profile search performance index.
- Corrected Supabase Auth site URL and password policy.

## Remaining production items

- Configure production runtime secrets.
- Verify account deletion end-to-end.
- Add live integration tests.
- Implement or explicitly disable realtime messaging.
- Add upload/message idempotency.
- Feature-flag or remove demo-only Vibe+ surfaces.
