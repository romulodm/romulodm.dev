# Phase 4 Research: Worker Reliability And Observability

**Phase:** 4 - Worker Reliability And Observability
**Date:** 2026-04-10
**Status:** Ready for planning

## Research Objective

Determine the most effective incremental way to make the BullMQ-backed worker system visible, retry-safe, and production-diagnosable without rewriting the current architecture. The phase must close the silent-failure gap for a single operator, harden the highest-risk async flows first, and preserve compatibility with the Phase 3 test baseline.

## Repo-Specific Starting Point

- `worker/index.ts` already centralizes startup, recurring scheduling, lifecycle hooks, and simple worker listeners.
- The worker currently logs completed, failed, and error events, but there is no structured log contract, no queue health summary, and no operator-facing backlog/failure signal beyond console output.
- Shared queue contracts and default job options live in `packages/queues/lib/queues.ts`, while queue producers live in `portfolio/lib/queues/*.ts`.
- Current job defaults are broad and generic: five attempts by default in the shared queue package, with local overrides on some producers/workers.
- Phase 3 added a real Redis-backed harness and coverage for the views flush flow in `worker/tests/integration/views.worker.test.ts`, which makes worker-specific regression testing viable.
- Critical side-effectful flows include transactional email, campaign email, notifications/WhatsApp dispatch, and view flushing. Some of these can duplicate side effects if retries are not scoped carefully.
- The repo still uses mostly `console.log`, `console.warn`, and `console.error`, so observability improvements need to evolve that pattern rather than assuming a logging platform already exists.

## Key Research Findings

### 1. The main operational risk is not job execution itself, but invisible degradation

The current worker already attaches listeners for `completed`, `failed`, and `error`, but they only emit unstructured console output at the process boundary. There is no periodic queue-state summary, no repeated-failure thresholding, and no explicit signal when repeatable jobs stop draining or begin accumulating.

Planning implication:
- add explicit queue-health checks and failure aggregation rather than relying only on per-job logs
- surface backlog and repeated failure as first-class operator-visible events
- keep this in-repo and lightweight for a single-operator system

### 2. Retry safety should be queue-specific, not globally normalized in one pass

The shared queue package currently exports broad default retry behavior, but the actual business impact varies by job type. `campaignWorker` mutates recipient and campaign state, transactional email sends external side effects, and notification jobs can call outbound services. The right hardening target is the subset of jobs where retries can duplicate external effects or mask underlying failure.

Planning implication:
- review shared queue defaults and per-queue overrides together
- introduce targeted idempotency/retry guards for high-risk jobs first
- keep global queue defaults stable unless the planner finds a clear cross-cutting bug

### 3. `worker/index.ts` is the correct anchor for health and reliability wiring

Startup already verifies email service availability, schedules recurring jobs, attaches listeners, and performs graceful shutdown. That makes it the natural place to add queue-level monitoring, startup summaries, structured event hooks, and periodic health probes without scattering reliability logic across unrelated modules.

Planning implication:
- centralize worker observability and health orchestration in `worker/index.ts`
- avoid introducing a parallel health subsystem in the Next.js app unless it is explicitly required for operator visibility
- keep job-specific logic inside worker modules, but keep status aggregation at the worker entrypoint

### 4. Queue-state visibility should be driven by lightweight thresholds, not dashboards

The single-operator context and the current codebase both favor lightweight checks over infrastructure-heavy solutions. BullMQ already exposes the queue state needed for useful health signals: waiting counts, failed counts, delayed counts, repeatable job registration, and recent failure behavior. Phase 4 can build operator-meaningful signals from those primitives without adopting a dashboard product.

Planning implication:
- implement threshold-based checks for backlog and repeated failure
- make the signal transport something the current system can own directly: structured logs, lightweight summaries, or a small app-facing health surface
- defer external dashboards and centralized alerting to later observability-expansion work

### 5. Phase 3’s existing integration harness should be extended, not replaced

There is already real Redis-backed coverage for `views.worker.ts`, and the project now has consistent `Vitest` integration execution. Phase 4 should leverage that baseline to verify the new reliability hooks, not invent a second worker test strategy. The most valuable additions are integration checks for retry behavior, failure surfacing, and health/backlog logic.

Planning implication:
- build new verification around the current worker/queue integration setup
- keep tests focused on must-not-break flows and reliability behaviors introduced in this phase
- prefer deterministic queue-state tests over overly broad end-to-end simulations

### 6. Structured logging can be introduced incrementally around existing console usage

The codebase does not yet have a shared logger abstraction, but it does have consistent service boundaries where richer logs would pay off immediately: worker startup, job processing, job failure, queue-health checks, and recurring schedulers. A small internal logging helper that standardizes event names and context would materially improve production diagnosis without requiring a larger logging migration.

Planning implication:
- introduce a minimal worker-focused structured logging surface instead of replacing all logging in the repo
- log queue name, job id, job type, attempt count, and failure classification where available
- avoid logging sensitive job payload contents or secrets

### 7. The most valuable reliability flows are already visible in code

Current high-priority async flows are clear:
- transactional email through `QUEUE_TRANSACTIONAL`
- campaign email through `QUEUE_CAMPAIGN`
- notifications and daily-status scheduling through `QUEUE_NOTIFICATIONS`
- view flushing via repeatable notification jobs and Redis buffered state

These are enough to shape the plans without opening every queue consumer or inventing new scope.

Planning implication:
- keep Phase 4 centered on email, notifications, and views flush flows
- avoid expanding into every future or low-risk queue until the must-not-break signals are in place

## Recommended Plan Shape

The roadmap’s existing three-plan breakdown fits the codebase well.

### Plan 04-01: Retry, concurrency, and idempotency hardening for critical jobs

Focus:
- review shared queue defaults versus per-queue overrides
- harden retries and duplicate-side-effect behavior on the critical jobs first
- add explicit safeguards where retries are currently too generic or ambiguous

Key outcome:
- high-risk worker flows become safer to retry under real production conditions

### Plan 04-02: Worker observability and health surfacing

Focus:
- add structured worker/job logs
- add explicit failed-job and queue-state health signals
- surface backlog and repeatable-job health in a lightweight operator-friendly way

Key outcome:
- worker degradation stops being silent and becomes diagnosable without a full observability platform

### Plan 04-03: Reliability-focused worker integration coverage

Focus:
- extend the Redis-backed integration harness around the hardened flows
- verify failure surfacing, retry behavior, and queue-health checks for must-not-break jobs
- keep scope focused on the production-critical worker paths

Key outcome:
- Phase 4 changes are regression-resistant and testable, not just operational best effort

## Planning Constraints And Tradeoffs

### Keep architecture stable

Phase 4 should harden the current worker model, not replace BullMQ, move processing into the app, or adopt a separate monitoring platform.

### Prioritize visibility over completeness

The biggest production gap is silent failure. Planning should favor reliable signal paths and targeted safety over exhaustive queue coverage or a broad telemetry rollout.

### Treat retries as business behavior

Retry settings are not just operational tuning. For side-effectful jobs they affect correctness, duplication, and operator trust, so planning should tie retry/idempotency work to specific job types.

### Extend Phase 3 verification patterns

The new worker changes should fit the existing `Vitest` integration baseline and avoid adding a second worker-specific test system.

## Validation Architecture

Phase 4 validation should combine artifact checks, targeted integration verification, and queue-state behavior checks.

### Artifact-level validation

- verify structured worker reliability helpers or hooks exist and are wired from `worker/index.ts`
- verify critical queue/worker modules reflect the intended retry/idempotency policy changes
- verify lightweight health/backlog surfacing artifacts exist where planned

### Command-level validation

- targeted worker integration command(s) should run against real Redis-backed behavior
- root test commands should continue to work without bypassing the Phase 3 baseline

### Behavior-level validation

- failure-path behavior should become operator-visible
- backlog/repeated-failure conditions should emit explicit signals
- critical retry paths should avoid obviously duplicating side effects or corrupting state
- repeatable job registration and health checks should remain deterministic

## Risks To Watch During Planning

- overbuilding a dashboard/alerting system instead of solving the immediate silent-failure problem
- normalizing all queue behavior at once and creating unnecessary blast radius
- introducing structured logging that leaks sensitive job data
- adding health checks that are too noisy to be useful for a single operator
- planning tests that are too broad or flaky to maintain inside the current Redis-backed harness

## Sources

### Local Context
- `.planning/phases/04-worker-reliability-and-observability/04-CONTEXT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md`
- `worker/index.ts`
- `worker/lib/redis.ts`
- `worker/lib/email/email.service.ts`
- `worker/workers/email.worker.ts`
- `worker/workers/notification.worker.ts`
- `worker/workers/views.worker.ts`
- `worker/tests/integration/views.worker.test.ts`
- `packages/queues/index.ts`
- `packages/queues/lib/queues.ts`
- `packages/queues/lib/redis.ts`
- `packages/queues/tests/integration/test-baseline.test.ts`
- `portfolio/lib/queues/email.queue.ts`
- `portfolio/lib/queues/notification.queue.ts`
- `portfolio/lib/queues/password.queue.ts`
- `package.json`
- `worker/package.json`

---

## RESEARCH COMPLETE
