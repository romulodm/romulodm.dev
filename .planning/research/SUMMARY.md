# Project Research Summary

**Project:** romulodm.dev Production Hardening
**Domain:** Production hardening for a public full-stack TypeScript monorepo
**Researched:** 2026-04-08
**Confidence:** HIGH

## Executive Summary

This project is not a greenfield product build; it is a production-hardening and open-source-safety effort for an existing Next.js + Prisma + BullMQ monorepo. The strongest current guidance is to keep the architecture, strengthen boundary controls, and build a security-first verification pipeline around it instead of attempting a platform rewrite.

The recommended approach is layered. First make the repository safe to publish: remove secrets and runtime data exposure, standardize env templates, and enable repository-level security protections. Then harden public API and auth boundaries, establish CI and automated tests for critical flows, and only after that optimize worker throughput, queries, and caching using measured bottlenecks.

The key risk is false confidence: adding some tests or retries without addressing validation, authorization, observability, and repo hygiene would still leave the monorepo unsafe to publish and fragile in production. The right roadmap starts with OSS safety and governance, then correctness/security, then worker reliability, then scalability tuning.

## Key Findings

### Recommended Stack

The existing stack is already viable for production hardening. Keep Next.js App Router for the public web surface, Prisma/PostgreSQL for persistence, and BullMQ/Redis for async work. Use Vitest + React Testing Library for unit/component coverage, Playwright for critical E2E paths, GitHub Actions for monorepo CI, and schema-based validation at server boundaries.

**Core technologies:**
- Node LTS — runtime baseline for stable builds and CI
- Vitest — unit/component coverage across packages, worker helpers, and frontend code
- Playwright — browser-level coverage for must-not-break portfolio and auth flows
- GitHub Actions — path-filtered CI, dependency review, and security enforcement
- BullMQ metrics/retries/idempotency patterns — worker reliability without architecture changes

### Expected Features

For this domain, the “features” are hardening capabilities rather than end-user product features.

**Must have (table stakes):**
- Secret-safe repository hygiene — users and maintainers expect a public repo to be safe by default
- Automated CI with security/test gates — required for repeatable production hardening
- Critical-path test coverage — required for portfolio uptime, auth safety, and worker confidence
- Server-side validation/access control/rate limiting — required for a public API surface
- Worker failure visibility — required because silent failure is one of the worst outcomes

**Should have (competitive):**
- Path-aware monorepo CI — keeps the pipeline fast enough to trust
- Explicit OSS release checklist — reduces publish-time mistakes
- Production-grade structured logs for app and worker — valuable for a single operator

**Defer (v2+):**
- Major architectural cleanup
- Broad non-critical coverage expansion before high-risk flows are stable
- Larger platform changes not directly tied to production baseline safety

### Architecture Approach

The architecture should remain a monorepo with clear boundaries: Next.js public surface, API boundary, shared domain helpers, Prisma persistence, BullMQ async execution, and GitHub-based delivery governance. The hardening work should reinforce those boundaries rather than rearrange them.

**Major components:**
1. Public web surface — portfolio/blog routes that must stay up
2. Trusted API boundary — auth, validation, authorization, rate limiting
3. Async execution layer — BullMQ producers/consumers with visible failures
4. Delivery/governance layer — CI, secret scanning, dependency review, repo hygiene

### Critical Pitfalls

1. **Secret-safe release treated as docs work** — avoid by auditing tracked files/runtime data before publishing
2. **Client-side validation mistaken for security** — avoid with server-side schemas and semantic checks
3. **Queue retries without visibility or idempotency** — avoid with explicit retry policy, metrics, and retry-safe jobs
4. **Broken/inconsistent authorization** — avoid with centralized guards and auth-negative tests
5. **Monorepo CI too broad or too slow** — avoid with path filters and scoped jobs

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: OSS Safety And Governance
**Rationale:** Public release safety blocks everything else.
**Delivers:** Secret audit/remediation, runtime-data cleanup, `.env.example`, `.gitignore` improvements, repository security settings, CI skeleton
**Addresses:** repo safety, dependency review, push protection
**Avoids:** accidental public exposure and unsafe-by-default publishing

### Phase 2: API And Auth Hardening
**Rationale:** Public exposure risk is highest at route boundaries.
**Delivers:** validation schemas, stronger auth/access-control review, rate limiting, safer error handling
**Uses:** existing Next.js routes and helpers
**Implements:** trusted API boundary hardening

### Phase 3: Test Foundation And Critical Coverage
**Rationale:** Once boundaries are clearer, tests become durable instead of flaky.
**Delivers:** Vitest setup, component/unit coverage, API tests, Playwright E2E baseline
**Addresses:** must-not-break portfolio and auth flows

### Phase 4: Worker Reliability And Observability
**Rationale:** Worker silent failure is a stated top risk.
**Delivers:** queue metrics/logging, retry/backoff review, idempotency improvements, integration tests for worker flows
**Uses:** BullMQ retry/metrics guidance
**Implements:** async execution hardening

### Phase 5: Performance And Scalability Tuning
**Rationale:** Optimize after security/correctness/visibility are trustworthy.
**Delivers:** Prisma query/index tuning, caching review, worker concurrency/rate-limit tuning, build/runtime optimization

### Phase Ordering Rationale

- Repository safety must come before open-sourcing.
- API boundary correctness must come before broad automation.
- Tests are most useful after boundary behavior is stabilized.
- Worker reliability needs both tests and observability, not just retries.
- Performance tuning is safer and more effective once the baseline is measured and protected.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** repository security feature configuration may vary depending on GitHub plan/features enabled
- **Phase 4:** queue metrics/alerting implementation details depend on chosen logging/telemetry stack
- **Phase 5:** exact index/query changes should be driven by measured hotspots, not generic assumptions

Phases with standard patterns (skip research-phase):
- **Phase 2:** validation/auth/rate limiting patterns are well-established
- **Phase 3:** Vitest/Playwright/GitHub Actions setup patterns are well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on current official docs from Next.js, BullMQ, Prisma, GitHub, and Playwright |
| Features | HIGH | Hardening capabilities are well-established for public repos and production baselines |
| Architecture | HIGH | The safest recommendation is to preserve the existing architecture and reinforce boundaries |
| Pitfalls | HIGH | Strong overlap between OWASP, GitHub security guidance, and queue/database production guidance |

**Overall confidence:** HIGH

### Gaps to Address

- Exact GitHub security features available may depend on repository/account settings
- Performance work needs real measurements from this repo before final prioritization inside later phases
- Legacy `frontend/` publish/deployment status should be clarified during requirements and roadmap planning

## Sources

### Primary (HIGH confidence)
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)
- [Next.js caching and revalidation](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [BullMQ retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- [BullMQ metrics](https://docs.bullmq.io/guide/telemetry/metrics)
- [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)
- [Prisma query optimization](https://docs.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance)
- [GitHub workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub matrix jobs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [GitHub dependency review](https://docs.github.com/en/enterprise-cloud%40latest/code-security/concepts/supply-chain-security/about-dependency-review)
- [GitHub push protection](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enabling-push-protection-for-your-repository)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)

### Secondary (MEDIUM confidence)
- Local codebase map in `.planning/codebase/` — used to align research with the real monorepo shape

---
*Research completed: 2026-04-08*
*Ready for roadmap: yes*
