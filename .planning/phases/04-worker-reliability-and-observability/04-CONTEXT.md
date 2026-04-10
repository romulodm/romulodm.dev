# Phase 4: Worker Reliability And Observability - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the existing BullMQ-backed worker system so critical async flows stop failing silently and become production-diagnosable for a single operator. The work should preserve the current architecture while improving failure visibility, retry safety, backlog detection, and targeted integration confidence around the must-not-break queue paths. This is an application-level hardening phase, not an external observability-platform rollout.

</domain>

<decisions>
## Implementation Decisions

### Failure Visibility Model
- **D-01:** Add layered failure visibility now, combining worker logs, explicit failed-job listeners, and simple operator-facing health signals for queue backlog and repeated failures.
- **D-02:** Phase 4 should optimize for the single-operator reality: the system must surface silent worker failure modes without assuming a separate ops team or always-open dashboard.

### Retry And Idempotency Boundary
- **D-03:** Retry and idempotency hardening should focus first on the critical jobs most likely to duplicate side effects or fail silently in production rather than attempting to normalize every queue in one pass.
- **D-04:** The planner may prioritize the existing high-value async flows such as notifications, views flushing, and email delivery according to current production risk.

### Observability Implementation Style
- **D-05:** Start with structured application-level logging and queue metrics hooks inside the current services and worker runtime, not a full external logging/metrics stack.
- **D-06:** New observability should stay incremental, local to the current codebase, and testable through code-level verification and targeted integration coverage.

### Backlog And Health Signaling
- **D-07:** Backlog and failure detection should use lightweight threshold-based checks and scheduled health signals rather than introducing a full dashboard product in this phase.
- **D-08:** The planner may choose the exact signal transport, threshold storage, and scheduling mechanism as long as backlog risk and repeated job failure become operator-visible.

### Coverage Scope
- **D-09:** Extend integration coverage only around the must-not-break worker flows and the new failure/retry behavior, not every BullMQ job in the repo.
- **D-10:** Worker reliability verification should focus on catching silent failure, unsafe retry behavior, and queue registration/processing regressions on active production flows.

### the agent's Discretion
- The planner can choose the exact logging shape, listener hooks, and health-check entrypoints as long as they fit the existing architecture and do not require a platform rewrite.
- The planner can decide whether operator-facing health signals live in logs, scheduled summaries, queue checks, lightweight endpoints, or another in-repo mechanism, as long as the single operator can detect failure and backlog risk promptly.
- The planner can select the exact critical jobs and queue policies to harden first, provided the work remains incremental and clearly tied to `WORK-01` through `WORK-03`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - production-hardening goal, non-negotiables, and single-operator constraint
- `.planning/REQUIREMENTS.md` - Phase 4 requirement set (`WORK-01`..`WORK-03`)
- `.planning/ROADMAP.md` - Phase 4 goal, success criteria, and plan breakdown
- `.planning/STATE.md` - current project position and active focus

### Prior Phase Decisions
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md` - repo/CI/security baseline that worker hardening must fit
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md` - hardened API/auth boundaries that already protect queue-producing server routes
- `.planning/phases/03-test-foundation-and-critical-coverage/03-CONTEXT.md` - current test-stack and integration-boundary decisions
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md` - current automated worker/API coverage baseline and residual warnings

### Worker Runtime And Queue Contracts
- `worker/index.ts` - worker startup, queue registration, and lifecycle hooks
- `worker/lib/redis.ts` - worker Redis connectivity surface
- `worker/lib/email/email.service.ts` - email side-effect boundary relevant to retries and failure diagnosis
- `worker/workers/email.worker.ts` - async email delivery flow
- `worker/workers/notification.worker.ts` - async notification flow and likely failure-surfacing candidate
- `worker/workers/views.worker.ts` - must-not-break views flush flow already covered in Phase 3 integration tests
- `packages/queues/index.ts` - shared queue package public surface
- `packages/queues/lib/queues.ts` - BullMQ queue declarations and shared queue contracts
- `packages/queues/lib/redis.ts` - shared Redis connection and queue client behavior
- `portfolio/lib/queues/email.queue.ts` - producer-side email queue contract
- `portfolio/lib/queues/notification.queue.ts` - producer-side notification queue contract
- `portfolio/lib/queues/password.queue.ts` - producer-side password queue contract

### Existing Test And Verification Surfaces
- `worker/tests/integration/views.worker.test.ts` - current real Redis-backed worker coverage baseline
- `packages/queues/tests/integration/test-baseline.test.ts` - queue integration harness baseline
- `package.json` - root test/CI entrypoints that new worker verification should extend rather than bypass
- `worker/package.json` - worker-specific scripts and build surface

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `worker/index.ts` already centralizes worker startup and is the natural place for queue listener registration, graceful shutdown, and recurring health checks.
- `packages/queues/lib/queues.ts` and `packages/queues/lib/redis.ts` provide a shared contract layer that can anchor backlog inspection, queue metrics hooks, and queue-specific policy hardening.
- Phase 3 already established Redis-backed integration coverage for `worker/workers/views.worker.ts`, which gives this phase a real harness to extend rather than starting from scratch.
- Producer-side queue modules under `portfolio/lib/queues/` define the application seams where retry/idempotency assumptions need to remain compatible.

### Established Patterns
- Logging is still mostly `console.log`, `console.warn`, and `console.error`, so observability improvements should probably evolve that pattern instead of replacing it wholesale.
- The codebase currently lacks a structured logger or central worker health endpoint, which makes silent failure and backlog visibility the main operational gap.
- BullMQ is already the central async abstraction, so Phase 4 should improve listener behavior, retry safety, and health checks around it rather than adding a second async system.
- The single-operator project context makes lightweight but explicit failure signaling more valuable than broad infra complexity.

### Integration Points
- Worker startup and shutdown in `worker/index.ts`
- Queue contracts and Redis connections in `packages/queues/**`
- Queue producers in `portfolio/lib/queues/**`
- Existing test commands and real Redis/Postgres-backed integration harnesses introduced in Phase 3

</code_context>

<specifics>
## Specific Ideas

- Phase 4 should make silent failure materially harder by surfacing failed jobs, backlog growth, and repeated retries in places the operator can actually notice.
- Retry safety should be treated as a business-risk issue, not just a queue-settings issue, because some jobs can duplicate side effects if retried carelessly.
- Lightweight health checks and structured logs are preferable to a dashboard-heavy solution at this stage, provided they make worker state legible under real traffic.

</specifics>

<deferred>
## Deferred Ideas

- A full external observability stack, dashboards, or centralized alerting platform belongs to later observability-expansion work once the in-repo reliability baseline exists.
- Repo-wide normalization of every BullMQ queue policy is deferred; Phase 4 should stay focused on critical production flows first.

</deferred>

---

*Phase: 04-worker-reliability-and-observability*
*Context gathered: 2026-04-10*
