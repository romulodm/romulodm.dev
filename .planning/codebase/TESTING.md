# Testing

## Summary

The repository uses Vitest for unit and integration coverage and Playwright for browser coverage.
Testing is orchestrated from the workspace root, with shared aliases defined in `testing/vitest.shared.ts`.

## Core test entrypoints

- `npm run test:unit` uses `vitest.config.ts`
- `npm run test:integration` uses `vitest.config.integration.ts`
- `npm run test:e2e` delegates to `portfolio/playwright.config.ts`
- `npm run ci:packages`, `npm run ci:portfolio`, and `npm run ci:worker` provide build and lint checkpoints before or around the tests

## Unit test structure

- Unit tests are included from `portfolio/**/*.test.ts`, `portfolio/**/*.test.tsx`, `worker/**/*.test.ts`, `packages/database/**/*.test.ts`, and `packages/queues/**/*.test.ts`
- Current examples include `portfolio/components/auth/schemas.test.ts`, `portfolio/lib/utils.test.ts`, and `worker/lib/email/templates.test.ts`
- Baseline sanity tests exist in `portfolio/tests/unit/test-baseline.test.ts` and `worker/tests/unit/test-baseline.test.ts`

## Integration test structure

- Integration tests are included from `portfolio/tests/integration/**/*.test.ts`, `worker/tests/integration/**/*.test.ts`, `packages/database/tests/integration/**/*.test.ts`, and `packages/queues/tests/integration/**/*.test.ts`
- Portfolio integration coverage currently targets `admin-resync`, `auth-register`, `comments-vote`, `donations-create`, `newsletter-subscribe`, `post-view`, and `views.recording`
- Worker integration coverage includes email delivery behavior, views flushing, and worker observability
- Database and queue packages currently have baseline or round-trip style coverage

## Browser and end-to-end coverage

- Playwright lives under `portfolio/tests/e2e`
- The configured specs are `baseline.spec.ts` and `auth-admin.spec.ts`
- `portfolio/playwright.config.ts` boots the Next.js app on `http://127.0.0.1:3100`
- The browser suite seeds fallback auth env vars in the Playwright web server config

## Shared setup and conventions

- Aliases such as `@`, `@romulo/database`, and `@romulo/queues` are defined in `testing/vitest.shared.ts`
- Integration runs are serialized with `maxWorkers: 1` in `vitest.config.integration.ts`
- DOM-specific unit tests use the `**/*.dom.test.ts?(x)` environment override in `vitest.config.ts`
- `passWithNoTests` is disabled, so missing suites fail loudly once they are included in config

## Current gaps and drift

- `packages/search` is not included in `vitest.config.ts` or `vitest.config.integration.ts`
- The Go search service under `search/` has no `_test.go` files
- `testing/vitest.shared.ts` does not list `packages/search` in `activeSurfaceRoots`
- `portfolio/tests/integration/api/auth-login.route.test.ts` imports a missing route file at `portfolio/app/api/auth/login/route.ts`
- Search-specific routes such as `portfolio/app/api/search/route.ts` and `portfolio/app/api/search/compare/route.ts` do not currently have dedicated tests in the tree

## Key files

- `vitest.config.ts`
- `vitest.config.integration.ts`
- `portfolio/playwright.config.ts`
- `testing/vitest.shared.ts`
- `portfolio/tests/integration/api/auth-login.route.test.ts`
- `worker/tests/integration/views.worker.test.ts`
- `packages/database/tests/integration/prisma-roundtrip.test.ts`
