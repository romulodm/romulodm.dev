# Architecture Research

**Domain:** Production hardening for a public full-stack TypeScript monorepo
**Researched:** 2026-04-08
**Confidence:** HIGH

## Recommended Architecture Approach

The recommended architecture for this domain is not a rewrite into more services. It is a hardened monorepo with explicit trust boundaries, test boundaries, and operational boundaries inside the existing app/worker/package structure.

For this repo specifically, the right move is to keep:
- the Next.js app as the public web/API surface
- the worker as the async execution surface
- shared packages as the contract layer

Then add stronger boundaries around them:
- validation/authz at API edges
- typed queue contracts and idempotent worker handlers
- structured logging and health visibility across app and worker
- dedicated CI lanes per app/package

## Major Components

### 1. Public Web Surface

- **Includes:** `portfolio/app/`, `portfolio/components/`, public routes, blog pages, portfolio pages
- **Responsibility:** Remain available, render fast, and expose only safe public data
- **Hardening focus:** caching, E2E smoke tests, security headers, safe public content rendering, dependency stability

### 2. Trusted API Boundary

- **Includes:** `portfolio/app/api/**/route.ts`
- **Responsibility:** Enforce auth, authorization, validation, rate limiting, and safe error handling
- **Hardening focus:** schema validation, reusable guards, consistent error responses, SSRF/upload protections, audit of admin-only routes

### 3. Domain Logic Layer

- **Includes:** `portfolio/lib/**`, worker service helpers, shared packages
- **Responsibility:** Hold reusable business rules instead of duplicating logic in handlers
- **Hardening focus:** unit tests, explicit contracts, reduced side effects, shared sanitization/validation helpers

### 4. Persistence Layer

- **Includes:** Prisma schema, migrations, shared DB package, query helpers
- **Responsibility:** Safe and efficient reads/writes with traceable schema evolution
- **Hardening focus:** indexes on real lookup paths, query overfetch reduction, transaction safety, integration tests with realistic DB flows

### 5. Async Execution Layer

- **Includes:** BullMQ producers and worker consumers
- **Responsibility:** Reliable deferred work with visible failures and safe retries
- **Hardening focus:** idempotent jobs, retry/backoff policy, queue health visibility, job metrics, explicit failed-job review path

### 6. Delivery and Governance Layer

- **Includes:** GitHub Actions, secret scanning, dependency review, env templates, repository hygiene
- **Responsibility:** Prevent unsafe changes from landing and make public release repeatable
- **Hardening focus:** PR checks, scoped jobs, artifacts, dependency/security gates, OSS-safe defaults

## Data Flow Patterns

### Public Request Flow

1. Request hits the Next.js route/page
2. Middleware and route logic decide whether the route is public or protected
3. Route-level validation/authz occurs before business logic
4. Domain logic executes against Prisma/shared helpers
5. Response is cached or returned with explicit policy
6. Important failures are logged with enough context to diagnose

### Admin Mutation Flow

1. Authenticated operator submits an admin action
2. Route handler verifies session and admin authorization
3. Input is validated with strict schema and semantic checks
4. DB mutation occurs transactionally where necessary
5. Side effects are queued, not performed inline where reliability would suffer
6. Audit-worthy events are logged

### Async Job Flow

1. App enqueues a typed job payload
2. Queue policy applies retries/backoff/rate limits
3. Worker processes the job with idempotent logic
4. External integrations are called only after local state is safe to retry
5. Completion/failure is recorded and surfaced through logs/metrics

## Suggested Build Order

### Phase 1 boundary
- Repository hygiene and CI governance
- Because unsafe publication blocks everything else

### Phase 2 boundary
- Validation/auth/rate-limiting hardening at API edges
- Because public exposure risk is highest here

### Phase 3 boundary
- Test harness foundations for unit/API/component/E2E coverage
- Because once boundaries are clearer, tests become more reliable and cheaper to maintain

### Phase 4 boundary
- Worker observability and async reliability improvements
- Because silent failure is one of the top must-not-break risks

### Phase 5 boundary
- Query, caching, and throughput optimizations
- Because performance/scalability work is safer after correctness and visibility are improved

## Architecture Patterns That Fit This Repo

### Contract-first boundaries
- Shared schemas/types for request payloads and queue jobs
- Best for reducing divergence between app, worker, and tests

### Idempotent async steps
- BullMQ explicitly recommends retry-safe job design
- Best for newsletter, notifications, and external side-effect flows

### Path-aware monorepo CI
- Split jobs by affected paths/apps/packages
- Best for keeping a broad repo testable without turning CI into a bottleneck

### Layered production hardening
- Repository safety -> API safety -> test baseline -> async reliability -> performance tuning
- Best for meeting the stated “security before scalability” constraint

## Architectural Anti-Patterns to Avoid

- Replacing the monorepo structure during hardening
- Mixing runtime/session state with tracked source
- Keeping all validation inside UI/client forms
- Treating retries as observability
- Optimizing query performance before tests and authorization boundaries are trustworthy

## Sources

- [Next.js production checklist](https://nextjs.org/docs/13/pages/building-your-application/deploying/production-checklist)
- [Next.js caching deep dive](https://nextjs.org/docs/app/deep-dive/caching)
- [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)
- [BullMQ metrics](https://docs.bullmq.io/guide/telemetry/metrics)
- [Prisma query optimization](https://docs.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance)
- Local brownfield map in `.planning/codebase/`

---
*Architecture research for: production hardening for a public monorepo*
*Researched: 2026-04-08*
