---
phase: 06
slug: view-tracking-and-worker-flow-closure
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 06 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing Vitest integration harness plus app/worker build checks |
| **Config file** | `vitest.config.integration.ts` plus existing Next.js and TypeScript build configs |
| **Quick run command** | `npm run test:integration` |
| **Full suite command** | `npm run test:integration && npm run build:portfolio && npm run build:queues && npm run build:worker` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:integration`
- **After every plan wave:** Run that wave's primary verification command
- **Before `/gsd-verify-work`:** Run `npm run test:integration && npm run build:portfolio && npm run build:queues && npm run build:worker`
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | WORK-02 / PERF-03 | T-6-01 / T-6-02 | Canonical view-recording logic is centralized and no longer forks across independent app and API implementations | integration | `npm run test:integration` | no - execute | pending |
| 06-01-02 | 01 | 1 | WORK-02 | T-6-02 / T-6-03 | Any retained legacy route delegates to the canonical path instead of owning its own Redis buffer or direct flush behavior | build | `npm run build:portfolio` | no - execute | pending |
| 06-02-01 | 02 | 2 | WORK-01 / PERF-03 | T-6-04 / T-6-05 | Worker-backed periodic flush is the only persistence boundary for post views | integration | `npm run test:integration` | no - execute | pending |
| 06-02-02 | 02 | 2 | WORK-01 / WORK-02 | T-6-05 / T-6-06 | Shared queue and worker runtime still compile cleanly after removal of legacy buffer/flush assumptions | build | `npm run build:queues && npm run build:worker` | no - execute | pending |
| 06-03-01 | 03 | 3 | TEST-02 | T-6-07 / T-6-08 | Integration coverage proves canonical view recording reaches Redis and persists through the worker flush path | integration | `npm run test:integration` | no - execute | pending |
| 06-03-02 | 03 | 3 | TEST-02 / WORK-01 | T-6-08 | Any retained compatibility surface is covered and shown to converge on the same canonical worker-backed flow | integration | `npm run test:integration` | no - execute | pending |

---

## Wave 0 Requirements

- [x] Existing Redis/Postgres-backed Vitest integration infrastructure already exists
- [x] Existing worker flush tests provide a base harness to extend
- [x] Root verification commands already cover app, queue, and worker builds
- [x] No new test framework or external infrastructure is required before execution

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public blog post views behave plausibly under real browsing sessions without obvious double-counting or client breakage | WORK-02 / PERF-03 | Local integration tests cannot fully represent real browser/session repetition behavior across deploys | Deploy the Phase 6 changes, open a published blog post in a clean browser session, refresh and revisit within the dedupe window, then confirm counts do not jump unexpectedly and continue to persist through the worker flush cycle |

---

## Validation Sign-Off

- [x] All tasks have automated verification commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all framework and build prerequisites
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
