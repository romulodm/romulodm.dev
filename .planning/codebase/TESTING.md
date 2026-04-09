# Testing Patterns

**Analysis Date:** 2026-04-08

## Test Framework

**Runner:**
- No first-party test runner is configured in the checked-in workspace manifests
- No committed `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` files were found outside dependencies

**Assertion Library:**
- None established in repository source

**Run Commands:**
```bash
npm run lint --workspace portfolio      # Closest existing code-quality check in main app
npm run lint --workspace frontend       # Legacy frontend lint
npm run build --workspace worker        # Worker compile sanity check
npm run build --workspace portfolio     # Next.js production build check
```

## Test File Organization

**Location:**
- No first-party `*.test.*` or `*.spec.*` files were found in `frontend/`, `portfolio/`, `worker/`, or `packages/` once `node_modules`, `.next`, and `dist` are excluded

**Naming:**
- No repo-local naming convention exists yet for automated tests

**Structure:**
```text
Current state:
- application source exists
- automated test tree does not
- verification is currently biased toward manual checks, builds, and runtime observation
```

## Test Structure

**Observed Pattern:**
- Manual validation is embedded in route handlers and forms
- Runtime behavior appears to be verified through local app usage, worker logs, and webhook/job execution rather than automated suites

**Patterns:**
- Defensive request validation is a substitute for some missing unit tests
- Worker logs are used as operational feedback for async flows

## Mocking

**Framework:**
- None established

**Implication:**
- The first serious test addition will also need to choose a runner, setup style, mocking strategy, and possibly test database/container setup

## Fixtures and Factories

**Test Data:**
- No dedicated fixtures or factories directory exists
- Real content data lives under `portfolio/data/`, but it is production/content data rather than test scaffolding

## Coverage

**Requirements:**
- No coverage target or enforcement is configured

**Configuration:**
- No coverage tooling is committed

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present, despite `puppeteer` being installed in `portfolio/package.json`

## Highest-Value Gaps

**Authentication and session flows:**
- Areas: `portfolio/lib/auth.ts`, `portfolio/app/api/auth/**`
- Risk: login/registration/provider edge cases can regress without fast detection

**Comments, moderation, and notifications:**
- Areas: `portfolio/app/api/comments/route.ts`, `portfolio/lib/moderation/`, `worker/workers/notification.worker.ts`
- Risk: moderation false positives, rate limiting behavior, and queue payload mismatches are hard to verify safely by hand

**Newsletter and campaign dispatch:**
- Areas: `portfolio/lib/newsletter/newsletter.service.ts`, `worker/workers/email.worker.ts`
- Risk: multi-step async state transitions are easy to break and expensive to validate manually

**Donation webhooks:**
- Areas: `portfolio/app/api/donations/**`
- Risk: payment status handling depends on external callbacks and signature verification

**Uploads and translations:**
- Areas: `portfolio/app/api/uploads/presign/route.ts`, `portfolio/lib/translate.ts`
- Risk: credential/config regressions surface only at runtime

## Recommended Starting Point

- Add a runner for `portfolio/` first, since most product logic and API behavior live there.
- Start with server-focused integration tests around route handlers and service modules.
- Add worker tests next for queue payload handling and campaign state transitions.
- Treat Docker-backed Postgres/Redis test setup as likely necessary for realistic integration coverage.

---
*Testing analysis: 2026-04-08*
*Update when test patterns change*
