# Vibe stabilization roadmap

Status: in progress. This document tracks the pre-iOS stabilization work.

## Phase 0 — Access and audit

- [x] Confirm GitHub access.
- [x] Confirm Supabase project reachability.
- [x] Extract live public-schema inventory.
- [ ] Extract full constraints, indexes, and RLS policies.
- [ ] Obtain database or management access for migration application.

## Phase 1 — Schema reconciliation

- [x] Document live public tables and columns.
- [x] Add additive reconciliation migration.
- [ ] Verify migration against a full live schema dump.
- [ ] Apply migrations to staging.
- [ ] Apply migrations to production after approval.

## Phase 2 — Security hardening

- [x] Add `.gitignore` and `.env.example`.
- [x] Harden auth callback, logout, and password session handling.
- [x] Tighten Worker CSP.
- [x] Add server-side validation for rooms, messages, reports, and photos.
- [ ] Audit and fix live RLS policies.
- [ ] Verify account deletion with production service role.

## Phase 3 — Feature stability

- [x] Add ownership filter to inbox.
- [x] Remove account-deletion storage purge limits.
- [ ] Add live integration tests against Supabase.
- [ ] Add idempotency for media/message uploads.
- [ ] Remove or feature-flag demo-only surfaces.

## Phase 4 — Deployment and synchronization

- [x] Add gated Supabase migration workflow.
- [x] Document migration/backup process.
- [ ] Configure required GitHub Actions secrets.
- [ ] Run the migration workflow against staging.
- [ ] Establish production rollback runbook.

## Phase 5 — Production readiness

- [ ] Complete moderation operations.
- [ ] Complete runtime environment configuration.
- [ ] Complete real-device/browser QA.
- [ ] Approve native iOS migration.
