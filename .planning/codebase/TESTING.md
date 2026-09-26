# Testing Patterns

**Analysis Date:** 2026-09-25

## Test Framework

**Runner:**
- Vitest `^5.0.0` (root devDependency) for unit and integration suites
- Playwright `@playwright/test ^1.55.0` for E2E (portfolio only)
- Config:
  - `vitest.config.ts` — unit suite (`name: "unit"`, `environment: "node"`, setup `testing/setupTests.unit.ts`)
  - `vitest.config.integration.ts` — integration suite (`name: "integration"`, serial: `fileParallelism: false`, `maxWorkers: 1`, `testTimeout: 15000`, setup `testing/setupTests.integration.ts`)
  - `portfolio/playwright.config.ts` — E2E (`testDir: ./tests/e2e`, 1 worker, no retries, boots `next dev` on `127.0.0.1:3100`, `globalSetup: ./tests/e2e/global.setup.ts`)
- Shared config: `testing/vitest.shared.ts` exports `workspaceRoot` and `vitestAlias` (`@` -> `portfolio`, `@romulo/database`, `@romulo/queues` -> package sources, `server-only` -> `testing/stubs/server-only.ts`)
- Both Vitest configs set `passWithNoTests: false`.

**Assertion Library:**
- Vitest built-in `expect` (Jest-compatible); Playwright `expect` for E2E.

**Run Commands:**
```bash
npm run test:unit                 # All unit tests (root; this is what CI runs)
npm run test:integration          # Integration tests (needs Postgres + Redis)
npm run test:e2e                  # Playwright E2E (portfolio)
npm run test:phase3               # unit + integration + e2e
npm run test:unit:portfolio       # Scope to one workspace (also :worker, :database, :queues)
npx vitest --config vitest.config.ts               # Watch mode
npx vitest run --config vitest.config.ts portfolio/lib/rate-limit.test.ts   # Single file
```
- Coverage: no coverage provider or script configured.
- CI (`.github/workflows/ci.yml`, mirrored by `npm run ci`): runs `test:unit` only, after `ci:packages`, lint and typecheck. Integration and E2E are not in CI.

## Test File Organization

**Location:**
- Unit tests: co-located next to the source as `<module>.test.ts` — `portfolio/lib/rate-limit.test.ts`, `portfolio/lib/utils.test.ts`, `portfolio/components/auth/schemas.test.ts`, `portfolio/app/sitemap.test.ts`
- Route-level unit tests: `__tests__/` folder beside the route group — `portfolio/app/api/donations/__tests__/pix-webhook.test.ts`, `eth-verify.test.ts`
- Workspace-level unit tests: `<workspace>/tests/unit/` — `portfolio/tests/unit/contact.test.ts`, `packages/queues/tests/unit/scheduling.test.ts`, `worker/tests/unit/test-baseline.test.ts`
- Integration tests: always under `<workspace>/tests/integration/` (the unit config excludes `**/tests/integration/**`) — `portfolio/tests/integration/api/*.route.test.ts`, `worker/tests/integration/views.worker.test.ts`, `packages/database/tests/integration/settlement.test.ts`
- E2E: `portfolio/tests/e2e/*.spec.ts`

**Naming:**
- `*.test.ts` for Vitest; `*.spec.ts` for Playwright only.
- Integration API tests: `<route-name>.route.test.ts` (`comments-vote.route.test.ts`, `auth-register.route.test.ts`)
- Each suite has a `test-baseline.test.ts` sanity file asserting setup ran (`expect(process.env.TEST_SUITE).toBe("unit")`).

**Structure:**
```
testing/                          # Shared test infrastructure (root)
├── vitest.shared.ts              # aliases + workspaceRoot
├── setupTests.unit.ts            # NODE_ENV=test, TEST_SUITE=unit
├── setupTests.integration.ts     # loads .env, sets TEST_DATABASE_URL/TEST_REDIS_URL + auth env defaults
├── integration/fixtures.ts       # Prisma factories + cleanup
├── integration/runtime.ts        # getIntegrationRuntime(surface)
└── stubs/server-only.ts          # empty module replacing `server-only`
portfolio/
├── lib/<module>.test.ts          # co-located unit tests
├── tests/unit/                   # unit tests not tied to one module
├── tests/integration/api/        # route handler tests against real DB
└── tests/e2e/                    # Playwright specs + global.setup.ts
worker/tests/{unit,integration}/
packages/{database,queues}/tests/{unit,integration}/
```
- Unit `include` covers only `portfolio/**`, `worker/**`, `packages/database/**`, `packages/queues/**`. `packages/templates` and `packages/web3` have no test wiring; adding tests there requires editing `include` in both Vitest configs.
- `worker/dist/**` contains stale compiled tests; `**/dist/**` is excluded — never edit or rely on them.

## Test Structure

**Suite Organization:**
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getRequestIp", () => {
  it("usa o ÚLTIMO item do X-Forwarded-For, não o primeiro", () => {
    // Why this matters (nginx appends $remote_addr) ...
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" });
    expect(getRequestIp(headers)).toBe("203.0.113.9");
  });
});
```
(`portfolio/lib/rate-limit.test.ts`)

**Patterns:**
- Always import Vitest APIs explicitly (`globals` is not enabled).
- `describe` named after the function or the HTTP route (`"PUT /api/comments/[id]/vote"`, `"views worker integration"`).
- Test names are behavior sentences; Portuguese or English (match the file). Add inline comments explaining the regression being guarded.
- Open regression-focused files with a `/** ... */` block enumerating scenarios (`portfolio/app/api/donations/__tests__/pix-webhook.test.ts`, `packages/queues/tests/unit/scheduling.test.ts`).
- Setup: `beforeEach` resets mock state (`mockReset()` + `mockResolvedValue(...)`) and in-memory fakes (`redisState.counters.clear()`).
- Teardown: `afterEach` calls `vi.useRealTimers()` / `vi.unstubAllGlobals()` in unit tests; `await cleanupIntegrationFixtures()` and Redis key deletion in integration tests.
- Assertions: `toBe`, `toEqual`, `toBeNull`, `await expect(promise).resolves.toBeNull()`; for routes assert `response.status` then `await response.json()` payload, then DB state via `prisma`.

## Mocking

**Framework:** Vitest `vi` (usage counts: `vi.fn` 38, `vi.mock` 27, `vi.hoisted` 15, `vi.mocked` 9, `vi.stubGlobal` 6)

**Pattern A — hoisted mocks + static import (integration route tests):**
```typescript
const requireAuthMock = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ requireAuth: requireAuthMock }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: vi.hoisted(() => vi.fn(() => "127.0.0.1")),
}));

import { PUT } from "../../../app/api/comments/[id]/vote/route";
```
(`portfolio/tests/integration/api/comments-vote.route.test.ts`)

**Pattern B — stateful fake + dynamic import after `vi.mock`:**
```typescript
const redisState = { mode: "ok" as "ok" | "down" | "slow", counters: new Map<string, number>() };

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    async eval(_s: string, _n: number, key: string) {
      if (redisState.mode === "down") throw new Error("ECONNREFUSED");
      const next = (redisState.counters.get(key) ?? 0) + 1;
      redisState.counters.set(key, next);
      return next;
    },
  }),
}));

const { getRequestIp, rateLimit } = await import("./rate-limit");
```
(`portfolio/lib/rate-limit.test.ts`)

**Pattern C — forwarding wrappers so plain `vi.fn()` can be declared before `vi.mock`:**
```typescript
const markDonationCompleted = vi.fn();
vi.mock("@romulo/database", () => ({
  markDonationCompleted: (...args: unknown[]) => markDonationCompleted(...args),
}));
```
(`portfolio/app/api/donations/__tests__/pix-webhook.test.ts`)

**Other patterns:**
- Sentry no-op mock (reuse whenever the module under test imports `@sentry/nextjs`):
  ```typescript
  vi.mock("@sentry/nextjs", () => ({
    withScope: (fn: (scope: unknown) => void) =>
      fn({ setTag: () => {}, setLevel: () => {}, setFingerprint: () => {}, setContext: () => {} }),
    captureException: () => {},
    captureMessage: () => {},
  }));
  ```
- i18n translator mock returns the key: `vi.mock("@/lib/api-intl", () => ({ getApiTranslator: vi.fn(() => (key: string) => key) }))`
- `fetch`: `vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({...}) }))` (`portfolio/lib/avatar.test.ts`)
- Time: `vi.useFakeTimers()` + `vi.setSystemTime(...)`, restored with `vi.useRealTimers()` in `afterEach`.
- Env vars: set `process.env.X = ...` at module top-level before importing the subject.
- Hand-written fakes over mocks for interface-shaped deps: `fakeQueue()` implementing `SchedulableQueue` (`packages/queues/tests/unit/scheduling.test.ts`). Prefer this when production code accepts the dependency as a parameter.
- `server-only` never needs mocking — it is aliased globally.

**What to Mock:**
- In unit tests: Redis, Prisma/`@romulo/database`, Sentry, `fetch`, `@/lib/api-intl`, auth helpers, external SDKs (Stripe, viem, AbacatePay).
- In integration tests: only auth (`requireAuth`/`requireAdmin`), rate limiting, and outbound third-party calls.

**What NOT to Mock:**
- In integration tests: Prisma and Redis are real (`TEST_DATABASE_URL`, `TEST_REDIS_URL`, default Redis DB 15). Assert against the DB directly.
- Pure helpers (`portfolio/lib/utils.ts`, `portfolio/lib/format-number.ts`, Zod schemas) — test them directly.

## Fixtures and Factories

**Test Data:**
```typescript
import {
  cleanupIntegrationFixtures,
  createComment,
  createPublishedPost,
  createTestUser,
} from "../../../../testing/integration/fixtures";

const author = await createTestUser();                 // overrides?: { email, username, password, admin, provider }
const post = await createPublishedPost(author.id);     // overrides?: { slug, commentsCount, title }
const comment = await createComment(author.id, post.id);
```
- Available factories in `testing/integration/fixtures.ts`: `createTestUser`, `createTestDonation`, `createPublishedPost`, `createComment`, `createNewsletterSubscriber`, `createCampaignWithRecipient`, plus `uniqueToken(label)`.
- Every generated identifier embeds `TEST_PREFIX = "phase3test"`; `cleanupIntegrationFixtures()` deletes rows by that prefix in FK-safe order. When adding a new model to fixtures, also add its `deleteMany` to `cleanupIntegrationFixtures` in dependency order.
- Import fixtures via relative path (no alias for `testing/`).
- E2E admin user is upserted in `portfolio/tests/e2e/global.setup.ts` (credentials exposed as `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD`).

**Location:**
- `testing/integration/fixtures.ts` (DB factories), `testing/integration/runtime.ts`, inline fakes inside unit test files.

## Coverage

**Requirements:** None enforced; no coverage tool configured.

**View Coverage:**
```bash
npx vitest run --config vitest.config.ts --coverage   # requires installing @vitest/coverage-v8 first
```

## Test Types

**Unit Tests:**
- Node environment, no DB/Redis. Scope: lib helpers, Zod schemas, route handlers with all dependencies mocked, structural guards (e.g. `portfolio/app/sitemap.test.ts` scans `app/[locale]` on disk to ensure every public page is in the sitemap or explicitly excluded).
- DOM tests: none currently exist. To write one, put `// @vitest-environment jsdom` on the first line (jsdom is a root devDependency; `environmentMatchGlobs` is no longer supported).

**Integration Tests:**
- Real Postgres + Redis, serial execution. Call exported route handlers directly with a `Request` and a `params` promise:
  ```typescript
  const response = await PUT(
    new Request(`http://localhost/api/comments/${comment.id}/vote`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: 1 }),
    }) as any,
    { params: Promise.resolve({ id: comment.id }) },
  );
  ```
- Worker integration tests invoke processor functions with the real Redis singleton (`worker/lib/redis.ts`) and verify BullMQ repeatable jobs (`worker/tests/integration/views.worker.test.ts`).

**E2E Tests:**
- Playwright, Chromium default project, against `next dev` on port 3100 with placeholder auth env. Use role-based locators: `page.getByRole("button", { name: "Login" })`. Specs: `portfolio/tests/e2e/baseline.spec.ts`, `portfolio/tests/e2e/auth-admin.spec.ts`.

## Common Patterns

**Async Testing:**
```typescript
it("returns null on a non-200 response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  await expect(getNpmWeeklyDownloads("seedicon")).resolves.toBeNull();
});
```

**Error Testing:**
```typescript
it("returns unauthorized when auth fails", async () => {
  requireAuthMock.mockResolvedValue({ ok: false, status: 401, reason: "unauthorized" });
  const response = await PUT(new Request(url, { method: "PUT", body: "{}" }) as any,
    { params: Promise.resolve({ id: "comment-id" }) });
  expect(response.status).toBe(401);
});
```
- Simulate infra failure through fake state (`redisState.mode = "down"`) and assert fail-open/fail-closed behavior rather than thrown errors.
- Test webhook idempotency and secret handling (header vs query param) explicitly, as in `pix-webhook.test.ts`.

---

*Testing analysis: 2026-09-25*
