# Requirements: romulodm.dev Production Hardening

**Defined:** 2026-04-08
**Core Value:** Safe public deployment of the existing monorepo, with the public portfolio staying up, the worker never failing silently, and admin/auth control remaining reliable.

## v1 Requirements

### Open Source Safety

- [x] **OSS-01**: Operator can publish the repository publicly without exposing secrets, credentials, or sensitive runtime data in tracked files
- [x] **OSS-02**: Operator has a complete `.env.example` or equivalent documented env contract for every required production secret and integration
- [x] **OSS-03**: Operator can rely on repository rules or tooling to block future secret leaks before they land in the public repo

### CI and Release Confidence

- [x] **CI-01**: Operator can run a single documented CI entrypoint locally and in GitHub Actions for the monorepo baseline
- [x] **CI-02**: Pull requests automatically run scoped checks for affected apps and packages
- [x] **CI-03**: Dependency and security review checks run automatically before changes are merged

### API and Access Security

- [ ] **SEC-01**: Public API routes validate and sanitize input server-side before executing business logic
- [ ] **SEC-02**: Protected and admin routes enforce authentication and authorization consistently across the Next.js app
- [ ] **SEC-03**: High-risk public mutation endpoints apply rate limiting or equivalent abuse controls
- [ ] **SEC-04**: API routes return safe error responses that do not leak secrets or sensitive internals

### Test Coverage

- [ ] **TEST-01**: Business logic and shared utilities across `portfolio/`, `worker/`, `packages/`, and `frontend/` have automated unit test coverage
- [ ] **TEST-02**: Critical Prisma queries and BullMQ worker flows have automated integration coverage
- [ ] **TEST-03**: The Next.js portfolio app has E2E coverage for public portfolio uptime paths and authentication-critical flows
- [ ] **TEST-04**: API endpoints have automated success, auth failure, validation failure, and error-path coverage
- [ ] **TEST-05**: The legacy Vite frontend has component-level automated test coverage for its critical UI behavior

### Worker Reliability and Observability

- [ ] **WORK-01**: Operator can detect worker failures, queue backlogs, and repeated job failures without relying on silent background behavior
- [ ] **WORK-02**: Critical BullMQ jobs are safe to retry without corrupting state or duplicating side effects
- [ ] **WORK-03**: Worker logs and error signals provide enough context to diagnose failures in production

### Performance and Scalability

- [ ] **PERF-01**: The public portfolio app uses a reviewed production caching and build strategy appropriate for real traffic
- [ ] **PERF-02**: High-value Prisma query paths are reviewed for overfetching, indexing, and obvious performance bottlenecks
- [ ] **PERF-03**: Queue concurrency, retry, and rate-limit settings are reviewed and tuned for production load rather than local defaults

## v2 Requirements

### Observability Expansion

- **OBS-01**: Operator has centralized structured logs and alerting beyond baseline production logging
- **OBS-02**: Operator has dashboards or historical metrics for queue throughput, API failures, and page health

### Coverage Expansion

- **COV-01**: Non-critical routes and UI paths have broader automated coverage beyond the critical baseline
- **COV-02**: Cross-browser and device matrix E2E coverage is added beyond smoke-level validation

### Platform Evolution

- **PLAT-01**: Legacy `frontend/` ownership, deployment status, or retirement path is fully clarified and executed
- **PLAT-02**: Major dependency/runtime upgrades are completed where useful after the baseline hardening phase

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting the monorepo architecture | Conflicts with the explicit hardening-not-rewrite constraint |
| Building major new product features during hardening | Production readiness and OSS safety take precedence |
| Chasing perfect or exhaustive coverage before release | The target is a production-ready baseline with highest-risk gaps closed first |
| Adding more external integrations during the hardening push | Expands the attack surface and slows baseline stabilization |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OSS-01 | Phase 1 | Complete |
| OSS-02 | Phase 1 | Complete |
| OSS-03 | Phase 1 | Complete |
| CI-01 | Phase 1 | Complete |
| CI-02 | Phase 1 | Complete |
| CI-03 | Phase 1 | Complete |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |
| TEST-03 | Phase 3 | Pending |
| TEST-04 | Phase 3 | Pending |
| TEST-05 | Phase 3 | Pending |
| WORK-01 | Phase 4 | Pending |
| WORK-02 | Phase 4 | Pending |
| WORK-03 | Phase 4 | Pending |
| PERF-01 | Phase 5 | Pending |
| PERF-02 | Phase 5 | Pending |
| PERF-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-09 after Phase 1 completion*
