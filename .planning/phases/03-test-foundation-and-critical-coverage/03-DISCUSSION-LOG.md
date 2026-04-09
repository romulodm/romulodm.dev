# Phase 3: Test Foundation And Critical Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 03-test-foundation-and-critical-coverage
**Areas discussed:** Test runner stack, Database integration test approach, BullMQ test boundary, E2E scope strictness, Legacy frontend handling

---

## Test Runner Stack

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest for unit/integration/component tests across the monorepo, plus Playwright for portfolio E2E | Recommended. Keeps the active surfaces on one coherent test stack while reserving browser E2E for the Next.js app | yes |
| Split test tools by app/package | Possible, but increases config drift and maintenance cost during the baseline hardening phase | |
| Keep testing choices open until planning | Defers too much foundation work for a phase that exists to establish the baseline | |

**User's choice:** Auto-selected recommended option
**Notes:** The user accepted the recommended stack through auto mode, so Phase 3 should standardize on `Vitest` for active monorepo test layers and `Playwright` for `portfolio/` E2E.

---

## Database Integration Test Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Real isolated Postgres test database | Recommended. Captures actual Prisma query and schema behavior instead of mock-only confidence | yes |
| Mock Prisma for most integration coverage | Faster, but misses real query semantics and schema issues | |
| Leave the database strategy open until planning | Avoids a choice now, but weakens the phase boundary | |

**User's choice:** Auto-selected recommended option
**Notes:** Integration tests should exercise Prisma against a real isolated Postgres test database.

---

## BullMQ Test Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Real Redis-backed integration tests for critical jobs plus unit tests for helpers | Recommended. Covers queue contracts and failure behavior without overusing mocks | yes |
| Mostly mocked BullMQ coverage | Simpler, but risks missing queue semantics and retry behavior | |
| Unit tests only, defer queue integration to Phase 4 | Too weak for a phase explicitly covering worker flows | |

**User's choice:** Auto-selected recommended option
**Notes:** The user accepted the recommended balance: real Redis-backed coverage for critical flows, unit tests for side-effect-free helpers.

---

## E2E Scope Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Must-not-break portfolio front door and auth-critical access only | Recommended. Matches the production baseline and keeps E2E scope disciplined | yes |
| Broad end-to-end journey matrix | More exhaustive, but too large for the baseline hardening phase | |
| Minimal smoke test only | Lower effort, but undershoots the must-not-break paths | |

**User's choice:** Auto-selected recommended option
**Notes:** E2E should focus on public portfolio uptime and authentication-critical control paths first.

---

## Legacy Frontend Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Remove `frontend/` testing from Phase 3 and mark it out of scope because the app is being retired | Treat the legacy frontend as retired scope and spend no new test effort there | yes |
| Keep the requirement on paper but defer it to a later cleanup/removal phase | Preserves the original requirement text, but leaves planning with conflicting scope signals | |
| Keep a minimal smoke-test expectation for `frontend/` anyway | Still invests in a surface the user says is going away | |

**User's choice:** Remove `frontend/` testing from Phase 3 and mark it out of scope because the app is being retired
**Notes:** The user explicitly overrode the original requirement here. Phase 3 planning and the roadmap/requirements should align to active production surfaces only.

---

## the agent's Discretion

- Exact config locations, fixture/factory setup, coverage thresholds, and CI split were left open for research and planning.
- Planning can choose the specific highest-risk API routes, Prisma queries, and BullMQ jobs as long as portfolio uptime, worker reliability, and auth control stay prioritized.

## Deferred Ideas

- Legacy `frontend/` removal remains important, but the removal work itself belongs outside Phase 3 testing scope.
