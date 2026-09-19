# App Privacy Label Mapping (Draft)

Status: DRAFT for owner review. Not a final submission posture.
Scope: "Vibe" (repo rioXroov54l-bot/vibe, branch deepseek/release-readiness).
Evidence base: verified current runtime facts (see `docs/app-store/data-inventory.json`).
Native iOS target: **not present in repository** — see `docs/app-store/NATIVE_IOS_GAP.md`.

This document maps current runtime data behavior to Apple's App Privacy
("Data Not Collected" / "Data Linked to You" / "Data Used to Track You")
answer categories. It reflects code/runtime evidence only. It does not claim
blanket GDPR/CCPA compliance, and it does not claim "Data Not Collected" for
any data the app demonstrably handles.

---

## 1. Tracking Assessment

- Current evidence: `tracking_evidence = none_in_current_runtime`.
- No advertising SDKs, no IDFA usage, no cross-company tracking, no location
  collection, no contact-book upload, no purchase data, no live IAP.
- Therefore, per current evidence: **Not Tracking**.

### App Tracking Transparency (ATT) assessment

- ATT is **not triggered by current evidence**. No tracking across apps/websites
  owned by other companies, no data broker sharing, no targeted advertising.
- `NSUserTrackingUsageDescription` is **not required by current behavior**.
- Re-evaluate if any of the following are added: advertising/ad SDKs, IDFA access,
  analytics that link user data with third-party data for targeting, data broker
  integrations, or cross-app/website attribution. Adding any of these requires
  updating App Store Connect tracking disclosure and enabling ATT.

---

## 2. Collected and Linked to Identity

These categories are handled by the app and are linked to an authenticated account.

| Data type (Apple label) | Evidence / source | Notes |
| --- | --- | --- |
| Contact Info — Email Address | Supabase Auth email sign-up/OTP; Resend transactional delivery | Account creation + auth |
| Identifiers — User ID | Supabase account id keying all app tables | Auth/account identity |
| User Content — Messages | `messages` table (direct + room) | User-authored content |
| User Content — Photos or Videos | profile photos, chat images (Supabase Storage) | User-selected/uploaded |
| User Content — Audio Data | voice notes (student/user-recorded, user-initiated) | Microphone, user-initiated |
| User Content — Other User Content | profile name/bio/avatar, prompts, interests, rooms/memberships, reactions/likes, blocks, reports | App content |
| Contact Info — Name | profile display name | User-entered |
| Customer Support | reports + support requests (and AI support content when enabled) | Support/MSG content |

## 3. Diagnostics

- **Do not claim** Diagnostics collection unless production evidence is produced.
- No verified crash/analytics/performance SDK or collection path is present in the
  current repository. If a crash or analytics SDK is later added in the native
  target or web build, update this section and the App Privacy answers accordingly.

## 4. Not Collected per Current Evidence

| Category | Reason |
| --- | --- |
| Location | Not collected; `Permissions-Policy` sets `geolocation` disabled |
| Contacts | Not connected; no contact-book upload; do not request |
| Purchases | Vibe+ is preview/no-charge; purchase disabled; no live IAP |
| Advertising Data | No ad SDKs |
| Browsing History | None in current runtime |
| Financial Info | None in current runtime |
| Health & Fitness | None in current runtime |
| Sensitive Info | None in current runtime |
| Search History | None in current runtime |
| Tracking Data | `none_in_current_runtime` |

## 5. Conditional Third Parties

These processors receive data only under the conditions described. Confirm each
in production configuration before completion.

| Third party | Data | Condition |
| --- | --- | --- |
| Supabase | Auth, database, storage, realtime data | Always (core backend) |
| Resend | Email address + OTP/auth email delivery metadata | Auth/OTP flows |
| Spotify | Spotify connection metadata; top artists returned | Only when user connects Spotify (optional) |
| OpenAI | Support conversation context | Only when `SUPPORT_ENABLED` is set, the signed-in user is allowlisted, and explicit consent is given; request uses `store:false` |

## 6. Sale / Advertising Position

- Based on current code only: **no data sale, no advertising use, no
  cross-context behavioral advertising**. Do not claim otherwise positive
  advertising features. This is a code-evidence statement, not a legal
  certification.

## 7. Retention

- Default: "while account/service record exists; exact operational retention
  OWNER_LEGAL_DECISION_REQUIRED."
- No specific retention days should be entered into App Store Connect until the
  owner finalizes retention policy.

## 8. Deletion Behavior

- Account deletion backend exists but **requires runtime `SUPABASE_SERVICE_ROLE_KEY`**
  to be configured before it can execute in production. Verify this key is set and
  the deletion path is tested end-to-end.
- User data export exists.
- User can delete own messages/media where supported, unblock, edit profile and
  interests, disconnect Spotify, and decline AI support.

## 9. Required Owner Verification Before Submission

1. Verify production configuration matches this document (Supabase, Resend,
   Spotify, OpenAI flags, `SUPPORT_ENABLED`, `VIBE_MODERATION_BLOCKLIST`,
   `SUPABASE_SERVICE_ROLE_KEY`).
2. Confirm Apple's current App Privacy definitions against this mapping; Apple
   definitions supersede internal labels.
3. Confirm whether any diagnostics/analytics/crash collection exists in the
   production build — if none, do not claim it; if any, add it.
4. Finalize legal minimum age. Adult-oriented discovery settings exist in product
   code, but the legal minimum age is **not finalized by the owner**. Age rating
   and any related privacy answers must be set after that decision.
5. Do not claim blanket GDPR/CCPA compliance in metadata or UI.

## 10. App Store Connect Manual Action Checklist

- [ ] Enter App Privacy answers consistent with this mapping (Data Linked to You:
      contact info/email, identifiers, user content, profile data/interests,
      customer support).
- [ ] Confirm "Data Used to Track You": none (per current evidence).
- [ ] Confirm "Data Not Collected" items only where evidenced (see §4).
- [ ] Set age rating after minimum-age decision is finalized.
- [ ] Verify account deletion is reachable in-app and functional in production.
- [ ] Verify data export is reachable in-app.
- [ ] Enter support URL, marketing URL, and privacy policy URL.
- [ ] Confirm no ATT prompt is required; add one only if tracking is introduced.
- [ ] Confirm third-party SDKs (if any added later) declare privacy manifests and
      signatures.
- [ ] Re-verify this document against the production build immediately before
      submission.
