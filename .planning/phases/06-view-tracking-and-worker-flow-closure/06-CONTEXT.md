# Phase 6: View Tracking And Worker Flow Closure - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the milestone blocker around split post-view tracking by converging the live portfolio onto one authoritative worker-backed path. The work should preserve the current architecture, eliminate duplicate Redis buffers and request-time persistence behavior, and restore confidence that worker reliability, queue tuning, and integration coverage all apply to the real production view flow.

</domain>

<decisions>
## Implementation Decisions

### Canonical Entry Path
- **D-01:** The server-side `recordPostView` flow in `portfolio/lib/views.ts` should become the only authoritative path for recording post views.
- **D-02:** Phase 6 should retire the legacy direct-counting behavior in `portfolio/app/api/posts/[id]/view/route.ts` rather than preserve two independent ways to count views.

### Legacy Route Compatibility
- **D-03:** The `/api/posts/[id]/view` route may remain only as a thin compatibility surface if something live still depends on it, but it must delegate to the shared canonical path instead of maintaining its own Redis buffer and flush logic.
- **D-04:** If the planner verifies the route is no longer needed by active production flows, it may remove or deprecate the route surface entirely as part of convergence.

### Deduplication Model
- **D-05:** View deduplication should remain lightweight and best-effort, not become a strict analytics-grade identity system.
- **D-06:** Deduplication policy should be centralized in one shared implementation instead of mixing cookie-only suppression with separate identifier-plus-cooldown Redis logic.

### Flush Ownership
- **D-07:** BullMQ worker-backed periodic flushing should be the only persistence path for buffered views.
- **D-08:** Request-time code should no longer flush views directly to Postgres based on thresholds or ad hoc route-local logic.

### Integration Test Boundary
- **D-09:** Phase 6 verification must cover the real end-to-end flow from page-triggered view recording through Redis buffering into worker persistence.
- **D-10:** If a legacy compatibility route remains, it should receive targeted compatibility coverage to prove it delegates to the same canonical path.

### the agent's Discretion
- The planner can choose the exact shared helper boundaries, route deprecation strategy, and migration sequence as long as all live view traffic converges on one authoritative worker-backed flow.
- The planner can choose the exact dedupe mechanism details, including whether cookies, Redis cooldown keys, or another lightweight approach anchor the final design, as long as the behavior is centralized and operationally simple.
- The planner can decide whether compatibility is temporary or removable immediately, provided the production front door does not regress.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - production-hardening goal and must-not-break priorities
- `.planning/REQUIREMENTS.md` - Phase 6 requirement set (`WORK-01`, `WORK-02`, `PERF-03`, `TEST-02`)
- `.planning/ROADMAP.md` - Phase 6 goal, success criteria, and dependency on completed Phases 1 through 5
- `.planning/STATE.md` - current milestone position and gap-closure status
- `.planning/v1.0-MILESTONE-AUDIT.md` - exact evidence for the split view-flow blocker this phase must close

### Prior Phase Decisions
- `.planning/phases/03-test-foundation-and-critical-coverage/03-CONTEXT.md` - active test-stack choices and coverage boundaries
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md` - current integration and E2E baseline relevant to view-flow tests
- `.planning/phases/04-worker-reliability-and-observability/04-CONTEXT.md` - worker visibility and retry-safety decisions that must now apply to the real view path
- `.planning/phases/04-worker-reliability-and-observability/04-VERIFICATION.md` - current worker reliability implementation and residual caveats
- `.planning/phases/05-performance-and-scalability-tuning/05-CONTEXT.md` - queue tuning and measurement-first performance decisions already locked
- `.planning/phases/05-performance-and-scalability-tuning/05-VERIFICATION.md` - Phase 5 evidence showing the tuned worker path does not yet cover all live view traffic

### Live View Pipeline Surfaces
- `portfolio/lib/views.ts` - current server-side post-view entrypoint using `VIEWS_BUFFER_KEY`
- `portfolio/app/api/posts/[id]/view/route.ts` - legacy API-based view path using a separate Redis buffer and direct flush behavior
- `worker/workers/views.worker.ts` - worker-backed buffered view flush implementation that should become the sole persistence path
- `worker/tests/integration/views.worker.test.ts` - current worker-side integration coverage baseline for view flushing
- `packages/queues/index.ts` - shared queue package surface
- `packages/queues/lib/queues.ts` - queue names, runtime config, and `VIEWS_BUFFER_KEY`
- `portfolio/lib/redis.ts` - app Redis connection used by the current view paths
- `portfolio/app/[locale]/blog/[slug]/page.tsx` - public portfolio surface likely responsible for triggering post-view tracking

### Validation And CI Surfaces
- `package.json` - root scripts that should remain the source of truth for verification entrypoints
- `.github/workflows/pr.yml` - current PR workflow, relevant because later CI protection depends on the final Phase 6 test shape

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/lib/views.ts` already points at the shared `VIEWS_BUFFER_KEY`, which matches the worker-backed flush path introduced earlier.
- `worker/workers/views.worker.ts` already owns the intended periodic persistence mechanism and queue scheduling behavior for buffered views.
- Existing Phase 3 and Phase 4 integration harnesses around worker and Redis behavior can be extended instead of creating a brand-new test stack.

### Established Patterns
- The current split exists because the legacy API route still keeps its own cooldown, `views:batch` buffer, threshold-based flushing, and cron-oriented flush endpoint.
- The portfolio app already has server-side view recording behavior, so the convergence path should likely strengthen and centralize that pattern rather than introduce a third one.
- This project treats view counts as a soft metric, so the final design should optimize for reliability and operational simplicity over perfect analytics identity.

### Integration Points
- Public blog page rendering and view-triggering behavior in the portfolio app
- Shared Redis buffering for post views
- BullMQ-backed scheduled flush execution in the worker
- Existing integration tests that already exercise Redis and Postgres with real infrastructure

</code_context>

<specifics>
## Specific Ideas

- Phase 6 should remove the ambiguity around which Redis key and flush path represent truth for views.
- Any surviving compatibility layer must be thin enough that Phase 4 reliability and Phase 5 queue tuning finally describe the real production flow.
- The end result should make the milestone audit evidence disappear: one path in, one buffer, one worker-backed persistence story, and tests that prove it.

</specifics>

<deferred>
## Deferred Ideas

- Analytics-grade identity, anti-fraud logic, or richer view attribution is out of scope for this phase.
- Broader CI enforcement for the test baseline is deferred to Phase 7, even though Phase 6 should produce test artifacts that Phase 7 can wire into PR protection.

</deferred>

---

*Phase: 06-view-tracking-and-worker-flow-closure*
*Context gathered: 2026-04-10*
