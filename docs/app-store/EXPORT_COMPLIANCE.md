# Export Compliance — Cryptographic Inventory

**Status:** Draft inventory prepared for App Store Connect readiness.
**Scope:** Web/product cryptography currently in use. No native iOS target or Xcode project exists in this repository.

**This document makes no ECCN, exemption, self-classification, or legal classification claim.** The export determination is an owner/legal action, not an engineering one.

## 1. Cryptography currently in use

| Area | Implementation | Notes |
| --- | --- | --- |
| Transport | HTTPS / TLS | All client-server traffic |
| Authentication and sessions | Supabase auth crypto (tokens, session handling) | First-party email/password/OTP login only |
| Spotify refresh token | AES-GCM encrypted cookie | HttpOnly, Secure, SameSite |

- Vibe implements no proprietary or custom cryptography.
- No cryptography was weakened, removed, or downgraded for App Store preparation.
- The runtime service-role secret value must never be committed.

## 2. Apple export-encryption questions

App Store Connect asks whether the app uses encryption and whether an exemption applies, with supporting documentation where required.

**OWNER/LEGAL_ACTION required:**
- Determine the correct answer and any supporting documentation.
- Confirm whether a standard exemption applies for HTTPS/TLS and OS-provided crypto.
- Approve the final answer before submission.

No answer has been drafted, decided, or submitted.

## 3. Constraints

- Do not weaken the crypto stack (TLS, Supabase auth crypto, AES-GCM cookie) to simplify export answers.
- Any Info.plist or export-compliance setting for the native build is added only after counsel/owner confirmation.

## 4. Open items

- [ ] Owner/legal classification decision.
- [ ] App Store Connect encryption answers drafted and approved.
- [ ] Native-build encryption/export settings documented once an iOS target exists.
