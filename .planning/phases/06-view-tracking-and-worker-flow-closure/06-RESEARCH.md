# Phase 6 Research: View Tracking And Worker Flow Closure

**Phase:** 6 - View Tracking And Worker Flow Closure
**Date:** 2026-04-10
**Status:** Ready for planning

## Research Objective

Identify the safest incremental path to unify live post-view tracking onto one authoritative worker-backed flow without rewriting the architecture. The phase must remove the split between `views:buffer` and `views:batch`, keep view dedupe lightweight, and produce verification that proves the real production path now matches the worker reliability and queue tuning story from earlier phases.

## Repo-Specific Starting Point

- `portfolio/app/[locale]/blog/[slug]/ViewTracker.tsx` already triggers the server action `recordPostView(postId)` on page mount.
- `portfolio/lib/views.ts` increments the shared `VIEWS_BUFFER_KEY` (`views:buffer`) and uses an HTTP-only cookie for lightweight dedupe, which already matches the worker-backed flush path.
- `portfolio/app/api/posts/[id]/view/route.ts` still maintains a second implementation with its own cooldown key strategy, a separate Redis hash (`views:batch`), threshold-based direct database flushes, and a cron-style `GET` flush endpoint.
- `worker/workers/views.worker.ts` already owns the intended periodic flush behavior for `views:buffer`, and current integration coverage verifies the worker flush itself but not the full live app flow.
- The milestone audit shows the real blocker is not missing worker infrastructure, but that live traffic can still bypass it through the legacy route and separate Redis state.

## Key Research Findings

### 1. The server action path is already the closest thing to the canonical design

The current `ViewTracker -> recordPostView -> VIEWS_BUFFER_KEY -> views.worker.ts` path already follows the production direction established in Phases 4 and 5. It uses the shared queue contract, keeps request-time work light, and aligns with the worker-owned persistence model.

Planning implication:
- make `recordPostView` the single authoritative write path
- avoid introducing any third abstraction if the existing server-action flow can be strengthened directly
- migrate compatibility callers toward the same helper rather than preserve dual semantics

### 2. The legacy route is the real source of architectural drift

`app/api/posts/[id]/view/route.ts` implements its own dedupe (`view:cooldown:*`), its own Redis buffer (`views:batch`), threshold-based direct flushes to Prisma, and an authenticated cron-style `GET` flush endpoint. That means worker health signals, queue tuning, and existing integration coverage do not fully represent production behavior.

Planning implication:
- Phase 6 must eliminate the route's independent buffering and direct flush logic
- if the route stays, it should become a thin compatibility wrapper over the canonical shared path
- the old batch key and cron-flush behavior should be retired as part of convergence

### 3. Best-effort dedupe is enough, but it needs one policy

The repo treats views as a soft metric, and `views.worker.ts` explicitly prefers slight under-counting over double-counting on failure. That makes a lightweight dedupe strategy appropriate, but the current mix of cookie-only suppression and route-local identifier/cooldown logic creates inconsistent semantics.

Planning implication:
- keep dedupe simple and centralized
- favor a shared helper that can support both the app-owned server action and any retained compatibility route
- do not expand this phase into analytics-grade identity or fraud prevention

### 4. Worker-backed periodic flush should remain the only persistence boundary

The worker already implements the intended flush contract and is covered by integration tests. Direct database persistence from request-time code is what breaks the worker reliability and queue tuning story. Removing threshold-based direct flushes also simplifies the operational model: one buffer, one flush path, one place to observe backlog/failure.

Planning implication:
- Phase 6 should route all view persistence through `views.worker.ts`
- worker/queue code may need minor cleanup to remove assumptions about legacy route behavior, but this is not a queue redesign phase
- verification should prove the worker path is now authoritative for all live view traffic

### 5. The missing test coverage is an integration-boundary problem, not a test-stack problem

Phase 3 already installed Vitest-based integration coverage with real Redis/Postgres infrastructure, and Phase 4 extended that harness for worker behavior. The gap is that nothing currently proves the page-triggered app flow and the legacy route, if retained, both land in the same buffer and persist through the same worker path.

Planning implication:
- extend the existing integration harness rather than introduce a new framework
- add tests for the canonical recording helper plus any retained compatibility route behavior
- keep verification centered on `npm run test:integration`, with build checks where app or worker compilation is touched

### 6. A three-plan shape still fits the work cleanly

The natural execution order is:
- canonicalize the recording entrypoint and route compatibility surface
- align worker/queue ownership around the single remaining buffer and persistence model
- add integration coverage that proves the unified flow end-to-end

Planning implication:
- use the roadmap's Phase 6 scope with three sequential plans
- keep each plan small enough to verify independently

## Recommended Plan Shape

### Plan 06-01: Canonicalize the post-view entry contract

Focus:
- centralize the shared view-recording helper and dedupe policy
- migrate or slim the legacy `/api/posts/[id]/view` route so it no longer owns independent counting behavior
- ensure live app traffic and compatibility traffic write into the same shared path

### Plan 06-02: Make the worker-backed buffer the sole persistence path

Focus:
- remove remaining request-time direct flush assumptions and obsolete legacy buffer behavior
- keep `views.worker.ts` and queue contracts as the single persistence story
- preserve or tighten the existing worker reliability/observability behavior against the now-unified path

### Plan 06-03: Extend integration verification for the unified live flow

Focus:
- add real Redis/Postgres-backed tests that prove canonical view recording reaches the worker flush path
- cover any retained compatibility route to ensure it delegates instead of forking behavior
- keep verification aligned with the existing root integration/build entrypoints

## Validation Architecture

Phase 6 validation should combine the existing integration harness with targeted build checks for touched runtime surfaces.

- `npm run test:integration` should remain the primary verification command because the milestone gap is fundamentally about Redis/Postgres-backed flow convergence
- `npm run build:portfolio` should verify app-route/server-action changes compile cleanly
- `npm run build:worker` and `npm run build:queues` should verify the worker-backed flush path and shared queue contracts remain intact where touched

## Sources

### Local Context
- `.planning/phases/06-view-tracking-and-worker-flow-closure/06-CONTEXT.md`
- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `portfolio/lib/views.ts`
- `portfolio/app/[locale]/blog/[slug]/ViewTracker.tsx`
- `portfolio/app/[locale]/blog/[slug]/page.tsx`
- `portfolio/app/api/posts/[id]/view/route.ts`
- `portfolio/lib/redis.ts`
- `worker/workers/views.worker.ts`
- `worker/tests/integration/views.worker.test.ts`
- `packages/queues/lib/queues.ts`
- `package.json`
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md`
- `.planning/phases/04-worker-reliability-and-observability/04-VERIFICATION.md`

---

## RESEARCH COMPLETE
