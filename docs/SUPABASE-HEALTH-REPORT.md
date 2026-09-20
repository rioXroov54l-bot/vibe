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
- Added idempotent message client ids.
- Restored missing `service_role` privileges required for account deletion.

## Live smoke test

- Created a disposable email-confirmed test user with the service role.
- Verified password login returned an access token.
- Verified the user’s `vibe_profiles` row was provisioned and readable.
- Deleted the test user successfully with the service role.

Result: pass. No test data remained.

## Account deletion smoke test

- Created a disposable email-confirmed test user.
- Logged in and called the local Worker `/api/cloud/account-delete` endpoint with
  the service-role runtime key.
- Initially failed with `account_deletion_failed` because `service_role` lacked
  DELETE privileges on several profile tables.
- Applied `20260920000005_restore_service_role_grants.sql`.
- Re-ran deletion and received `200 {"ok":true,"deleted":true}`.

Result: pass. No test data remained.

## Live integration test

`npm run test:live` now exercises the deployed Supabase project and Worker
contract for:

- test-user creation and password login
- profile read/update
- onboarding completion
- profile media upload and photo registration
- room creation and membership
- room messaging and reactions
- direct messages and inbox

Result: pass. Test users are deleted after the run.

## Realtime status

Realtime messaging is not enabled. The web client currently polls message state
and does not claim live multi-user streaming. This is the intended disabled
state until Supabase Realtime is implemented.

## Remaining production items

- Configure production runtime secrets.
- Verify account deletion end-to-end.
- Add live integration tests.
- Implement or explicitly disable realtime messaging.
- Feature-flag or remove demo-only Vibe+ surfaces.
