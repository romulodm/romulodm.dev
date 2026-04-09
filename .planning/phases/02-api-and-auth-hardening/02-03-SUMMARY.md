---
phase: 02-api-and-auth-hardening
plan: 03
subsystem: abuse-controls
tags: [security, rate-limiting, redis, public-api]
requires:
  - phase: 02-01
    provides: shared parsing for exposed mutation routes
  - phase: 02-02
    provides: consistent server-side auth boundary
provides:
  - Shared Redis-backed request keying helper usage for targeted mutations
  - Removal of in-memory comment/comment-vote abuse controls
  - Route-specific auth and engagement rate-limit keys
affects: [portfolio-api, auth, comments, posts]
tech-stack:
  added: []
  patterns:
    - Shared Redis-backed rate limiting with request IP extraction
key-files:
  created: []
  modified:
    - portfolio/lib/rate-limit.ts
    - portfolio/app/api/comments/route.ts
    - portfolio/app/api/comments/[id]/vote/route.ts
    - portfolio/app/api/posts/[id]/like/route.ts
    - portfolio/app/api/auth/login/route.ts
    - portfolio/app/api/auth/register/route.ts
key-decisions:
  - Reused the existing Redis path instead of preserving process-local Maps
  - Scoped rate-limit keys to route intent and actor identity rather than one opaque global counter
requirements-completed: [SEC-03]
duration: in-progress
completed: 2026-04-09
---

# Phase 2 Plan 03 Summary

**The exposed mutation routes in scope now use Redis-backed abuse controls instead of relying on per-process memory.**

## Accomplishments

- Updated `portfolio/lib/rate-limit.ts` to reuse the shared Redis client and expose request IP extraction.
- Replaced the in-memory comment creation and vote limiters with shared Redis-backed rate limiting.
- Added explicit abuse controls to the compatibility login, registration, and post-like routes.

## Verification

- Targeted drift search no longer finds `new Map`, `rateLimitMap`, or `voteRateLimit` in the targeted routes.
- `npx tsc -p portfolio/tsconfig.json --noEmit --pretty false` passed with the new rate-limit call sites.

## Issues Encountered

- Full build verification is still pending because the longer Next.js build step has not been allowed to complete yet.

## Next Phase Readiness

- The public mutation routes hardened in this phase now share the same production-safe abuse-control primitive.
