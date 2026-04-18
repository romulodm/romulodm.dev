# Concerns

## Highest priority concerns

### 1. `portfolio/.env.example` contains credential-shaped values

The tracked example file `portfolio/.env.example` still contains multiple provider values that look like concrete credentials or tokens instead of obvious placeholders.
Even if they are no longer valid, they create security-scanner noise and raise doubt about whether the repository is safe to publish as-is.
This should be sanitized before the repo is treated as production-ready or public-safe.

### 2. CI and workspace metadata still assume a missing `frontend/` app

The root `package.json`, `README.md`, `.github/workflows/pr.yml`, and `.github/workflows/security-review.yml` still reference `frontend/`.
There is no `frontend/` directory in the current tree, so those scripts and workflow jobs are stale.
At the same time, the new `packages/search` workspace exists but is not included in the PR path filters or shared testing surface metadata.

### 3. Search indexing has drift between the code paths that exist and the events that are produced

`worker/workers/search.worker.ts` consumes a raw Redis list named `search:events`, but no producer for that list was found under `portfolio/`, `worker/`, `packages/`, or `search/`.
That means the guaranteed sync path appears to be the startup-wide `reindexAll()` call in `worker/index.ts`, while incremental updates may never fire.
There is also a topology mismatch: `search/main.go` and `portfolio/lib/search-go.ts` default to port `8080`, while `docker-compose.dev.yml` exposes the `search` service as `6900:6900`.

### 4. Stale source and test files still point at missing modules

`portfolio/tests/integration/api/auth-login.route.test.ts` imports `portfolio/app/api/auth/login/route.ts`, but that route file does not exist.
`portfolio/lib/search-indexer.ts` imports `@/lib/search-engine/engine`, and that module path also does not exist.
Those are strong signs of partially retired implementations still living in the tree.

### 5. Notification runtime and environment docs have drifted apart

The active notification worker imports `worker/lib/telegram.ts`, but `worker/.env.example` still documents WAHA variables and `worker/lib/whatsapp.ts` remains present.
This makes it unclear which transport is canonical for fresh setup and production operations.
The mismatch is likely to confuse onboarding and make environment templates incomplete.

### 6. Locale helpers are not fully aligned with routing

`portfolio/i18n/routing.ts` and `portfolio/proxy.ts` support only `en` and `pt`.
`portfolio/lib/locales.ts` still advertises `es` in the locale helper list.
That inconsistency can leak unsupported language options into UI or utility code.

### 7. Test coverage does not yet match the newer search surfaces

There are no tests under `packages/search/` and no Go tests under `search/`.
The existing Vitest configuration also omits `packages/search`, and there are no dedicated tests for `portfolio/app/api/search/route.ts` or `portfolio/app/api/search/compare/route.ts`.
Given the amount of recent search-related change, this is a release-readiness gap.

## Files worth reviewing first

- `portfolio/.env.example`
- `package.json`
- `.github/workflows/pr.yml`
- `.github/workflows/security-review.yml`
- `worker/index.ts`
- `worker/workers/search.worker.ts`
- `portfolio/lib/search-indexer.ts`
- `portfolio/tests/integration/api/auth-login.route.test.ts`
- `worker/.env.example`
- `portfolio/lib/locales.ts`
