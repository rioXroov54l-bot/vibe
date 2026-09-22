# Vibe — Security Architecture

This document describes the security model of the Vibe iOS app and its Supabase
backend, and the hardening that protects it from common attacks.

## 1. Secrets & keys

| Key | Where | Risk | Status |
|---|---|---|---|
| Supabase publishable (anon) key | `SupabaseClient.swift` | Public by design | ✅ Safe to ship |
| Supabase `service_role` key | Never in the app | Full DB access | ✅ Not present |
| Supabase Management token | Never in the app | Project admin | ✅ Not present |
| Session access/refresh tokens | Keychain (`SessionManager`) | Session hijack | ✅ Keychain only |

## 2. Network security

- **HTTPS only** — all traffic to `https://hsvcdyxelshvgofjvlim.supabase.co`.
- **SSL pinning** — the Supabase server public key is pinned in
  `SecurityManager.pinnedPublicKeyHash` and enforced by
  `PinnedURLSessionDelegate`, blocking man-in-the-middle attacks.
- **App Transport Security** — iOS enforces HTTPS by default; no ATS exceptions.

## 3. Local data protection

- Session tokens are stored in the **Keychain** with
  `kSecAttrAccessibleAfterFirstUnlock` (only readable after device unlock).
- The app enables **NSFileProtectionComplete** data protection, so the
  app's files are encrypted at rest.

## 4. Runtime integrity

- **Jailbreak detection** (`SecurityManager.isJailbroken`) checks for known
  jailbreak artifacts and sandbox escape.
- **Debugger detection** (`SecurityManager.isDebuggerAttached`) detects an
  attached debugger.

## 5. Authentication

- **6-digit OTP** — email verification uses exactly six numeric digits.
- **Password policy** — Supabase enforces length and leaked-password checks.
- **Sessions** — refresh tokens rotate through the Supabase Auth API and are
  stored only in the Keychain.
- **Email confirmation** is required (`mailer_autoconfirm = false`).

## 6. Supabase backend (Row Level Security)

- **RLS is enabled on every public table.**
- The `messages` table requires `vibe_private.onboarding_complete()`, which
  needs a confirmed active session, a completed profile, and interests across
  all three categories (`nature`, `interests`, `types`).
- Grants are scoped to the least privilege needed (see
  `db/migrations/20260922_onboarding_grants_and_policies.sql`).

## 7. Threat model (summary)

| Attack | Mitigation |
|---|---|
| Man-in-the-middle | SSL pinning + HTTPS |
| Session token theft | Keychain + file protection |
| Jailbroken device | Jailbreak detection |
| Debugging/tampering | Debugger detection |
| SQL injection | PostgREST parameterized queries + RLS |
| Unauthorized data access | RLS on every table |
| Brute force | Supabase rate limiting + password policy |
| OTP interception | 6-digit code + email confirmation |

## 8. Remaining owner actions

- Rotate the Supabase Management token exposed during development.
- Enable Supabase "leaked password protection" in Auth settings.
- Set up a custom SMTP provider with domain verification for delivery.
- Configure Sign in with Apple / Google for provider login.
