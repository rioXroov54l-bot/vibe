# Release Readiness Status

**Status date:** 2026-09-21. The final verdict section is authoritative.

## READY IN PRODUCT

- User-facing legal center.
- Report/block UI, connected reporting, report privacy restriction.
- In-app data export.
- Account deletion UI and server-side deletion endpoint code (requires SUPABASE_SERVICE_ROLE_KEY at runtime).
- Upload magic-byte validation.
- OTP login; profile, chat, media.
- Privacy/security controls: HTTPS/TLS, HttpOnly Secure SameSite cookies, AES-GCM Spotify refresh-token cookie, Supabase auth crypto.

## READY IN REPO / DOCS

- Data inventory; App Privacy draft; permissions matrix; age rating draft; App Review notes; App Store Connect checklist; retention, export, native-gap, asset, and regional readiness documents.

## REPOSITORY VALIDATION

- Repository checks cover web behavior and readiness documentation; they do not establish native binary or App Store readiness. Run them against the exact publication source.

## BLOCKED UNTIL RUNTIME CONFIG

- SUPABASE_SERVICE_ROLE_KEY — required for actual account deletion and reciprocal block. The secret value must never be committed.
- VIBE_MODERATION_BLOCKLIST — content-filter configuration.
- Production backend, Resend, and Spotify configuration as applicable.

## BLOCKED UNTIL NATIVE IOS VALIDATION

- A native iOS Xcode target, SwiftUI sources, Info.plist and initial PrivacyInfo.xcprivacy now exist.
- Signed archive, device QA, final privacy/API/SDK assessment, signing and TestFlight verification remain unverified. See NATIVE_IOS_GAP.md.

## MANUAL APP STORE CONNECT

- Metadata; privacy answers; age rating; screenshots/icon; demo credentials; review contact; availability; encryption answers; accessibility disclosures; release selection.

## OWNER INPUT REQUIRED

- Minimum age; legal entity/jurisdiction; moderation operations; retention periods; regions; business model.

## LEGAL REVIEW REQUIRED

- Regional obligations per docs/legal/REGIONAL_READINESS.md. No compliance is claimed.

## SECURITY / MODERATION OPS REQUIRED

- Moderation staffing, escalation, and response targets; retention enforcement; runtime secret management.

## Guideline mapping

- Apple 1.2 UGC — report/block/moderation controls present; operations still required.
- Apple 2.1 completeness — native signed binary and device validation remain unverified.
- Apple 3.1 payments — not applicable now (no live IAP; Vibe+ preview only); guardrail if monetization goes live.
- Apple 4.8 — not triggered by current first-party-only auth; no live social-login trigger for Sign in with Apple.
- Apple 5.1.1 privacy — deletion and privacy surfaces exist; initial native manifest requires an actual API/data/SDK assessment.

## Final verdict

"Repository/web validation must pass for the exact release source. App Store submission: BLOCKED until native iOS packaging, production runtime deletion/moderation configuration, owner/legal decisions, and manual App Store Connect tasks are complete."
