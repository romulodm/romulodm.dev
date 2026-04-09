# Roadmap: romulodm.dev Production Hardening

## Overview

This roadmap hardens the existing monorepo into a production-ready and open-source-safe baseline without changing its architecture. The work starts with repository safety and governance, then secures API and auth boundaries, adds broad automated verification, improves worker reliability, and finishes with measured performance and scalability tuning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: OSS Safety And Governance** - Make the repository safe to publish and establish CI/security guardrails (completed 2026-04-09)
- [ ] **Phase 2: API And Auth Hardening** - Secure public and admin-facing server boundaries
- [ ] **Phase 3: Test Foundation And Critical Coverage** - Add the automated test baseline across apps, packages, and key flows
- [ ] **Phase 4: Worker Reliability And Observability** - Make async processing visible, retry-safe, and production-diagnosable
- [ ] **Phase 5: Performance And Scalability Tuning** - Optimize the portfolio, database, and queues using measured production needs

## Phase Details

### Phase 1: OSS Safety And Governance
**Goal**: Make the monorepo safe to open-source and give every future change a reliable CI/security baseline.
**Depends on**: Nothing (first phase)
**Requirements**: [OSS-01, OSS-02, OSS-03, CI-01, CI-02, CI-03]
**Success Criteria** (what must be TRUE):
1. Operator can publish the repository publicly without tracked secrets, credentials, or sensitive runtime data exposure.
2. Every required environment variable is documented through an OSS-safe env contract.
3. Pull requests run scoped CI and dependency/security checks automatically.
4. Future secret leaks are blocked or flagged before merge/push.
**Plans**: 3 plans

Plans:
- [x] 01-01: Audit tracked files, runtime data, ignore rules, and env documentation for public release safety
- [x] 01-02: Add monorepo CI workflows with scoped checks and stable local/CI entrypoints
- [x] 01-03: Enable repository-level security controls and document release/publish safety expectations

### Phase 2: API And Auth Hardening
**Goal**: Make public and admin server boundaries consistently validated, authorized, rate-limited, and safe under public exposure.
**Depends on**: Phase 1
**Requirements**: [SEC-01, SEC-02, SEC-03, SEC-04]
**Success Criteria** (what must be TRUE):
1. High-risk API routes validate and sanitize input server-side before business logic runs.
2. Protected and admin routes enforce authentication and authorization consistently.
3. Public mutation endpoints apply rate limiting or equivalent abuse controls.
4. Error responses no longer leak secrets or unsafe internal details.
**Plans**: 4 plans

Plans:
- [ ] 02-01: Introduce shared validation and sanitization patterns for public and admin APIs
- [ ] 02-02: Review and harden authentication and authorization flows across admin/content paths
- [ ] 02-03: Add production-safe abuse controls to exposed mutation routes
- [ ] 02-04: Standardize safe public and admin error responses and logging boundaries

### Phase 3: Test Foundation And Critical Coverage
**Goal**: Establish automated verification for business logic, APIs, UI components, and the must-not-break user paths.
**Depends on**: Phase 2
**Requirements**: [TEST-01, TEST-02, TEST-03, TEST-04, TEST-05]
**Success Criteria** (what must be TRUE):
1. Shared utilities and business logic across the monorepo have repeatable automated unit coverage.
2. Critical API and integration paths have automated success and failure-path tests.
3. The public portfolio and authentication-critical flows are covered by E2E tests.
4. The legacy Vite frontend has component-level automated coverage for critical UI behavior.
**Plans**: 4 plans

Plans:
- [ ] 03-01: Set up shared testing infrastructure and commands for the monorepo
- [ ] 03-02: Add unit and component coverage for packages, worker helpers, and frontend/UI modules
- [ ] 03-03: Add API and integration tests for auth, Prisma-backed routes, and error scenarios
- [ ] 03-04: Add Playwright E2E coverage for the portfolio front door and auth-critical flows

### Phase 4: Worker Reliability And Observability
**Goal**: Ensure queue-backed async flows are visible, retry-safe, and diagnosable under production conditions.
**Depends on**: Phase 3
**Requirements**: [WORK-01, WORK-02, WORK-03]
**Success Criteria** (what must be TRUE):
1. Operator can detect worker failures, repeated job failures, and queue backlog risk without relying on silent behavior.
2. Critical jobs are safe to retry without duplicating side effects or corrupting state.
3. Worker logs and error signals are clear enough to support production diagnosis.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Review and harden BullMQ retry, concurrency, and idempotency behavior for critical jobs
- [ ] 04-02: Add queue and worker observability signals, structured logging, and failure surfacing
- [ ] 04-03: Add integration coverage for the worker's critical async flows

### Phase 5: Performance And Scalability Tuning
**Goal**: Improve portfolio responsiveness and production load handling using measured bottlenecks and the hardened baseline.
**Depends on**: Phase 4
**Requirements**: [PERF-01, PERF-02, PERF-03]
**Success Criteria** (what must be TRUE):
1. The portfolio app uses an intentional production caching/build strategy appropriate for real traffic.
2. High-value Prisma query paths are reviewed and improved with indexes or query changes where justified.
3. Queue throughput settings are tuned for production load instead of local defaults.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Review and optimize Next.js build, caching, and delivery strategy for the public portfolio
- [ ] 05-02: Measure and improve Prisma query/index hotspots
- [ ] 05-03: Tune queue throughput behavior and load-related worker settings

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. OSS Safety And Governance | 3/3 | Complete    | 2026-04-09 |
| 2. API And Auth Hardening | 0/4 | Not started | - |
| 3. Test Foundation And Critical Coverage | 0/4 | Not started | - |
| 4. Worker Reliability And Observability | 0/3 | Not started | - |
| 5. Performance And Scalability Tuning | 0/3 | Not started | - |
