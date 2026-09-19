# Vibe — Apple Age Rating Assessment (Feature-Based Draft)

**Status:** DRAFT — for internal review and product-owner sign-off. This document is **not** a final age rating and must not be represented as one. Apple's age rating is determined by the responses submitted in App Store Connect and by Apple's review team, not by this document.

**Scope:** Maps verified Vibe features to Apple's age-rating questionnaire categories. No rating value is asserted.

---

## 1. Product summary (verified)

Vibe is a social/UGC app with:

- Profiles and interests
- Rooms and room discovery
- Direct and room chat
- Photos, voice notes, reactions
- Notifications
- Reports and block controls

Vibe is **not** a media-streaming, gambling, or finance app. It hosts and surfaces user-generated content and interpersonal messaging.

---

## 2. Feature-to-questionnaire mapping

| Questionnaire area | Vibe answer (evidence-based) | Notes |
|---|---|---|
| User-generated content | **Yes** — profiles, room content, photos, voice notes, messages | Core product behavior; implies Apple's UGC obligations (filter, report, block, contact info) |
| Messaging / chat | **Yes** — direct and room chat | Includes text and voice notes |
| Photos / camera / gallery | **Yes** — user-supplied images | |
| Audio | **Yes, conditional** — voice notes exist | **No live voice streaming** is implemented. Do not answer as if live audio streaming exists. |
| Social discovery / room discovery | **Yes** — discovery surfaces exist | Current code ships **adult-oriented discovery defaults** (e.g. `ageMin` 18). This is a product configuration, not a legal determination. |
| Mature / suggestive themes | **Possible via UGC** — not supplied by Vibe itself | Risk depends on user behavior and moderation efficacy; see §4 |
| Profanity | **Possible via UGC** — not supplied by Vibe itself | Deterministic moderation filter supports `VIBE_MODERATION_BLOCKLIST` |
| Violence | **Not supplied by Vibe** — possible via UGC | No first-party violent content evidenced |
| Sexual content / nudity | **Not supplied by Vibe** — possible via UGC | Risk mitigated only by reporting/blocking plus blocklist filter |
| Gambling / contests / chance | **None evidenced** | No gambling, loot box, or chance-based mechanic evidenced |
| Unrestricted web access | **No** — app is native web-view/application surface without an open browser | Links and media may be provided by third-party providers; treat as **conditional** |
| Links out / third-party media providers | **Conditional** | Any external link or embedded provider content must be reviewed before submission |
| Parental controls | **None implemented** | No parental gate or family controls |
| Age assurance / age verification | **Not implemented** | No age-assurance mechanism in the shipping product |
| Account management | **Yes** — account required for social identity | Account deletion backend exists (see `DATA_RETENTION.md`) |
| Report / block | **Yes** — live in connected app | |

---

## 3. PRODUCT_OWNER_DECISION_REQUIRED

The following decisions are **not made** and are required before submission:

1. **PRODUCT_OWNER_DECISION_REQUIRED — Minimum age for Vibe accounts.** No final legal minimum age has been decided. Current discovery defaults (`ageMin` 18) and some prior Terms text referencing adults 18+ are **implementation/legacy artifacts**, not a finalized legal position. Apple's minimum-age answer cannot be finalized until the owner decides.
2. **PRODUCT_OWNER_DECISION_REQUIRED — Whether Vibe is intentionally an 18+ product.** If yes, that has consequences for age rating, eligibility filtering, moderation intensity, and marketing claims. If no, discovery defaults and Terms must be reconciled and minors-safety controls strengthened.
3. **OWNER_LEGAL_DECISION_REQUIRED — Alignment of in-app Terms, privacy policy, and store listing with the chosen minimum age.**

Until these are resolved, the age-rating questionnaire should be treated as **unanswerable in final form**.

---

## 4. Rating risk assessment

Social, chat, and UGC apps are frequently rated **higher** than the developer expects because Apple weighs:

- Presence of chat and direct messaging
- Unmoderated or lightly moderated UGC
- Ability for users to upload images and audio
- Social discovery that connects strangers

**Deterministic factors:**
- Moderation is currently limited to a deterministic blocklist filter (`VIBE_MODERATION_BLOCKLIST`).
- Reports and blocking are live.
- **Operations/moderation staffing and SLA are not defined.** Without a defined escalation and response process, the effective protection level is lower than what the questionnaire answers imply.

**Conclusion:** The rating will depend on the exact questionnaire answers *and* on demonstrated moderation capability. Vibe should not assume a low rating.

---

## 5. Minors safety checklist (pre-submission)

- [ ] Minimum age decided by product owner and enforced consistently in onboarding, discovery defaults, and Terms.
- [ ] Age representation at signup captured and stored.
- [ ] Discovery defaults reconciled with the chosen minimum age.
- [ ] Terms and privacy policy consistent with the chosen minimum age.
- [ ] Report flows reachable from every UGC surface (profiles, rooms, messages, media).
- [ ] Block controls reachable and effective across chat, room membership, and discovery.
- [ ] Moderation blocklist maintained and reviewed on a schedule.
- [ ] Escalation path defined for child-safety and sexual-exploitation reports.
- [ ] Support contact (`support@vibe-groups.com`) monitored, with staffing and SLA defined.
- [ ] No marketing or screenshots implying a younger audience than the rated minimum.
- [ ] Reviewer notes explain age handling accurately.

---

## 6. Grooming / sexual exploitation escalation — operational requirement

**REQUIRED BEFORE PRODUCTION:** Vibe must have a defined operational process for child-safety and sexual-exploitation reports, including:

1. Named responsible owner and staffing coverage.
2. Intake channel and triage timeline for reports involving minors or suspected grooming.
3. Escalation route to appropriate authorities/legal counsel per jurisdiction.
4. Evidence preservation steps that do not conflict with deletion behavior described in `DATA_RETENTION.md` (note: reports targeting a deleted account are anonymized and retained as a safety record).
5. Documented review cadence and record-keeping.

This process is **not yet defined** and is a product/operations owner action.

---

## 7. Explicit non-statements

- **No final rating is stated or implied.** Draft only.
- **No final legal minimum age is stated.**
- No claim is made that Vibe is currently compliant with any specific rating tier.
- Absence of first-party mature content does **not** mean the rating will be low, given UGC and messaging.
