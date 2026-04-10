## Summary

Wave 3 added real integration coverage for the highest-risk active server boundaries in the monorepo.

## What Shipped

- Added reusable integration fixtures in `testing/integration/fixtures.ts` for deterministic Prisma-backed setup and cleanup.
- Updated `testing/setupTests.integration.ts` to load local env contracts, seed safe fallback auth config, and point the suite at real Postgres and Redis infrastructure.
- Added API boundary tests for:
  - `portfolio/app/api/auth/register/route.ts`
  - `portfolio/app/api/auth/login/route.ts`
  - `portfolio/app/api/comments/[id]/vote/route.ts`
  - `portfolio/app/api/admin/resync/route.ts`
- Added real Prisma integration coverage in `packages/database/tests/integration/prisma-roundtrip.test.ts`.
- Added real BullMQ/Redis-backed worker coverage in `worker/tests/integration/views.worker.test.ts`.
- Tightened the integration runner to execute serially so shared database and Redis fixtures do not collide.

## Verification

- `npm run test:integration` passed against local Postgres and Redis.
- The passing suite covered:
  - success and negative-path route behavior for auth, admin, and comment-vote boundaries
  - real Prisma create/read/update/delete roundtrips
  - the views worker flush path plus repeatable scheduling behavior

## Notes

- Vitest child-process execution still required escalated execution in this environment because the default sandbox hit `spawn EPERM`.
- Serial integration execution was necessary to keep the shared local infrastructure deterministic.
