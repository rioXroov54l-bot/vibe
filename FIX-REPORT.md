# Vibe Source Fix Report

Applied fixes:
- Unified browser authentication through same-origin `/api/cloud/auth/*` endpoints.
- Preserved HttpOnly cookie session model; browser no longer needs direct Supabase Auth calls for login/signup/OTP.
- Added server routes for email OTP sign-in and signup-code resend.
- Improved auth error mapping so server/origin/configuration failures are not all shown as a generic account-service error.
- Removed hard-coded deployment origin checks; POST origin validation now follows the current deployment origin.
- Recovery/signup redirect targets now follow the current deployment origin.
- Enabled camera permission for same-origin use while keeping microphone restricted to self.
- Restored richer Discovery presentation with Flash, Cinema, Games and Echo shortcuts while keeping room data connected to Supabase.
- Updated stale support/docs claims about real accounts, messages, reports, media and human support.
- Added regression tests for same-origin auth, dynamic origin behavior and camera permissions.

Verified locally:
- `npm test` PASS
- `npm run test:cinema` PASS
- `node tests/auth-flow.mjs` PASS
- JavaScript syntax checks PASS

Not completed because they require external provider/deployment access:
- Resend SMTP production credentials/domain verification in Supabase Auth.
- Spotify production OAuth credentials/integration.
- Enabling Supabase leaked-password protection in Auth settings.
- Publishing this source to the live hosting project and performing real-device/browser/iOS QA.

Database safety:
- No rooms, IDs or production data were deleted/recreated.
- No old `db/supabase-schema.sql` was reapplied to the live database.
- The existing `vibe_onboarding_step` SECURITY DEFINER function was inspected and left unchanged because it checks the authenticated active session and `auth.uid()` before writes.
