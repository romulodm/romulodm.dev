---
phase: 02-api-and-auth-hardening
plan: 04
subsystem: api-errors
tags: [security, error-handling, observability, admin-api]
requires:
  - phase: 02-01
    provides: shared parsing and validation
  - phase: 02-02
    provides: consistent route auth boundary
  - phase: 02-03
    provides: consistent abuse-control boundary
provides:
  - Shared safe error response helpers
  - Explicit internal logging boundaries for targeted routes
  - Safer public/admin response shaping for comments, auth, newsletter, and moderation APIs
affects: [portfolio-api, admin-api, auth, comments, posts]
tech-stack:
  added: []
  patterns:
    - Shared safe response helpers with bounded public messages and internal logging
key-files:
  created:
    - portfolio/lib/api-errors.ts
  modified:
    - portfolio/app/api/comments/route.ts
    - portfolio/app/api/comments/[id]/route.ts
    - portfolio/app/api/comments/[id]/vote/route.ts
    - portfolio/app/api/posts/[id]/like/route.ts
    - portfolio/app/api/auth/login/route.ts
    - portfolio/app/api/auth/register/route.ts
    - portfolio/app/api/admin/newsletter/campaigns/route.ts
    - portfolio/app/api/admin/newsletter/campaigns/[id]/route.ts
    - portfolio/app/api/admin/newsletter/campaigns/[id]/send/route.ts
    - portfolio/app/api/admin/suspicious-comments/route.ts
    - portfolio/app/api/admin/suspicious-comments/[id]/route.ts
    - portfolio/app/api/admin/users/banned/route.ts
    - portfolio/app/api/admin/users/[id]/ban/route.ts
    - portfolio/app/api/admin/resync/route.ts
key-decisions:
  - Returned bounded public/admin error payloads while keeping route-local logging context
  - Avoided leaking legacy auth-specific registration codes in the public registration response
requirements-completed: [SEC-04]
duration: in-progress
completed: 2026-04-09
---

# Phase 2 Plan 04 Summary

**The targeted public and admin APIs now share safe error helpers instead of leaking a mix of raw internals, legacy codes, and inconsistent response formats.**

## Accomplishments

- Added `portfolio/lib/api-errors.ts` with bounded public/admin response helpers plus contextual internal logging.
- Migrated the targeted comments, auth, newsletter, moderation, admin user, and resync handlers to the shared safe-error pattern.
- Removed the legacy registration error-code surface in favor of safer bounded responses for public auth failures.

## Verification

- Targeted route inspection confirms the scoped handlers now use shared error helpers and shared parsing/auth boundaries instead of the old ad hoc mix.
- `npx tsc -p portfolio/tsconfig.json --noEmit --pretty false` passed after the error-shaping migration.

## Issues Encountered

- `npm run lint:portfolio` still cannot run non-interactively because the repo has not completed Next.js ESLint initialization.
- The long-running `npm run build:portfolio` check was interrupted before completion, so full phase close-out verification is still pending.

## Next Phase Readiness

- The code changes for all four Phase 2 plans are implemented, but the phase still needs a completed Next.js build run before it should be marked fully closed.
