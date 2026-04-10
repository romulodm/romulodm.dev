# Phase 5: Performance And Scalability Tuning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 05-performance-and-scalability-tuning
**Areas discussed:** Optimization style, Next.js caching boundary, Prisma tuning scope, Queue throughput tuning model, Performance scope boundary

---

## Optimization Style

| Option | Description | Selected |
|--------|-------------|----------|
| Measure first, then tune the highest-value bottlenecks | Recommended. Keeps Phase 5 evidence-driven and incremental | yes |
| Broad optimization sweep across the repo | More work, but too speculative and noisy for this baseline | |
| Minimal performance work with no ranking or measurement | Lower effort, but too weak for a production-readiness phase | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 5 should use code-level evidence and production-adjacent heuristics to rank work instead of optimizing everything on principle.

---

## Next.js Caching Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Cache public read-heavy portfolio/blog paths, keep admin/auth dynamic | Recommended. Protects the front door without weakening control surfaces | yes |
| Apply broad caching across the app | Riskier because dynamic/admin paths are mixed into the same Next.js surface | |
| Leave caching mostly incidental | Too weak for a deliberate production baseline | |

**User's choice:** Auto-selected recommended option
**Notes:** The planner should make current Next.js runtime behavior intentional, especially on the public portfolio and blog routes.

---

## Prisma Tuning Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Focus on the hottest public reads and worker-critical queries first | Recommended. Keeps the work measurable and tied to real traffic | yes |
| Repo-wide Prisma/query cleanup | Broader, but too diffuse for this phase | |
| Index-only tuning with no query review | Incomplete because overfetching and relation shape also matter | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 5 should prioritize public content, admin hot paths, and worker-relevant queries where overfetching or scan risk is visible.

---

## Queue Throughput Tuning Model

| Option | Description | Selected |
|--------|-------------|----------|
| Tune concurrency and limiter settings conservatively around critical queues | Recommended. Uses Phase 4 reliability as the guardrail | yes |
| Aggressive throughput increase for all queues | Too risky after reliability work and provider-bound side effects | |
| Defer queue tuning entirely | Undershoots `PERF-03` | |

**User's choice:** Auto-selected recommended option
**Notes:** Throughput changes should be explicit, limited, and compatible with the new worker health and retry baseline.

---

## Performance Scope Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Optimize active production surfaces only | Recommended. Keeps Phase 5 aligned with deployment risk | yes |
| Spend time on retiring `frontend/` and unrelated in-flight UI work | Would dilute the last baseline hardening phase | |
| Expand Phase 5 into general polish and cleanup | Too broad for the roadmap goal | |

**User's choice:** Auto-selected recommended option
**Notes:** The active Next.js app, shared Prisma surfaces, and worker queues are in scope; the legacy `frontend/` remains out of scope.

---

## the agent's Discretion

- Planning can choose the exact measurement strategy, bottleneck ranking, and tuning commands as long as the resulting work is evidence-driven.
- Planning can decide which public routes, Prisma queries, and queue settings are the most valuable to tune first based on current code and likely production impact.
- Planning can defer broader performance polish, speculative optimizations, and platform-evolution work that does not clearly improve the production baseline.

## Deferred Ideas

- Full database/performance audit coverage across every route and query is deferred in favor of the highest-impact hotspots.
- Historical dashboards, centralized performance telemetry, and broader platform observability remain future work beyond this phase.
- The retiring `frontend/` app remains out of scope for Phase 5.
