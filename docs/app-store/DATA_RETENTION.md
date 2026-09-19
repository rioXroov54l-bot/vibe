# Vibe — Data Retention and Deletion Matrix

**Status:** DRAFT. Describes **current technical behavior** only. No arbitrary retention periods are invented. Where a retention period or legal basis is undefined, the cell reads **OWNER_LEGAL_DECISION_REQUIRED**.

Account deletion behavior below reflects the existing compliance endpoint.

---

## Deletion behavior summary (compliance endpoint)

When a user deletes their account:

1. Account, profile, media, and messages are deleted.
2. The user's **own** reports are deleted.
3. Reports **targeting** the deleted account are **anonymized and retained** as a safety record.
4. The Supabase **auth user is removed only when the service-role runtime is configured** (`SUPABASE_SERVICE_ROLE_KEY` must be present in production).

---

## Matrix

| Category | Current technical retention evidence | Deletion trigger | Deletion behavior | Exceptions | User disclosure | Owner/legal decision |
|---|---|---|---|---|---|---|
| **Auth account / email** | Supabase auth user record; email used for login and OTP | User-initiated account deletion | Auth user removed **when service-role runtime is configured**; otherwise removal may not complete | None known | Must disclose identity data and deletion in privacy policy | **OWNER_LEGAL_DECISION_REQUIRED** — required retention for auth/audit, if any |
| **Profile (display name, bio, interests, details/prompts)** | Stored in Supabase profile tables | Account deletion; or user edits/deletes fields | Deleted with account | None known | Disclose in privacy policy | **OWNER_LEGAL_DECISION_REQUIRED** |
| **Photos / media uploads** | Stored in Supabase storage, referenced by profile/rooms/messages | Account deletion; or user removes item | Deleted with account/media removal | Copies may persist in backups — backup retention undefined | Disclose media storage and deletion | **OWNER_LEGAL_DECISION_REQUIRED** — backup retention window |
| **Messages (direct and room)** | Stored in Supabase | Account deletion | Deleted with account | Copies previously delivered to other users' clients cannot be recalled | Disclose messaging and deletion limits | **OWNER_LEGAL_DECISION_REQUIRED** |
| **Reactions / likes / memberships** | Stored as rows tied to user and target | Account deletion | Removed with account | Aggregated counts may remain | Disclose | **OWNER_LEGAL_DECISION_REQUIRED** |
| **Notifications** | In-app notification records | Account deletion | Removed with account | None known | Disclose | **OWNER_LEGAL_DECISION_REQUIRED** |
| **Blocks** | Block records linking users | Account deletion | Removed with account | None known | Disclose block feature and effect | **OWNER_LEGAL_DECISION_REQUIRED** |
| **Reports / safety records** | Report records with reporter and target | Account deletion | **Own reports deleted.** **Reports targeting the deleted account are anonymized and retained** as a safety record | Retained deliberately for safety/abuse-prevention | **Must disclose** that safety reports may be retained after deletion in anonymized form | **OWNER_LEGAL_DECISION_REQUIRED** — retention period and legal basis for safety records |
| **Spotify refresh cookie** | Cookie used for optional Spotify connection; **max-age currently 30 days in code** | User disconnects Spotify, or account deletion | Cleared on disconnect and on account deletion | Actual implementation detail; **Spotify terms verification required** | Disclose optional Spotify connection and cookie handling | **OWNER_LEGAL_DECISION_REQUIRED** — confirm 30-day max-age and Spotify terms compliance |
| **Support conversation** | Support email `support@vibe-groups.com`; any support/assistant store `store:false` **only when the feature is enabled and consented** | n/a / manual | Manual handling; no automated retention policy defined | Provider retention and legal review still required even with `store:false` | Disclose support contact and any AI-assisted support usage | **OWNER_LEGAL_DECISION_REQUIRED** — provider retention and legal review |
| **Cinema session metadata** | Session metadata for the Cinema module | Account deletion / session expiry | Removed with account; session-scoped data expires per implementation | Session retention window undefined | Disclose media/session metadata | **OWNER_LEGAL_DECISION_REQUIRED** |

---

## Notes and constraints

- **Backups.** No backup retention window is defined. This is a **OWNER_LEGAL_DECISION_REQUIRED** item because it directly affects deletion promises made to users and to Apple.
- **Safety-record exception.** Anonymized retention of inbound reports is an intentional exception and must be disclosed explicitly in the privacy policy; otherwise the deletion claim is misleading.
- **Service-role dependency.** If `SUPABASE_SERVICE_ROLE_KEY` is not configured in production, account deletion is **incomplete**. This is a submission blocker.
- **Third-party providers.** Resend (email) and Supabase process data as sub-processors. Spotify is optional. Provider retention and DPA status are **OWNER_LEGAL_DECISION_REQUIRED**.
- **`store:false` is not a deletion guarantee.** It prevents provider-side storage of the request payload where supported, but provider-level logging/retention must still be verified under the provider's terms.
- **No tracking/advertising data** is evidenced in the current product; this matrix should be revisited if advertising or cross-company tracking is introduced.

---

## Related documents

- `docs/app-store/AGE_RATING.md` — age rating inputs and minors-safety requirements
- `docs/app-store/APP_REVIEW_NOTES.md` — reviewer-facing description of deletion
- `docs/app-store/APP_STORE_CONNECT_CHECKLIST.md` — App Privacy questionnaire inputs
