# Phase 7 Research: Public API Hardening And CI Protection Closure

**Phase:** 7 - Public API Hardening And CI Protection Closure
**Date:** 2026-04-10
**Status:** Ready for planning

## Research Objective

Close the last milestone blockers identified in the `v1.0` audit by finishing the shared public API hardening architecture and making the critical automated test baseline enforceable in pull requests. The work must stay incremental, preserve the existing route/service structure, and use the root test scripts as the canonical CI surface instead of creating a parallel workflow.

## Repo-Specific Starting Point

- Phase 2 already introduced shared request parsing, sanitization, safe error responses, and Redis-backed rate limiting through `portfolio/lib/api-validation.ts`, `portfolio/lib/api-errors.ts`, and `portfolio/lib/rate-limit.ts`.
- Several live public mutation routes still sit outside that shared boundary:
  - `portfolio/app/api/donations/pix/create/route.ts`
  - `portfolio/app/api/donations/stripe/create-intent/route.ts`
  - `portfolio/app/api/newsletter/subscribe/route.ts`
- The donation routes currently trust ad hoc `req.json()` payload handling and do not consistently shape public provider failures through the shared safe-error contract.
- The newsletter subscribe route already has anti-enumeration intent and basic abuse control, but it still uses route-local parsing, validation, IP handling, and error responses.
- The root `package.json` already exposes `test:unit`, `test:integration`, `test:e2e`, and `test:phase3`, while `.github/workflows/pr.yml` currently enforces only build/lint-oriented scoped checks.
- The existing PR workflow already uses `dorny/paths-filter`, so Phase 7 can extend the current change-scoped pattern instead of redesigning CI from scratch.

## Key Research Findings

### 1. The remaining API gaps are architectural exceptions, not missing primitives

The shared hardening helpers already exist and are used by Phase 2-hardened routes such as comments voting and admin mutation paths. The donation and newsletter routes are now the outliers. That means Phase 7 should focus on finishing adoption rather than inventing a new boundary style.

Planning implication:
- migrate the remaining live public mutation routes onto the existing shared helper stack
- prefer the same parse -> sanitize -> rate-limit -> safe-error flow already established elsewhere
- keep route handlers thin and let domain/provider services stay focused on business behavior

### 2. PIX and Stripe create routes should be treated as equally sensitive mutation surfaces

Both donation endpoints create pending donation records and interact with external payment infrastructure. Even though downstream providers validate some inputs, the application still owns request parsing, abuse control, persisted data shape, and the error information exposed publicly.

Planning implication:
- apply consistent schema-driven validation to both donation routes
- add shared rate limiting keyed by request IP for both flows
- wrap provider failures and Prisma errors in safe public responses with preserved internal logs

### 3. The newsletter route already has the right user-facing behavior but the wrong implementation boundary

`/api/newsletter/subscribe` already attempts anti-enumeration by returning the same success message when the subscription call succeeds. The gap is not the product behavior; it is the route-local implementation that bypasses the shared validation and error helpers.

Planning implication:
- preserve anti-enumeration messaging as a first-class acceptance criterion
- move parsing, email validation, IP extraction, and rate limiting onto the shared helpers
- add tests that prove both input validation and safe public messaging still hold

### 4. API coverage should focus on real contract behavior, not generic unit-level duplication

The milestone audit calls out missing route protection and missing API path coverage. The best verification target is integration-level route testing for donation and newsletter flows, including success, validation failure, rate-limit handling, and safe external failure shaping where applicable.

Planning implication:
- add or extend targeted integration tests near the existing API integration suite
- mock provider boundaries and rate-limit/auth helpers only where necessary to isolate route contracts
- ensure the new tests prove the shared Phase 2 boundary is actually being used

### 5. PR protection should enforce the existing root test baseline through scoped fan-out

The root scripts already encode the critical baseline: unit coverage, integration coverage, and E2E coverage. The PR workflow's real gap is that these scripts are not part of merge protection yet. Because the workflow already detects change scope, the lowest-risk path is to fan those root commands into the relevant jobs rather than create a second CI-only test script tree.

Planning implication:
- keep `package.json` scripts as the source of truth
- make portfolio-impacting changes run the integration and E2E checks that protect the public front door and API layer
- make worker/packages/root changes run the unit and integration baseline where those surfaces are affected

### 6. CI scoping needs to stay conservative but still close the audit gap

Running the full monorepo test matrix on every PR would protect merges, but it would also add cost and noise to the public repo baseline. The current workflow already splits packages, worker, portfolio, and frontend by change scope, which is enough to preserve performance while still adding missing test gates.

Planning implication:
- preserve the existing scoped jobs structure
- add test commands to the impacted jobs rather than replacing the workflow layout
- allow root and shared-package changes to fan out to broader validation when appropriate

### 7. Phase 7 naturally breaks into three execution waves

The work clusters cleanly into:
- route hardening for donation and newsletter surfaces
- targeted route coverage proving the new public API contract
- GitHub Actions updates that enforce the critical root test baseline

Planning implication:
- use a three-plan structure aligned with those execution buckets
- keep the CI enforcement plan last so it lands on top of the new route tests instead of referencing missing coverage

## Recommended Plan Shape

### Plan 07-01: Finish public mutation route hardening

Focus:
- migrate PIX and Stripe donation create routes onto shared validation, abuse-control, and safe-error helpers
- migrate newsletter subscribe onto the same shared boundary without losing anti-enumeration behavior
- preserve the existing business/service architecture while removing route-local ad hoc handling

### Plan 07-02: Add explicit API integration coverage for the remaining public mutation flows

Focus:
- add success and failure-path integration tests for donation and newsletter routes
- verify validation, rate limiting, and safe error shaping on the remaining public mutation surfaces
- keep the tests aligned with the shared route contract instead of provider implementation details

### Plan 07-03: Enforce the critical test baseline in scoped PR validation

Focus:
- extend `.github/workflows/pr.yml` so changed surfaces run the root scripts that matter
- keep CI scoped by changed surface while ensuring unit, integration, and E2E baselines actively protect merges
- avoid creating parallel CI-only orchestration outside `package.json`

## Validation Architecture

Phase 7 validation should combine route-level integration verification with workflow-level build and script checks.

- `npm run test:integration` should remain the primary verification for the new donation/newsletter route coverage
- `npm run test:phase3` is the strongest existing expression of the critical test baseline and should inform CI enforcement decisions
- `npm run build:portfolio` should remain part of final verification because the affected routes and Playwright scope live in the Next.js app

## Sources

### Local Context
- `.planning/phases/07-public-api-hardening-and-ci-protection-closure/07-CONTEXT.md`
- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `package.json`
- `.github/workflows/pr.yml`
- `portfolio/lib/api-validation.ts`
- `portfolio/lib/api-errors.ts`
- `portfolio/lib/rate-limit.ts`
- `portfolio/app/api/donations/pix/create/route.ts`
- `portfolio/app/api/donations/stripe/create-intent/route.ts`
- `portfolio/app/api/newsletter/subscribe/route.ts`
- `portfolio/app/api/comments/[id]/vote/route.ts`
- `portfolio/tests/integration/api/comments-vote.route.test.ts`

---

## RESEARCH COMPLETE
