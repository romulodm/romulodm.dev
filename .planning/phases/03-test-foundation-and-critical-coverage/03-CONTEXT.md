# Phase 3: Test Foundation And Critical Coverage - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the first automated testing baseline for the active production surfaces in the monorepo. It covers shared unit-test infrastructure, business-logic and utility coverage across `portfolio/`, `worker/`, and `packages/`, critical API and Prisma integration coverage, BullMQ integration coverage for must-not-break async flows, and E2E coverage for the public portfolio front door plus authentication-critical access paths. The retiring legacy `frontend/` app is explicitly out of scope for test investment in this phase.

</domain>

<decisions>
## Implementation Decisions

### Test Runner Stack
- **D-01:** Standardize on `Vitest` for unit, integration, and component-style tests across the active monorepo surfaces instead of introducing multiple overlapping test runners.
- **D-02:** Use `Playwright` for browser E2E coverage in `portfolio/`.

### Database And Queue Integration Boundary
- **D-03:** Prisma integration coverage should run against an isolated real PostgreSQL test database rather than relying on pure mocks for query behavior.
- **D-04:** Critical BullMQ flows should receive real Redis-backed integration coverage, while pure helpers and side-effect-free logic stay covered by unit tests.

### Critical Path Coverage Scope
- **D-05:** E2E coverage should focus first on the must-not-break portfolio front door and authentication-critical admin access paths, not a full product-wide journey matrix.
- **D-06:** API coverage should prioritize success, auth failure, validation failure, and error-path behavior on the highest-risk server boundaries already hardened in Phase 2.

### Legacy Frontend Retirement Boundary
- **D-07:** The legacy `frontend/` app is being removed and should receive no new test investment in Phase 3.
- **D-08:** Phase 3 planning should treat `frontend/` coverage as retired scope and align the roadmap/requirements to the active production surfaces only.

### the agent's Discretion
- The planner can decide the exact monorepo test command layout, config file placement, fixture strategy, and CI split as long as `Vitest` and `Playwright` remain the primary tools.
- The planner can decide which specific Prisma queries, API handlers, and BullMQ jobs represent the highest-risk baseline so long as portfolio uptime, worker reliability, and auth control stay prioritized.
- The planner can decide whether active UI component tests belong in `portfolio/` only or in shared helper/module coverage, as long as no effort is spent on the retiring `frontend/`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - project goal, non-negotiables, and hardening constraints
- `.planning/REQUIREMENTS.md` - Phase 3 requirement set (`TEST-01`..`TEST-04`) after retiring legacy frontend test scope
- `.planning/ROADMAP.md` - Phase 3 goal, success criteria, and plan breakdown
- `.planning/STATE.md` - current project position and active focus

### Prior Phase Decisions
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md` - CI and repo-safety baseline that new test commands must fit
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md` - hardened API/auth boundaries that should anchor Phase 3 test coverage priorities

### Test Entry Points And Active Runtime Surfaces
- `package.json` - current root CI entrypoints and the starting point for monorepo test orchestration
- `portfolio/package.json` - active Next.js app scripts and current dependency baseline, including existing `puppeteer`
- `worker/package.json` - worker build surface that needs test entrypoints added
- `packages/database/package.json` - Prisma package build/generate surface that Phase 3 must cover safely
- `packages/queues/package.json` - shared queue package surface for unit and integration coverage

### Active App And API Seams
- `portfolio/app/page.tsx` - public portfolio front door for must-not-break E2E coverage
- `portfolio/app/api/auth/[...nextauth]/route.ts` - canonical NextAuth route surface
- `portfolio/app/api/auth/login/route.ts` - compatibility auth route retained and hardened in Phase 2
- `portfolio/app/api/auth/register/route.ts` - auth mutation surface for validation/error-path coverage
- `portfolio/app/api/comments/route.ts` - public mutation route with shared validation/rate-limit boundaries
- `portfolio/app/api/comments/[id]/route.ts` - authenticated comment mutation and authorization behavior
- `portfolio/app/api/comments/[id]/vote/route.ts` - public/authenticated mutation route with abuse-control coverage needs
- `portfolio/app/api/admin/resync/route.ts` - admin authorization boundary and failure-path candidate
- `portfolio/lib/auth.ts` - shared auth/authz helper baseline
- `portfolio/lib/api-validation.ts` - shared validation boundary introduced in Phase 2
- `portfolio/lib/api-errors.ts` - shared safe-error shaping boundary introduced in Phase 2
- `portfolio/lib/rate-limit.ts` - production-oriented rate limiting surface that should be exercised in tests

### Worker, Queue, And Data Surfaces
- `packages/database/prisma/schema.prisma` - canonical database schema and query/index behavior surface for integration tests
- `packages/database/index.ts` - shared Prisma client entrypoint
- `packages/queues/index.ts` - shared queue package entrypoint
- `packages/queues/lib/queues.ts` - queue declarations and BullMQ contract surface
- `packages/queues/lib/redis.ts` - Redis connection surface shared by queue code
- `worker/index.ts` - worker startup and registration path
- `worker/workers/email.worker.ts` - critical async email flow candidate for integration coverage
- `worker/workers/notification.worker.ts` - critical async notification flow candidate for integration coverage
- `worker/workers/views.worker.ts` - queue-backed views flushing path relevant to portfolio reliability

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/lib/api-validation.ts`, `portfolio/lib/api-errors.ts`, and `portfolio/lib/auth.ts`: shared Phase 2 boundaries make high-value API tests easier to target consistently.
- `packages/database/prisma/schema.prisma`: already defines the real query surface and indexes, which supports database-backed integration tests without inventing a fake persistence layer.
- `packages/queues/lib/queues.ts` and `packages/queues/lib/redis.ts`: provide a central BullMQ contract surface that can anchor queue integration tests.
- Root CI scripts in `package.json`: provide the current monorepo entrypoint that test commands should extend rather than bypass.

### Established Patterns
- No first-party monorepo test runner or config is currently committed for the active surfaces, so Phase 3 needs to introduce one coherent baseline instead of layering multiple ad hoc tools.
- `portfolio/` is the primary production app and already carries the API/auth boundaries hardened in Phase 2, making it the right center of gravity for API and E2E coverage.
- `worker/` and `packages/*` are TypeScript-first server surfaces with clear build entrypoints, which fits a shared `Vitest`-style test stack well.
- The legacy `frontend/` app remains in-tree but is now a retirement candidate rather than an active testing target.

### Integration Points
- Root-level scripts in `package.json` and any new CI commands/workflows added in Phase 1
- Server routes under `portfolio/app/api/**` and public/admin entrypoints under `portfolio/app/**`
- Prisma client usage through `packages/database` and app/worker consumers
- BullMQ registration and worker execution through `packages/queues/**` and `worker/**`

</code_context>

<specifics>
## Specific Ideas

- Phase 3 should optimize for confidence in the active production system, not broad legacy cleanup.
- Real infrastructure matters for the risky parts: use actual PostgreSQL and Redis-backed tests where behavior depends on query semantics, queueing, retries, or shared state.
- E2E should stay tight around what cannot fail in production: the portfolio front door and auth-critical control paths.

</specifics>

<deferred>
## Deferred Ideas

- Legacy `frontend/` retirement/removal work belongs to platform evolution and cleanup, not Phase 3 test investment.

</deferred>

---

*Phase: 03-test-foundation-and-critical-coverage*
*Context gathered: 2026-04-09*
