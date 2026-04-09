---
phase: 03
slug: test-foundation-and-critical-coverage
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-09
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest plus Playwright |
| **Config file** | `vitest.config.*` and `playwright.config.*` to be added in Wave 0 |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:phase3` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:phase3`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | TEST-01 | - | Shared Vitest/Playwright baseline exists for active monorepo surfaces | config | `npm run test:unit` | no - W0 | pending |
| 03-01-02 | 01 | 1 | TEST-01 | - | Root and per-surface test commands integrate with CI without reintroducing legacy frontend scope | command | `npm run test:phase3` | no - W0 | pending |
| 03-02-01 | 02 | 2 | TEST-01 | - | Shared business logic and utility modules across `portfolio/`, `worker`, and `packages` have fast repeatable unit coverage | unit | `npm run test:unit` | no - W0 | pending |
| 03-02-02 | 02 | 2 | TEST-01 | - | Active portfolio/shared component-style coverage exists where it protects production UI behavior | component | `npm run test:unit` | no - W0 | pending |
| 03-03-01 | 03 | 3 | TEST-02 | - | Prisma integration coverage runs against isolated Postgres with real schema behavior | integration | `npm run test:integration` | no - W0 | pending |
| 03-03-02 | 03 | 3 | TEST-02 / TEST-04 | - | BullMQ and API boundaries prove success, auth failure, validation failure, and error-path behavior with real Redis-backed and route-level tests | integration | `npm run test:integration` | no - W0 | pending |
| 03-04-01 | 04 | 4 | TEST-03 | - | Public portfolio front door remains functional in browser E2E coverage | e2e | `npm run test:e2e` | no - W0 | pending |
| 03-04-02 | 04 | 4 | TEST-03 | - | Authentication-critical control access remains functional in browser E2E coverage | e2e | `npm run test:e2e` | no - W0 | pending |

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` or equivalent - shared active-surface test baseline
- [ ] `playwright.config.ts` under `portfolio/` or equivalent - E2E baseline
- [ ] test bootstrap/fixture files for isolated Postgres and Redis-backed execution
- [ ] root scripts such as `test:unit`, `test:integration`, `test:e2e`, and `test:phase3`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser auth-critical flow still matches the operator’s intended control path | TEST-03 | Exact auth journey and environment credentials are deployment-contextual | Run the Playwright auth-critical spec in the target environment and confirm it matches the intended admin/control path without relying on brittle local-only assumptions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing framework/config dependencies
- [ ] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-09
