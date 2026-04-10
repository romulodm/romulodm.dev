# Phase 5: Performance And Scalability Tuning - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase improves production responsiveness and load handling for the active monorepo surfaces without changing the architecture or undoing the safety work already completed in earlier phases. The focus is deliberate caching/build behavior for the public portfolio, targeted Prisma query/index improvements on the highest-value paths, and conservative queue throughput tuning grounded in the new worker reliability baseline. This is a measured hardening phase, not a repo-wide optimization sweep.

</domain>

<decisions>
## Implementation Decisions

### Optimization Style
- **D-01:** Phase 5 should be measurement-first: review actual high-value bottlenecks and tune only the most meaningful paths instead of broadly optimizing by instinct.
- **D-02:** The planner may use code-level evidence, current runtime behavior, and production-adjacent heuristics where full live telemetry is unavailable, but changes should still be justified by likely impact.

### Next.js Caching Boundary
- **D-03:** The public portfolio and blog should become intentionally cacheable where content is read-heavy and stability matters, while admin, auth, and mutation-driven paths remain explicitly dynamic or uncached.
- **D-04:** The phase should treat current Next.js behavior as something to make deliberate and documented, not something to leave to defaults or incidental framework behavior.

### Prisma Tuning Scope
- **D-05:** Database tuning should focus first on the hottest public read paths and worker-critical query paths rather than attempting a repo-wide Prisma cleanup.
- **D-06:** Query and index improvements should stay narrow, measurable, and aligned with `PERF-02`, especially where public pages, admin dashboards, newsletter flows, or worker processing show obvious overfetching or scan risk.

### Queue Throughput Tuning Model
- **D-07:** Queue concurrency, limiter, and retry/load tuning should be conservative and tied to the must-not-break queues, using the Phase 4 worker reliability baseline as the safety guardrail.
- **D-08:** Throughput tuning should avoid speculative capacity jumps that could reintroduce silent failure, duplicate side effects, or provider pressure.

### Performance Scope Boundary
- **D-09:** Phase 5 should optimize only active production surfaces and avoid investing effort in the retiring `frontend/` app or unrelated in-flight UI changes already present in the repo.
- **D-10:** The planner may ignore legacy or unrelated worktree noise unless it directly affects active performance bottlenecks on `portfolio/`, `worker/`, or shared production packages.

### the agent's Discretion
- The planner can choose the exact measurement strategy, profiling commands, and bottleneck ranking method as long as the resulting work stays evidence-driven and incremental.
- The planner can select the specific Next.js caching primitives, Prisma query/index changes, and BullMQ throughput settings that best fit the current codebase, provided they preserve the architecture and prior phase guarantees.
- The planner can defer broader platform evolution, cross-surface cleanup, or non-critical performance polish that does not clearly improve the production baseline.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - overall production-hardening objective and non-negotiable system priorities
- `.planning/REQUIREMENTS.md` - Phase 5 requirement set (`PERF-01`..`PERF-03`)
- `.planning/ROADMAP.md` - Phase 5 goal, success criteria, and plan breakdown
- `.planning/STATE.md` - current project position and active focus

### Prior Phase Decisions
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md` - repo/CI/security baseline that performance work must preserve
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md` - hardened server boundaries that caching and query tuning must not bypass
- `.planning/phases/03-test-foundation-and-critical-coverage/03-CONTEXT.md` - current test-stack and verification baseline
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md` - active test coverage and residual warnings around build/runtime config
- `.planning/phases/04-worker-reliability-and-observability/04-CONTEXT.md` - worker reliability decisions that now constrain safe queue tuning
- `.planning/phases/04-worker-reliability-and-observability/04-VERIFICATION.md` - current worker reliability baseline and residual observability limits

### Portfolio Build, Data, And Queue Surfaces
- `portfolio/next.config.js` - current Next.js output/caching-adjacent config and existing warnings
- `portfolio/app/[locale]/blog/page.tsx` - public listing path and likely read-heavy cache candidate
- `portfolio/app/[locale]/blog/[slug]/page.tsx` - public detail path and likely read-heavy cache candidate
- `portfolio/app/api/posts/public/route.ts` - public content API path that may need query/caching review
- `portfolio/app/api/donations/ranking/route.ts` - read-heavy ranking path and likely query/index candidate
- `portfolio/app/[locale]/admin/**` - dynamic/admin surfaces that should remain explicitly uncached
- `portfolio/lib/views.ts` - current view-tracking and buffered persistence flow relevant to load handling
- `portfolio/lib/newsletter/newsletter.service.ts` - newsletter query path and enqueue flow relevant to database and queue throughput review

### Database And Queue Contracts
- `packages/database/prisma/schema.prisma` - current model/index baseline for Prisma tuning
- `packages/database/index.ts` - Prisma client entrypoint used across app and worker
- `packages/queues/lib/queues.ts` - current queue defaults, per-queue overrides, limiter/concurrency assumptions
- `packages/queues/lib/redis.ts` - shared Redis connection behavior
- `worker/index.ts` - worker startup and health baseline that queue tuning must preserve
- `worker/workers/email.worker.ts` - critical email throughput path
- `worker/workers/notification.worker.ts` - notification and repeatable-job throughput path
- `worker/workers/views.worker.ts` - buffered views flush path relevant to write load

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/next.config.js` already uses `standalone` output, but caching behavior for public content is still mostly implicit and should become intentional.
- Prisma already has a meaningful base index set in `packages/database/prisma/schema.prisma`, which means Phase 5 can focus on missing or misaligned hotspots rather than starting index design from scratch.
- Phase 4 made queue retry and identity behavior explicit in `packages/queues/lib/queues.ts`, giving this phase a safer baseline for conservative concurrency and limiter tuning.
- The current test and integration baseline from Phase 3 and Phase 4 gives planners room to make measured performance changes without losing automated safety rails.

### Established Patterns
- Public and admin surfaces are still mixed inside the same Next.js app, so Phase 5 should be careful to separate cacheable read paths from dynamic control surfaces rather than applying broad caching globally.
- Query-heavy paths exist across blog, comments, newsletter, donations, and admin pages, but not all of them are equally important to real traffic; the phase should rank them instead of touching everything.
- Worker throughput settings now exist in a more explicit form, but they are still tuned conservatively and should be adjusted carefully around provider pressure and single-operator observability.
- The repo still contains unrelated in-flight UI work, so planners should stay disciplined about performance-only scope.

### Integration Points
- Public portfolio/blog rendering in `portfolio/app/[locale]/**`
- Prisma-backed app routes and server page loaders in `portfolio/app/**` and `portfolio/lib/**`
- Shared schema/index definitions in `packages/database/prisma/schema.prisma`
- Queue defaults and worker processing in `packages/queues/**` and `worker/**`

</code_context>

<specifics>
## Specific Ideas

- Phase 5 should make public content delivery intentionally cacheable where safe, especially on the front-door portfolio and blog paths.
- Prisma review should start with read-heavy public pages and the small set of admin/worker paths that obviously combine relational includes, listing queries, or ranking/count behavior.
- Queue tuning should respect the new worker health model from Phase 4 so higher throughput does not come at the cost of silent backlog or provider overload.

</specifics>

<deferred>
## Deferred Ideas

- Repo-wide performance cleanup, full database audit coverage, or speculative optimization across every query is deferred in favor of measured high-impact tuning.
- Broader observability expansion such as historical performance dashboards or external alerting remains future work beyond this baseline phase.
- Any effort on the retiring `frontend/` app remains out of scope unless it directly blocks production deployment of the active surfaces.

</deferred>

---

*Phase: 05-performance-and-scalability-tuning*
*Context gathered: 2026-04-10*
