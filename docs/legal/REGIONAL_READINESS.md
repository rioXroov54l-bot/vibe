# Regional Legal Readiness Map

**Status:** Product-capability map prepared for legal review.
**This document does not claim legal compliance in any jurisdiction.** Every item requires review by qualified counsel for the relevant region.

## 1. Capabilities relevant to obligations

- User accounts (first-party email/password/OTP), profiles, private chat, media (camera, gallery, voice notes).
- User-generated content: rooms, Cinema/Games/Flash/Echo, reports, blocks.
- Data export (in-app) and account deletion (server-side endpoint requiring SUPABASE_SERVICE_ROLE_KEY).
- Moderation: report/block UI, connected reporting, report privacy restriction, deterministic moderation blocklist via VIBE_MODERATION_BLOCKLIST.
- In-product legal center and privacy policy surfaces.

## 2. Likely obligations to review (mapping, not conclusion)

### GDPR / UK GDPR
- Transparency, lawful basis, access/export, deletion, correction, consent where applicable.
- Processor agreements (DPA) for Supabase and other vendors.
- Retention periods and data minimization.
- Minors and age-related duties.

### CCPA / CPRA
- Notice, access, delete, correct.
- Sale/share analysis. Current evidence shows no ads and no cross-company tracking, but counsel must verify the classification.

### EU DSA
- UGC reporting, moderation, appeals, contact point, transparency reporting — if scope applies.

### UK Online Safety
- UGC, minors, risk assessment, moderation duties — if the service and scope apply.

### Saudi/KSA and other regions
- Privacy, content, and cyber requirements need local counsel. **Do not invent or assert PDPL compliance.**

## 3. Universal controls already useful

Report/block, in-app data export, account deletion, privacy policy, retention matrix, safety guidelines.

## 4. Operations / legal gaps

Retention schedule enforcement; defined appeal process; moderation staffing and SLAs; designated copyright contact; age assurance approach; regional counsel engagement; DPA execution.
