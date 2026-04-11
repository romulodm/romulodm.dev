# Roadmap: romulodm.dev Production Hardening

## Overview

This roadmap hardens the existing monorepo into a production-ready and open-source-safe baseline without changing its architecture. The work starts with repository safety and governance, then secures API and auth boundaries, adds broad automated verification, improves worker reliability, and finishes with measured performance and scalability tuning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: OSS Safety And Governance** - Make the repository safe to publish and establish CI/security guardrails (completed 2026-04-09)
- [x] **Phase 2: API And Auth Hardening** - Secure public and admin-facing server boundaries (completed 2026-04-09)
- [x] **Phase 3: Test Foundation And Critical Coverage** - Add the automated test baseline across apps, packages, and key flows (completed 2026-04-10)
- [x] **Phase 4: Worker Reliability And Observability** - Make async processing visible, retry-safe, and production-diagnosable (completed 2026-04-10)
- [x] **Phase 5: Performance And Scalability Tuning** - Optimize the portfolio, database, and queues using measured production needs (completed 2026-04-10)
- [x] **Phase 6: View Tracking And Worker Flow Closure** - Unify post-view tracking onto one reliable worker-backed path (completed 2026-04-10)
- [x] **Phase 7: Public API Hardening And CI Protection Closure** - Close remaining public API security gaps and enforce the critical test baseline in PRs (completed 2026-04-10)

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
- [x] 02-01: Introduce shared validation and sanitization patterns for public and admin APIs
- [x] 02-02: Review and harden authentication and authorization flows across admin/content paths
- [x] 02-03: Add production-safe abuse controls to exposed mutation routes
- [x] 02-04: Standardize safe public and admin error responses and logging boundaries

### Phase 3: Test Foundation And Critical Coverage
**Goal**: Establish automated verification for business logic, APIs, active UI surfaces, and the must-not-break user paths.
**Depends on**: Phase 2
**Requirements**: [TEST-01, TEST-02, TEST-03, TEST-04]
**Success Criteria** (what must be TRUE):
1. Shared utilities and business logic across the active monorepo production surfaces have repeatable automated unit coverage.
2. Critical API and integration paths have automated success and failure-path tests.
3. The public portfolio and authentication-critical flows are covered by E2E tests.
4. Legacy `frontend/` retirement does not block Phase 3 planning or dilute test investment away from active production surfaces.
**Plans**: 4 plans

Plans:
- [x] 03-01: Set up shared testing infrastructure and commands for the monorepo
- [x] 03-02: Add unit and component coverage for packages, worker helpers, and active portfolio/shared UI modules
- [x] 03-03: Add API and integration tests for auth, Prisma-backed routes, and error scenarios
- [x] 03-04: Add Playwright E2E coverage for the portfolio front door and auth-critical flows

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
- [x] 04-01: Review and harden BullMQ retry, concurrency, and idempotency behavior for critical jobs
- [x] 04-02: Add queue and worker observability signals, structured logging, and failure surfacing
- [x] 04-03: Add integration coverage for the worker's critical async flows

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
- [x] 05-01: Review and optimize Next.js build, caching, and delivery strategy for the public portfolio
- [x] 05-02: Measure and improve Prisma query/index hotspots
- [x] 05-03: Tune queue throughput behavior and load-related worker settings

### Phase 6: View Tracking And Worker Flow Closure
**Goal**: Unify the live post-view path onto one reliable worker-backed flow instead of split buffers and duplicate implementations.
**Depends on**: Phase 5
**Requirements**: [WORK-01, WORK-02, PERF-03, TEST-02]
**Success Criteria** (what must be TRUE):
1. Live portfolio traffic uses one authoritative post-view recording path instead of split Redis buffers and duplicate tracking implementations.
2. Worker-backed view flushing is the source of truth for persisted post views under real traffic.
3. Integration coverage verifies the end-to-end post-view flow from app interaction through Redis and worker persistence.
**Plans**: 3 plans

Plans:
- [x] 06-01: Canonicalize post-view recording and reduce the legacy API surface to wrapper-or-removal only
- [x] 06-02: Make the worker-backed views buffer the sole persistence path
- [x] 06-03: Add integration coverage proving the unified live flow reaches worker persistence

### Phase 7: Public API Hardening And CI Protection Closure
**Goal**: Close the remaining live public API security gaps and make the critical automated test baseline enforceable on pull requests.
**Depends on**: Phase 6
**Requirements**: [SEC-01, SEC-03, SEC-04, TEST-01, TEST-02, TEST-03, TEST-04]
**Success Criteria** (what must be TRUE):
1. Remaining live public mutation routes use the shared validation, rate-limit, and safe-error patterns introduced in Phase 2.
2. Donation and newsletter public API paths have automated integration coverage for success, validation, auth, and failure behavior where applicable.
3. Critical unit, integration, and E2E suites run through PR validation so the test baseline actively protects merges.
**Plans**: 3 plans

Plans:
- [x] 07-01: Migrate the remaining public donation and newsletter mutation routes onto the shared API hardening boundary
- [x] 07-02: Add explicit integration coverage for the remaining public mutation route contracts
- [x] 07-03: Enforce the critical root test baseline in scoped PR validation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. OSS Safety And Governance | 3/3 | Complete    | 2026-04-09 |
| 2. API And Auth Hardening | 4/4 | Complete | 2026-04-09 |
| 3. Test Foundation And Critical Coverage | 4/4 | Complete | 2026-04-10 |
| 4. Worker Reliability And Observability | 3/3 | Complete | 2026-04-10 |
| 5. Performance And Scalability Tuning | 3/3 | Complete | 2026-04-10 |
| 6. View Tracking And Worker Flow Closure | 3/3 | Complete | 2026-04-10 |
| 7. Public API Hardening And CI Protection Closure | 3/3 | Complete | 2026-04-10 |
