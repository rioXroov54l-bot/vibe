# Vibe — App Review Notes (Draft)

**Status:** DRAFT — owner review required before submission. Not yet submittable.

---

## 1. What Vibe is

Vibe is a social app. People create a profile, join rooms, and talk with others.

Verified feature set:

- Social rooms and room discovery
- Private (direct) chat and room chat
- Profiles and interests
- Images and voice notes
- Reactions
- Notifications
- Reports and block controls
- Modules: Cinema, Games, Flash, Echo

**No live monetization.** Vibe+ is a **preview**; the purchase button is **disabled**. There is no live IAP.

**No live voice streaming.** Voice **notes** exist. This must not be described as live audio calling/streaming in review notes or the store listing.

---

## 2. Why an account is required

An account is required for:

- Social identity — the profile and its interests are the object of discovery and interaction.
- Message access controls — chat must be tied to an authenticated identity so access, blocking, and reporting can be enforced.
- Report and block integrity — actions must be attributable and persistent.
- Profile persistence — interests, media, and history must survive sessions.

No guest or anonymous browsing mode is offered.

---

## 3. Demo reviewer credentials

**OWNER_ACTION_REQUIRED:** Provide demo account credentials in App Store Connect review notes before submission.

- Supply a dedicated reviewer account that exercises the full flow (rooms, chat, media, report/block, export/delete).
- Supply a second account, if needed, to demonstrate chat between two users.
- Credentials are entered **only** in App Store Connect. **Do not commit real credentials to this repository or any document.**

---

## 4. Reviewer path (suggested)

1. **Signup / login** — account creation via first-party **email + password / OTP**. There is no live Google or Facebook primary login. In-app UI may mention Google or Apple as **not connected**; this is informational and not a live third-party login.
2. **Onboarding** — profile setup and interests.
3. **Discovery / rooms** — find and open a room.
4. **Chat** — direct and room chat.
5. **Media** — camera, gallery, voice note.
6. **Profile** — view and edit.
7. **Report / block** — from profiles, rooms, chat, and media surfaces.
8. **Settings > Account & data** — data export and account deletion.
9. **Privacy / legal pages** — accessible from Settings and/or onboarding.

---

## 5. Backend dependencies

- **Supabase** — primary backend (auth, data, media).
- **Resend** — email delivery for OTP/transactional email.
- **Spotify** — **optional** integration; the app functions without connecting Spotify.
- **Support** — `support@vibe-groups.com` exists in current product code. Legal entity, address, and jurisdiction are **OWNER_LEGAL_DECISION_REQUIRED**.

Reviewer should not be required to connect Spotify or any third-party account.

---

## 6. Account deletion

- Account deletion backend **exists**.
- It **requires the runtime `SUPABASE_SERVICE_ROLE_KEY`** to be configured in the production environment before App Review. If not configured, deletion may fail at runtime — this is a **submission blocker**.
- **The reviewer must be able to complete account deletion end-to-end.** Verify this in the production/TestFlight build before submission.
- Behavior (consistent with the compliance endpoint): deletes account, profile, media, and messages; the user's own reports are deleted; reports targeting the deleted account are anonymized and retained as a safety record; the auth user is removed when the service-role runtime is configured.

---

## 7. Admin surfaces

**System Control Center** is **hidden and admin-only**. It is not consumer navigation and is not part of the reviewer path. It must not be reachable by a standard reviewer account.

---

## 8. Monetization

- **No live IAP currently.**
- Vibe+ is a preview with the purchase button disabled.
- **Guardrail:** if digital subscriptions or digital features are enabled, StoreKit/IAP review is required, and external checkout must never be used to hide or bypass in-app purchase requirements.

---

## 9. Support contact

`support@vibe-groups.com` — present in current product code. Confirm it is monitored and that staffing/SLA for safety reports is defined (currently **not defined**).

---

## 10. Submission blockers (owner action)

1. **Native submission blocker:** **No native iOS target exists.** An iOS app target, bundle ID, SKU, team, certificates, and provisioning must be created before any App Store submission.
2. **TestFlight packaging** must be produced from that native target — owner action.
3. `SUPABASE_SERVICE_ROLE_KEY` configured in production runtime (account deletion).
4. Demo reviewer credentials supplied.
5. **OWNER_LEGAL_DECISION_REQUIRED:** legal entity/address/jurisdiction finalization for privacy policy, Terms, and support.
6. PRODUCT_OWNER_DECISION_REQUIRED: minimum age (see `AGE_RATING.md`).

---

## 11. Accuracy statement

These notes intentionally avoid overstating capability. There is no live IAP, no live voice streaming, no native push/APNs, and no advertising or cross-company tracking evidenced. Reviewers must not be led to expect features Vibe does not ship.
