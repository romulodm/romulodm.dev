---
phase: 07
plan: 03
status: complete
source: 07-03-PLAN.md
created: 2026-04-10
---

# Plan 07-03 Summary

## Outcome

Wave 3 turned the critical test baseline into actual PR protection:
- added a scoped `validate-tests` job to `.github/workflows/pr.yml` so changed active surfaces now run the root unit, integration, and E2E commands that matter
- stabilized the Playwright smoke baseline for CI-style runs by pinning E2E to one worker and making redirect assertions wait explicitly for the localized landing page
- fixed unit-test drift in `packages/queues/lib/queues.test.ts` so the enforced baseline resolves the current TypeScript source instead of stale built output

## Key Files

- `.github/workflows/pr.yml`
- `packages/queues/lib/queues.test.ts`
- `portfolio/playwright.config.ts`
- `portfolio/tests/e2e/baseline.spec.ts`
- `portfolio/tests/e2e/auth-admin.spec.ts`

## Verification

Passed:
- `npm run build:portfolio`
- `npm run test:phase3`

Notes:
- The build still emits the pre-existing BullMQ critical-dependency warning.
- The test baseline still emits the existing deprecation warning for `environmentMatchGlobs`, and NextAuth debug logging remains enabled in the dev-style E2E runtime.

## Ready For

- Phase 7 close-out
