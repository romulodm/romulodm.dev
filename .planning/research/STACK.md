# Stack Research

**Domain:** Production hardening for a public full-stack TypeScript monorepo
**Researched:** 2026-04-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 20 LTS or 22 LTS | Runtime baseline for app, worker, CI, and tooling | Current ecosystem support is strongest here for Next.js, Prisma, Playwright, and modern GitHub Actions runners |
| Next.js App Router | 14.x current-in-repo, upgrade deliberately later | Primary web app and API host | Keep the existing runtime stable first; use App Router caching, headers, and deployment guidance instead of a rewrite |
| Prisma ORM + PostgreSQL | Prisma 5.x current-in-repo | Data access, schema control, migrations, indexing | Prisma’s current optimization guidance emphasizes index tuning, overfetch reduction, bulk queries, and connection reuse rather than replacing the ORM |
| BullMQ + Redis | BullMQ 5.x current-in-repo | Durable async work, retries, queue visibility, load control | Official BullMQ guidance supports retries, rate limiting, metrics, and idempotent job design without changing the existing queue model |
| GitHub Actions | current hosted platform | CI, security checks, OSS hygiene | Best fit for a public GitHub repository with path filters, matrix jobs, dependency review, and native security features |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest + React Testing Library | current stable | Unit/component testing for packages, worker helpers, Vite frontend, and synchronous Next.js code | Use for business logic, utilities, components, and API-adjacent modules that do not require a browser |
| Playwright | current stable | End-to-end testing for the Next.js portfolio app | Use for public portfolio smoke paths, admin auth flows, and key user journeys where async server components are involved |
| Zod | current stable | Server-side validation schemas | Use at API boundaries and configuration validation points to replace ad hoc request validation |
| pino or structured logger equivalent | current stable | Consistent logs across app and worker | Use when replacing raw console logs in high-risk flows and when adding machine-readable production logs |
| dotenv-safe or env validation layer | current stable | Required-env enforcement | Use to keep public repos safe while failing fast in CI and production for missing secrets |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub dependency review action | Catch vulnerable dependency additions in pull requests | Best used on public repos with dependency graph enabled |
| GitHub secret scanning + push protection | Prevent future secret leaks | Especially important for an OSS repo with many integrations |
| npm workspaces + path-filtered workflows | Monorepo CI partitioning | Combine path filters with targeted jobs to keep CI fast enough to run consistently |
| Playwright CI container image | Stable browser execution in CI | Playwright recommends its Linux image and sequential workers in CI for reliability |

## Installation

```bash
# Core testing/security additions
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom vite-tsconfig-paths
npm install -D @playwright/test
npm install zod

# Optional structured logging / env safety
npm install pino
npm install -D dotenv-safe
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vitest | Jest | Use Jest only if a specific toolchain constraint demands it; Vitest fits both the Vite app and modern TS monorepo workflows more naturally |
| Playwright | Cypress | Use Cypress only if the team prioritizes browser-only interactive debugging over multi-browser coverage; Playwright is stronger for CI and full E2E reach |
| Zod schemas at boundaries | purely manual validation | Manual validation is acceptable only for very small low-risk inputs; boundary schemas scale better for public APIs |
| GitHub Actions matrix + path filters | single monolithic CI workflow | Use a monolithic workflow only if repo size stays tiny; this monorepo benefits from scoped jobs |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Ad hoc request validation in every route | Easy to miss edge cases and authorization mistakes in public APIs | Shared validation schemas and reusable auth guards |
| Silent queue retries without telemetry | Jobs can fail or back up without visibility | Retries plus metrics, alerts, and explicit failure logging |
| Storing runtime/session data inside the public repo tree | Dangerous for OSS safety and operational hygiene | Externalized runtime volumes and gitignored local state |
| Expanding integrations before env hygiene and CI are in place | Increases leak and regression surface | Harden secrets handling, tests, and CI first |

## Stack Patterns by Variant

**If the task is application correctness hardening:**
- Use Vitest for units/integration-style module tests
- Because the repo needs broad coverage quickly across packages, worker code, and frontend utilities

**If the task is real user-path verification:**
- Use Playwright against the Next.js app
- Because Next.js recommends E2E coverage for async server-component-heavy paths that unit runners do not model well

**If the task is worker reliability under production load:**
- Use BullMQ retries, idempotent job design, rate limiting, and metrics
- Because BullMQ’s own guidance is to make jobs safe to retry and observable instead of relying on one-shot execution

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@14.x` | `react@18.x` | Keep this stable while hardening; upgrade later only if justified by a specific need |
| `vitest` | `@vitejs/plugin-react`, `jsdom`, `vite-tsconfig-paths` | Matches Next.js and Vite testing guidance well |
| `@playwright/test` | GitHub Actions + Playwright container image | Strong CI path for stable browser testing |
| `prisma@5.x` | PostgreSQL + connection reuse/index tuning | Prisma guidance emphasizes query/index optimization and pooled client usage |

## Sources

- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)
- [Next.js caching and revalidation](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Next.js CDN caching guide](https://nextjs.org/docs/app/guides/cdn-caching)
- [Next.js headers config](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [BullMQ retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- [BullMQ rate limiting](https://docs.bullmq.io/guide/rate-limiting)
- [BullMQ metrics](https://docs.bullmq.io/guide/telemetry/metrics)
- [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)
- [Prisma query optimization](https://docs.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance)
- [Prisma Optimize recommendations](https://docs.prisma.io/docs/v6/optimize/recommendations)
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions matrix strategies](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [GitHub dependency review](https://docs.github.com/en/enterprise-cloud%40latest/code-security/concepts/supply-chain-security/about-dependency-review)
- [GitHub push protection](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enabling-push-protection-for-your-repository)

---
*Stack research for: production hardening for a public monorepo*
*Researched: 2026-04-08*
