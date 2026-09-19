# Deployment and Release Guide (Vibe)

This document describes how a Vibe release is produced, verified and published.
It contains **configuration names only** — never values, tokens, keys or secrets.
No secret value is stored in this repository, in Git history, in CI logs or in
client code.

---

## 1. Hosting target

Vibe is built for **OpenAI/ChatGPT Sites**. The hosting manifest lives in the
repository:

- `.openai/hosting.json` — carries `project_id` (an `appgprj_…` Sites project id).
- `scripts/build.mjs` copies the manifest to `dist/.openai/hosting.json` so the
  built bundle is self-describing.

The build output is a single self-contained Worker entrypoint:

- `dist/server/index.js` — Worker code with the app assets embedded (`ASSETS`).
- `dist/.openai/hosting.json` — hosting manifest copy.
- `dist/.openai/drizzle` — SQL migrations shipped alongside the bundle.

`npm run build` must be run before any release check; `npm run preflight`
fails when the build output is missing or empty.

## 2. What repository CI does — and does not do

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| **Vibe CI** (`ci.yml`) | push to `main`, pull requests, manual dispatch | `npm ci` → build → `npm test` → `npm run test:cinema` → `npm run preflight` |
| **Vibe Release Bundle** (`release-bundle.yml`) | manual `workflow_dispatch` only | same build + test + preflight chain, then uploads the `dist/` output |
| **Configure Supabase Auth Email** (`configure-supabase-auth.yml`) | manual `workflow_dispatch` only | configures Supabase Auth SMTP/OTP templates |

- **CI does not deploy.** There is no deploy, promote or rollback command in any
  workflow, no publishing credential is consumed by CI, and no workflow claims
  that the site is live.
- The **Vibe Release Bundle** workflow only *builds, verifies and packages*:
  it uploads an artifact named `vibe-sites-release` (path `dist/`, retention
  7 days, `if-no-files-found: error`) with `permissions: contents: read`.
- **Actual publishing to ChatGPT Sites happens from Work/Sites** — a human
  reviews the artifact/preview and uses the Sites publish flow. The GitHub
  workflow itself never publishes.
- `npm run preflight` (`scripts/release-preflight.mjs`) is read-only: it checks
  the hosting manifest, the built output, the required npm scripts, the runtime
  metadata branch and obvious literal secret patterns. It never requests,
  reads or prints a secret value and it exits non-zero on failure.

## 3. Configuration names (names only — no values)

### 3.1 Sites runtime configuration

These names are read from the Sites runtime environment (`env`) by the Worker:

| Name | Used by | Meaning |
| --- | --- | --- |
| `VIBE_ADMIN_USER_IDS` | `server/admin-console.mjs` | comma-separated allowlist of user ids allowed to open the system console |
| `SPOTIFY_CLIENT_ID` | `server/spotify.mjs` | Spotify OAuth client id |
| `SPOTIFY_CLIENT_SECRET` | `server/spotify.mjs` | Spotify OAuth client secret (also used as the AES-GCM cookie encryption secret) |
| `SUPPORT_ENABLED` | `server/worker.mjs` | must be the literal `true` before the AI support endpoint is available |
| `SUPPORT_ALLOWED_USER_IDS` | `server/worker.mjs` | comma-separated per-Site identities allowed to use the AI support endpoint |
| `OPENAI_API_KEY` | `server/worker.mjs` | OpenAI API credential for the support assistant (never sent to clients) |
| `OPENAI_MODEL` | `server/worker.mjs` | Responses-compatible model name for the support assistant |

Presence-only support configuration names reported as booleans by the console
(`server/admin-console.mjs`) — only "configured / not configured" is ever
reported, never a value:

- `SUPPORT_EMAIL`
- `SUPPORT_TO`
- `SUPPORT_CONTACT`
- `SUPPORT_WEBHOOK`
- `SUPPORT_ENDPOINT`

### 3.2 GitHub / Supabase Auth setup

Used by the repository's Supabase Auth email configuration flow (manual
`workflow_dispatch`; names only):

| Name | Kind | Meaning |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN` | GitHub secret | Supabase management API access token for Auth configuration |
| `SUPABASE_PROJECT_ID` | GitHub repository variable | Supabase project reference used by the Auth configuration script |
| `RESEND_API_KEY` | GitHub secret | Resend API key for transactional Auth email |

The Supabase publishable key used by the browser-facing Supabase client is
public by design; user session JWTs stay in `HttpOnly` cookies and are never
returned to client code.

## 4. Release procedure

Follow the steps in order. Do not skip the review step.

- **A. Merge to `main`**
  Merge the reviewed change into the default branch. `main` is the only release
  line; no feature branch is published directly.
- **B. Confirm Vibe CI is green**
  The `Vibe CI` run for that commit on `main` must pass all steps, including
  the final `Release preflight` step.
- **C. Run Vibe Release Bundle**
  Dispatch the `Vibe Release Bundle` workflow manually against `main` and wait
  for it to finish successfully.
- **D. Review the artifact / preview**
  Download the `vibe-sites-release` artifact and inspect the built output, or
  review the Sites preview. Confirm the code matches the reviewed change.
- **E. Publish through ChatGPT Sites/Work**
  Publishing is a manual action performed in ChatGPT Sites/Work after the
  review in step D. No GitHub workflow publishes, promotes or rolls back.
- **F. Verify the system console (allowlisted admins only)**
  Open `#system-console` (Alt+Shift+V) as an allowlisted admin and confirm the
  console loads and reports read-only, current metadata. Non-allowlisted users
  must be denied.

## 5. Documented fail-safe behaviours

- **System console fails closed without `VIBE_ADMIN_USER_IDS`.** When the
  allowlist is empty the admin gate returns `admin_console_disabled` (HTTP 403)
  for every `/api/admin-console/*` request, and a signed-in user who is not in
  the allowlist receives `admin_forbidden` (HTTP 403). The console is read-only,
  exposes no secrets and cannot mutate production state.
- **Spotify shows "not configured" gracefully when credentials are missing.**
  Without both `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`, status returns
  `configured: false` and the UI reports the integration as not configured
  instead of failing or fabricating data.
- **AI support stays unavailable until configured.** `/api/support/status`
  reports `not_configured` unless `SUPPORT_ENABLED=true`, `OPENAI_API_KEY`,
  `OPENAI_MODEL` and `SUPPORT_ALLOWED_USER_IDS` are all present. No OpenAI
  credential is required for a normal release.
- **Deployment status is never claimed as live.** The console overview reports
  `deployment_status: manual_publish_required` with the note that publishing
  happens through ChatGPT Sites/Work while repository CI produces a validated
  release bundle.

## 6. Secret handling rules

- Never place a credential value in source, docs, issues, chat or commit
  messages; configure it in the Sites runtime environment or GitHub
  secrets/variables only.
- `npm run preflight` scans `public/`, `server/` and `scripts/` for
  value-shaped credentials (`sk-`, `sb_secret_`, `ghp_`, `github_pat_`) and
  fails the build on a match. Identifier names alone are expected and allowed.
- Rotate any credential that is ever suspected of exposure, then re-run the
  release procedure from step A.
