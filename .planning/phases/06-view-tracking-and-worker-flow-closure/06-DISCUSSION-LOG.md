# Phase 6: View Tracking And Worker Flow Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 06-view-tracking-and-worker-flow-closure
**Areas discussed:** Canonical entry path, Legacy route compatibility, Deduplication model, Flush ownership, Integration test boundary

---

## Canonical Entry Path

| Option | Description | Selected |
|--------|-------------|----------|
| Make `recordPostView` the canonical path and retire legacy direct counting | Recommended. Converges the live flow on the worker-backed path already aligned with the queue contracts | yes |
| Keep both entry paths and try to synchronize them | Preserves the audit blocker and operational ambiguity | |
| Make the legacy API route the canonical path instead | Possible, but it would preserve the older route-local buffering and flush model | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 6 should converge on the app-owned server-side view recording surface that already uses the shared worker-backed buffer.

---

## Legacy Route Compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the legacy route only as a thin compatibility wrapper or remove it if unused | Recommended. Preserves compatibility without keeping duplicate counting logic alive | yes |
| Keep the full legacy counting route as-is | Leaves the split Redis-buffer problem unresolved | |
| Expand the legacy route and make everything call it | Adds coupling to the older implementation and direct flush behavior | |

**User's choice:** Auto-selected recommended option
**Notes:** The planner can remove the route entirely if active production usage no longer depends on it.

---

## Deduplication Model

| Option | Description | Selected |
|--------|-------------|----------|
| Centralize lightweight best-effort dedupe in one shared policy | Recommended. Matches the soft-metric nature of views while removing mixed semantics | yes |
| Keep cookie dedupe and Redis cooldown as separate strategies | Continues the current inconsistency and makes behavior harder to reason about | |
| Upgrade to strict analytics-grade identity for views | Too large and unnecessary for this hardening phase | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 6 should keep dedupe simple and centralized rather than overbuild identity logic for a soft metric.

---

## Flush Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Worker-backed periodic flush is the only persistence path | Recommended. Directly closes the audit gap around request-time bypasses of the tuned worker path | yes |
| Allow threshold-based request-time flushing to coexist | Keeps direct database writes in the request path and weakens the single-source-of-truth goal | |
| Move back to direct request-time persistence only | Reverses the worker-hardening and queue-tuning baseline already established | |

**User's choice:** Auto-selected recommended option
**Notes:** Request-time code should stop writing views directly to Postgres or maintaining its own flush lifecycle.

---

## Integration Test Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Cover the real end-to-end view flow plus any retained compatibility surface | Recommended. Matches the milestone blocker and proves the unified path is real | yes |
| Test only the shared helper functions | Too narrow to prove that live traffic no longer forks | |
| Skip additional integration coverage and rely on prior worker tests | Leaves the audit gap around the real user-facing flow unresolved | |

**User's choice:** Auto-selected recommended option
**Notes:** Verification should prove that page-triggered traffic, Redis buffering, and worker persistence now belong to one coherent path.

---

## the agent's Discretion

- Planning can choose whether the legacy route remains as a wrapper or is removed entirely, based on confirmed live dependencies.
- Planning can choose the exact centralized dedupe mechanism as long as it stays lightweight and shared.
- Planning can sequence helper extraction, route migration, and test updates in the safest incremental order.

## Deferred Ideas

- Richer analytics semantics, anti-fraud logic, and non-essential view attribution remain out of scope.
- PR enforcement of the test baseline is deferred to Phase 7 even if Phase 6 expands the relevant test coverage.
