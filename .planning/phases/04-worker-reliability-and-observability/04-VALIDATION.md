---
phase: 04
slug: worker-reliability-and-observability
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 04 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest integration baseline from Phase 3 |
| **Config file** | `vitest.config.integration.ts` |
| **Quick run command** | `npm run test:integration` |
| **Full suite command** | `npm run test:phase3` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:integration`
- **After every plan wave:** Run `npm run test:integration`
- **Before `/gsd-verify-work`:** Run `npm run test:phase3`
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | WORK-02 | T-4-01 | Critical queues use explicit retry, backoff, and identity policy where broad defaults are unsafe | integration | `npm run test:integration` | no - execute | pending |
| 04-01-02 | 01 | 1 | WORK-02 | T-4-02 / T-4-03 | Targeted worker handlers enforce retry-safe or duplicate-side-effect protection on must-not-break jobs | integration | `npm run test:integration` | no - execute | pending |
| 04-02-01 | 02 | 2 | WORK-03 | T-4-05 | Worker startup, queue events, and failures emit structured, non-sensitive diagnostic logs | integration | `npm run test:integration` | no - execute | pending |
| 04-02-02 | 02 | 2 | WORK-01 | T-4-04 / T-4-06 | Backlog growth, repeated failures, and repeatable-job drift emit operator-visible health signals | integration | `npm run test:integration` | no - execute | pending |
| 04-03-01 | 03 | 3 | WORK-01 / WORK-03 | T-4-07 | Redis-backed integration tests cover health summaries, failure surfacing, and operator-visible queue diagnostics | integration | `npm run test:integration` | no - execute | pending |
| 04-03-02 | 03 | 3 | WORK-02 | T-4-08 | Redis-backed integration tests catch regressions in retry-safe behavior and duplicate-side-effect protection | integration | `npm run test:integration` | no - execute | pending |

---

## Wave 0 Requirements

- [x] Existing Phase 3 Redis-backed Vitest integration harness remains the execution baseline
- [x] Root commands already exist for `test:integration` and `test:phase3`
- [x] Worker and queue integration fixtures are already available to extend
- [x] No new test framework or standalone observability test stack is required before execution

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator health-signal ergonomics remain clear enough for a single operator to notice and interpret under load | WORK-01 | Signal usefulness depends on real operational context, threshold tuning, and log readability rather than pure pass/fail mechanics | Run the worker with the new Phase 4 health signaling enabled, simulate a backlog or repeated-failure condition, and confirm the surfaced signal is obvious, actionable, and free of sensitive data |

---

## Validation Sign-Off

- [x] All tasks have automated verification commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all framework and fixture prerequisites
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
