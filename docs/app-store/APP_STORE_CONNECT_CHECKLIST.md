# Vibe — App Store Connect Submission Checklist (Manual)

**Status:** DRAFT checklist. Items marked **OWNER_ACTION_REQUIRED**, **OWNER_LEGAL_DECISION_REQUIRED**, or **PRODUCT_OWNER_DECISION_REQUIRED** cannot be completed by engineering alone.

---

## 0. Prerequisites / blockers

- [ ] **Native iOS target created** — **no native iOS target currently exists.** Required before anything below can be submitted.
- [ ] Bundle ID, SKU, Apple Developer team, certificates, provisioning profiles — **OWNER_ACTION_REQUIRED** (none exist).
- [ ] TestFlight build produced and tested — **OWNER_ACTION_REQUIRED**.
- [ ] Production backend live and reachable (Supabase, Resend).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured in production runtime so account deletion works.
- [ ] Demo reviewer credentials prepared (entered only in App Store Connect; never committed).

---

## 1. Store listing copy (draft — actual Vibe features only)

### App name
Draft: `Vibe` (final name — **OWNER_ACTION_REQUIRED**; confirm no trademark conflict).

### Subtitle (draft, ≤30 chars target)
Draft: `Social rooms & real talk`

### Description (draft)
> Vibe is a social app for joining rooms, meeting people, and talking in the moment.
>
> - Discover and join social rooms
> - Chat privately or in rooms
> - Build a profile around your interests
> - Share photos and voice notes
> - React to what's happening
> - Modules including Cinema, Games, Flash, and Echo
> - Report and block tools built into every surface
>
> Vibe+ is currently a preview and is not available for purchase.

**Do not claim:** live voice streaming, live subscriptions/IAP, native push notifications, or features not shipped.

### Promotional text (draft, ≤170 chars)
Draft: `Join rooms, share your interests, and talk with people who are into the same things. Report and block tools are built in.`

---

## 2. Keywords (draft)

Suggestion: `social,chat,rooms,community,friends,voice notes,profiles,interests,meet,hangout`

- No competitor names, no trademarked terms, no unrelated high-volume terms.

---

## 3. Categories

**SUGGESTION** (not final; owner must choose):
- Primary: **Social Networking**
- Secondary: **Lifestyle** or **Entertainment** (Cinema/Games modules)

---

## 4. URLs

- [ ] Privacy Policy URL — **OWNER_LEGAL_DECISION_REQUIRED** (legal entity/jurisdiction).
- [ ] Support URL — must not be a placeholder.
- [ ] Marketing URL (optional but recommended).
- [ ] **No placeholder URLs.** Every URL must resolve and show the final content.

---

## 5. Legal

- [ ] Copyright holder string (e.g. `2025 <Legal Entity>`) — **OWNER_LEGAL_DECISION_REQUIRED**.
- [ ] Terms of Service consistent with the decided minimum age.
- [ ] Support email `support@vibe-groups.com` confirmed monitored.

---

## 6. App record

- [ ] Bundle ID.
- [ ] SKU — **OWNER_ACTION_REQUIRED**.
- [ ] Version and build number.
- [ ] Primary language: **Arabic and English** (localization below).
- [ ] Pricing: **Free** (no live monetization).

---

## 7. Availability

- [ ] Country/region selection — **OWNER_ACTION_REQUIRED**. Consider that adult-oriented discovery defaults and an undecided minimum age make broad distribution a legal/product risk.

---

## 8. Age rating

- [ ] Complete Apple's age-rating questionnaire using `docs/app-store/AGE_RATING.md` as the feature map.
- [ ] **PRODUCT_OWNER_DECISION_REQUIRED:** minimum age, and whether Vibe is intentionally 18+.
- [ ] **No final rating may be asserted** in marketing or metadata before Apple's questionnaire is completed.
- [ ] Ensure questionnaire answers match actual moderation capability.

---

## 9. App Privacy

- [ ] Complete App Privacy questionnaire against actual data flows (see `DATA_RETENTION.md`).
- [ ] Declare: account/email, profile/interests, photos/media, messages, reactions/memberships, notifications, blocks, reports/safety, support conversations, and — if enabled — Spotify connection data.
- [ ] **No advertising/cross-company tracking evidence** currently; do not declare tracking that does not exist, and do not omit it if a provider is later added.
- [ ] Confirm OpenAI/support features remain `store:false` and consented **only when enabled**.

---

## 10. Encryption / export compliance

- [ ] Answer export compliance questions (standard HTTPS/TLS usage only, as implemented).
- [ ] No custom/proprietary cryptography evidenced.

---

## 11. Content rights

- [ ] Confirm rights to all app content, icons, and any third-party media providers used.
- [ ] **Conditional:** links and media providers must be reviewed for rights and appropriateness.

---

## 12. Reviewer contact and demo

- [ ] Reviewer contact name/email/phone.
- [ ] Demo account credentials (reviewer must complete signup/login, chat, media, report/block, export, and **deletion**).
- [ ] Reviewer notes uploaded from `docs/app-store/APP_REVIEW_NOTES.md`.

---

## 13. Assets

- [ ] 1024×1024 app icon, no alpha, no rounded corners baked in.
- [ ] Screenshots for the required device matrix (current-generation iPhone; iPad only if the app supports iPad).
- [ ] Screenshots must show real app UI, not mockups of unshipped features.
- [ ] App previews — **optional**; only if genuine footage exists (**no live voice streaming footage should be implied if it does not exist**).

---

## 14. Localization

- [ ] **Arabic and English** strings complete and reviewed (RTL layout verified for Arabic).
- [ ] Store listing metadata localized for both, matching in-app claims.

---

## 15. Accessibility

- [ ] Disclose only what is evidenced: dynamic type support, VoiceOver labels, contrast, RTL support — verified per screen.
- [ ] Do not claim accessibility conformance that has not been tested.

---

## 16. TestFlight

- [ ] Internal testing build distributed.
- [ ] External testing (if used) with correct review notes.
- [ ] Beta feedback triaged, especially deletion and moderation failures.

---

## 17. Server readiness

- [ ] Production backend live, monitored, with alerting.
- [ ] Rate limiting / abuse controls reviewed.
- [ ] Email (Resend) delivery confirmed for OTP.
- [ ] **Spotify optional** — app must not break if Spotify is not connected.

---

## 18. Account deletion (must be tested)

- [ ] End-to-end deletion tested in the production/TestFlight build.
- [ ] Verification that the service-role runtime is configured so deletion completes.
- [ ] Verify deleted-account behavior matches `DATA_RETENTION.md` (own reports deleted; inbound reports anonymized and retained as safety record).

---

## 19. Moderation operations

- [ ] Moderation staffing/SLA defined (**currently not defined — OWNER_ACTION_REQUIRED**).
- [ ] `VIBE_MODERATION_BLOCKLIST` maintained and reviewed on a schedule.
- [ ] Child-safety escalation process defined (see `AGE_RATING.md` §6).
- [ ] Reports triaged within a documented window.

---

## 20. App Review notes

- [ ] Uploaded, accurate, and free of overstated capability.
- [ ] Documents native packaging status, deletion requirement, and admin surfaces.

---

## 21. Release

- [ ] Release mode chosen: manual, phased, or automatic — **OWNER_ACTION_REQUIRED**.
- [ ] Phased release recommended if moderation staffing is not yet defined.

---

## 22. Tooling / SDK

- [ ] Built with **Xcode 26 / current required SDK** and current App Store requirements.
- [ ] Confirm compliance with current Apple minimum SDK enforcement at submission time.

---

## 23. Monetization guardrail

> **If digital subscriptions or digital features are turned on (including Vibe+ becoming purchasable), StoreKit / in-app purchase review is required.** External checkout must never be used to avoid or hide in-app purchase requirements. Vibe+ is currently a preview with the purchase button disabled — keep it that way until StoreKit is implemented and reviewed.

---

## 24. Sign-in guardrail

> **If a third-party primary login (Google, Facebook, etc.) is introduced, guideline 4.8 / Sign in with Apple must be reevaluated.** Currently, authentication is first-party email/password/OTP only. In-app UI may mention Google or Apple as **not connected**; that does not trigger the requirement. No live Google/Facebook primary login exists.
