# Phase 3 Research: Test Foundation And Critical Coverage

**Phase:** 3 - Test Foundation And Critical Coverage
**Date:** 2026-04-09
**Status:** Ready for planning

## Research Objective

Determine the most effective incremental way to add a production-grade automated test baseline to the active monorepo surfaces without rewriting the architecture. The phase must cover unit tests across `portfolio/`, `worker/`, and `packages/`, real Postgres and Redis-backed integration tests, API boundary tests for the hardened Phase 2 routes, and Playwright E2E coverage for the public portfolio front door plus auth-critical control paths.

## Repo-Specific Starting Point

- The active production surfaces are `portfolio/`, `worker/`, `packages/database`, and `packages/queues`.
- Root CI exists from Phase 1, but there is still no committed root test orchestration or first-party test config for the active surfaces.
- `portfolio/package.json` currently exposes `dev`, `build`, `start`, and `lint`, and includes `puppeteer` but no committed test runner or browser test configuration.
- `worker/package.json` and the shared package manifests expose only build/dev scripts, which means Phase 3 must add test commands and configs without disturbing existing build behavior.
- The database layer already uses a real shared Prisma schema in `packages/database/prisma/schema.prisma`, making database-backed integration tests viable without introducing a second data model.
- The BullMQ contract is already centralized in `packages/queues/lib/queues.ts` and `packages/queues/lib/redis.ts`, and the worker entrypoints are explicit under `worker/workers/*.ts`.
- Phase 2 introduced shared API boundaries in `portfolio/lib/api-validation.ts`, `portfolio/lib/api-errors.ts`, `portfolio/lib/auth.ts`, and `portfolio/lib/rate-limit.ts`, which gives Phase 3 clean test seams for API behavior.
- The legacy `frontend/` app remains in-tree but the user explicitly removed it from Phase 3 scope because it is being retired.

## Key Research Findings

### 1. One shared unit/integration runner is the cleanest fit for the active monorepo

The active code surfaces are all TypeScript-first and already centered around Node-based build flows. That makes `Vitest` the best fit for unit and integration coverage across `portfolio/`, `worker/`, and `packages/*`, because it can cover server code, shared modules, and limited component tests without introducing separate Jest-style infrastructure per package.

Planning implication:
- add one coherent `Vitest` baseline rather than mixing multiple unit/integration runners
- introduce test scripts at the root and per-surface entrypoints so CI can expand cleanly from the existing Phase 1 baseline
- keep the retiring `frontend/` out of the new runner layout

### 2. Playwright should be isolated to must-not-break browser coverage in `portfolio/`

The public portfolio front door and auth-critical admin access are the only browser flows that meet the project’s must-not-break bar right now. That makes `Playwright` the right E2E layer, but the suite should stay intentionally narrow. The app root redirects to `/pt`, and the admin/auth surfaces live inside the main Next.js app, so a small smoke-grade browser suite is enough for this phase.

Planning implication:
- create a dedicated Playwright setup inside `portfolio/`
- cover the public landing experience and at least one authentication-critical control path
- avoid broad end-to-end expansion beyond the highest-risk uptime/control flows

### 3. Real Postgres is required for meaningful Prisma integration confidence

The repo already depends on real query semantics, transactional behavior, unique constraints, and indexes defined in `packages/database/prisma/schema.prisma`. Mock-only Prisma coverage would miss the exact category of issues this hardening phase is meant to catch.

Planning implication:
- provision an isolated test database path for Phase 3 integration coverage
- keep unit tests separate from database-backed tests so local developer feedback stays fast
- prioritize query-heavy or mutation-heavy paths already exposed through `comments`, auth, newsletter, and worker flows

### 4. Real Redis-backed BullMQ tests are necessary, but should stay focused on critical flows

The queue contracts and worker handlers are explicit enough that Phase 3 can exercise real enqueue/consume behavior without inventing an alternative architecture. However, not every queue path needs end-to-end coverage in this baseline. The highest-value targets are the flows tied to worker silent-failure risk and portfolio correctness: notification, transactional email/newsletter, and view flushing behavior.

Planning implication:
- keep helper logic unit-tested, but use real Redis-backed integration tests for queue contracts and worker execution on critical jobs
- test the worker paths that mutate database state or produce high-value side effects
- keep job fixture setup deterministic so retries and completion behavior remain inspectable

### 5. Phase 2 created a strong API test seam that Phase 3 should exploit directly

The hardened routes now funnel through shared validation, auth, rate-limit, and safe-error helpers. That gives Phase 3 a clean way to test success, auth failure, validation failure, and internal error shaping without building an all-new test abstraction first.

Highest-value API surfaces from the current code:
- `portfolio/app/api/auth/login/route.ts`
- `portfolio/app/api/auth/register/route.ts`
- `portfolio/app/api/comments/route.ts`
- `portfolio/app/api/comments/[id]/route.ts`
- `portfolio/app/api/comments/[id]/vote/route.ts`
- `portfolio/app/api/admin/resync/route.ts`

Planning implication:
- center API tests on the Phase 2-hardened routes first
- explicitly cover authz failures, validation failures, and safe-error boundaries
- test shared helper behavior where it reduces repeated setup across routes

### 6. The unit-test surface is broader than just utilities and should be wave-planned

The active monorepo has several natural unit-test seams:
- shared helpers in `portfolio/lib/`
- queue and Redis contract helpers in `packages/queues/`
- Prisma-adjacent pure helpers or model-shaping logic in `packages/database/`
- worker-side helper logic such as email templates, provider selection, queue orchestration helpers, and status transitions

Trying to cover every module in one wave would create too much execution noise. The phase should establish the testing infrastructure first, then layer unit coverage onto the most important seams before moving to integration and E2E.

Planning implication:
- keep infrastructure/setup as its own first plan
- separate unit/module coverage from API/integration coverage so the execution order stays incremental and testable

### 7. The legacy frontend should be treated as removed scope, not an ignored TODO

Because the user explicitly removed `frontend/` from Phase 3, planning should not leave references that imply future execution inside this phase. The requirements and roadmap should stay aligned to the active production surfaces only.

Planning implication:
- no plan tasks should target `frontend/`
- root scripts and CI changes added in this phase should avoid accidentally sweeping the legacy app back into the active test matrix
- any future `frontend/` removal work belongs in cleanup/platform evolution, not test hardening

## Recommended Plan Shape

The roadmap’s existing four-plan breakdown still fits the repo well.

### Plan 03-01: Shared testing infrastructure and command baseline

Focus:
- add `Vitest` foundation for the active monorepo surfaces
- add `Playwright` foundation for `portfolio/`
- define root and per-surface test commands that fit the existing CI contract
- introduce shared fixture/bootstrap structure for fast unit tests versus real infra-backed integration tests

Key outcome:
- the repo gains a coherent test toolchain and commands without rewriting package boundaries

### Plan 03-02: Unit and active component/module coverage

Focus:
- add unit tests for business logic and shared utilities across `portfolio/`, `worker/`, and `packages/*`
- add active UI/component-style coverage only where it supports the Next.js production app or shared module behavior
- avoid any investment in the retiring legacy frontend

Key outcome:
- the most reused logic gains fast repeatable coverage and a reliable regression net

### Plan 03-03: API and real integration coverage

Focus:
- add API tests for hardened auth/comments/admin boundaries
- add real Postgres-backed Prisma integration tests
- add real Redis-backed BullMQ integration tests for critical worker/queue flows

Key outcome:
- the highest-risk runtime seams gain behavior-level confidence in real infrastructure conditions

### Plan 03-04: Playwright must-not-break E2E coverage

Focus:
- cover the public portfolio front door
- cover auth-critical control access in the Next.js app
- keep browser coverage intentionally small and stable

Key outcome:
- the repo gains browser-level smoke protection for the production paths that matter most

## Planning Constraints And Tradeoffs

### Keep the testing baseline incremental

Phase 3 should establish the smallest coherent test platform that can grow later. It should not become a repo-wide testing rewrite or an attempt to reach exhaustive coverage before production.

### Preserve the existing architecture and runtime boundaries

Tests should fit the existing app, worker, Prisma, and queue boundaries. Avoid planning work that requires major dependency inversion or a large “test framework” layer on top of the current codebase.

### Separate fast feedback from real-infrastructure confidence

Unit tests should stay fast and local. Real Postgres/Redis-backed tests should exist, but they should be scoped to the flows where mocks would be misleading.

### Favor critical-path coverage over breadth

The project’s non-negotiables are portfolio uptime, worker reliability, and auth control. Planning should prefer those over broad UI or low-risk route coverage.

### Keep CI expansion compatible with Phase 1

The existing CI baseline favors scoped entrypoints. Phase 3 should extend that baseline with stable test commands rather than replacing it with a heavy all-or-nothing workflow.

## Validation Architecture

Phase 3 validation should combine fast local feedback, infra-backed integration verification, and file-level confirmation that the new testing baseline is actually wired into the monorepo.

### Artifact-level validation

- Verify committed `Vitest` config and test scripts exist for the active monorepo surfaces
- Verify committed `Playwright` config and browser test scripts exist for `portfolio/`
- Verify root test commands integrate with the existing CI contract without pulling the retiring `frontend/` back into scope
- Verify test fixtures/bootstrap files exist for isolated database and Redis-backed test execution

### Command-level validation

- quick feedback command should run a focused `Vitest` subset for the changed surface
- full suite command should run the monorepo unit/integration/E2E baseline appropriate for Phase 3
- targeted commands should separately exercise API/integration and Playwright layers so execution can sample them by wave

### Behavior-level validation

- unit suites prove shared business logic and helper behavior across active surfaces
- API tests prove success, auth failure, validation failure, and safe-error behavior for hardened routes
- Prisma integration tests prove real query/mutation behavior against isolated Postgres
- BullMQ integration tests prove real queue/worker behavior against isolated Redis
- Playwright E2E proves the public portfolio front door and auth-critical control path remain functional

## Risks To Watch During Planning

- over-scoping unit coverage so the phase turns into “test everything” instead of a production baseline
- introducing multiple overlapping test frameworks that create maintenance drag immediately
- designing database or Redis-backed tests that are too slow or too fragile for CI use
- accidentally depending on browser E2E to cover API behavior that should be asserted more cheaply at the route layer
- reintroducing `frontend/` obligations through root scripts or CI wiring after it was explicitly removed from scope
- coupling test setup too tightly to local developer machines instead of using reproducible environment contracts

## Sources

### Local Context
- `.planning/phases/03-test-foundation-and-critical-coverage/03-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md`
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md`
- `package.json`
- `portfolio/package.json`
- `worker/package.json`
- `packages/database/package.json`
- `packages/queues/package.json`
- `packages/database/prisma/schema.prisma`
- `packages/database/index.ts`
- `packages/queues/lib/queues.ts`
- `packages/queues/lib/redis.ts`
- `portfolio/app/page.tsx`
- `portfolio/app/api/auth/login/route.ts`
- `portfolio/app/api/comments/route.ts`
- `portfolio/app/api/admin/resync/route.ts`
- `portfolio/lib/auth.ts`
- `portfolio/lib/api-validation.ts`
- `portfolio/lib/api-errors.ts`
- `portfolio/lib/rate-limit.ts`
- `worker/index.ts`
- `worker/workers/email.worker.ts`
- `worker/workers/notification.worker.ts`
- `worker/workers/views.worker.ts`

---

## RESEARCH COMPLETE
