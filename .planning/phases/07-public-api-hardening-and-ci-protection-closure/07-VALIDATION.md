---
phase: 07
slug: public-api-hardening-and-ci-protection-closure
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 07 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing Vitest integration baseline plus root test scripts and GitHub Actions workflow checks |
| **Config file** | `vitest.config.integration.ts`, `vitest.config.ts`, `portfolio/playwright.config.ts`, `.github/workflows/pr.yml` |
| **Quick run command** | `npm run test:integration` |
| **Full suite command** | `npm run test:integration && npm run build:portfolio && npm run test:phase3` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific verification command
- **After every plan wave:** Run that wave's primary verification command
- **Before `/gsd-verify-work`:** Run `npm run test:integration`, `npm run build:portfolio`, and `npm run test:phase3`
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SEC-01 / SEC-03 / SEC-04 | T-7-01 / T-7-02 | PIX and Stripe create routes validate, rate-limit, and return safe public failures through shared helpers | integration | `npm run test:integration` | no - execute | pending |
| 07-01-02 | 01 | 1 | SEC-01 / SEC-03 / SEC-04 | T-7-03 | Newsletter subscribe preserves anti-enumeration while adopting shared validation and abuse controls | integration | `npm run test:integration` | no - execute | pending |
| 07-02-01 | 02 | 2 | TEST-04 | T-7-04 / T-7-05 | Donation route contracts are covered for success, validation failure, rate limiting, and safe provider error behavior | integration | `npm run test:integration` | no - execute | pending |
| 07-02-02 | 02 | 2 | TEST-04 | T-7-03 / T-7-05 | Newsletter subscribe contract is covered for success, validation failure, abuse control, and safe error behavior | integration | `npm run test:integration` | no - execute | pending |
| 07-03-01 | 03 | 3 | TEST-01 / TEST-03 | T-7-06 / T-7-07 | Scoped PR validation runs the critical root test baseline for affected surfaces instead of build/lint only | build | `npm run test:phase3` | no - execute | pending |
| 07-03-02 | 03 | 3 | TEST-01 / TEST-03 / TEST-04 | T-7-07 | Portfolio and shared-surface workflow changes still compile and integrate cleanly with the app baseline | build | `npm run build:portfolio` | no - execute | pending |

---

## Wave 0 Requirements

- [x] Root test scripts already exist for unit, integration, and E2E verification
- [x] GitHub Actions PR validation workflow already exists and is scoped by changed surface
- [x] Integration test harness already covers Next.js route handlers and shared Redis/Postgres-backed behavior
- [x] No new test framework or CI platform is required before execution

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pull request required-check ergonomics remain acceptable for day-to-day development | TEST-01 / TEST-03 / TEST-04 | Local commands cannot fully simulate GitHub branch protection and contributor experience | Open a representative PR after Phase 7 lands, confirm the changed-surface jobs run as expected, and verify the enforced checks are neither missing nor obviously over-broad for routine changes |

---

## Validation Sign-Off

- [x] All tasks have automated verification commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all framework and CI prerequisites
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-10
