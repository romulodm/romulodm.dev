# Conventions

## General coding style

- TypeScript is the default implementation language across all active npm surfaces.
- Shared helpers usually use named exports such as `getApiTranslator`, `requireAdmin`, and `createQueue`.
- Runtime diagnostics still favor `console.log`, `console.warn`, and `console.error`, especially in `worker/**`.
- Domain-specific logic is usually colocated under feature folders like `portfolio/lib/moderation/**` or `portfolio/components/comments/**`.

## React and App Router patterns

- Server components are the default under `portfolio/app/**`.
- Client components opt in with `"use client"` such as `portfolio/app/providers.tsx`.
- Locale-aware routing is built around the `[locale]` segment plus `next-intl`.
- The root `portfolio/app/layout.tsx` is intentionally minimal; the real shell logic lives in `portfolio/app/[locale]/layout.tsx`.

## Validation and API patterns

- Route handlers tend to be thin wrappers over helpers in `portfolio/lib/**`.
- Validation uses `zod` together with `parseJsonBodyWithMessages` from `portfolio/lib/api-validation.ts`.
- API responses are shaped through `portfolio/lib/api-errors.ts`.
- Error payloads preserve machine-readable `code` values even when the human `message` is localized.
- Route auth is normalized through `portfolio/lib/auth-helpers.ts`.
- API locale resolution is centralized in `portfolio/lib/api-intl.ts`.

## Auth and identity conventions

- `portfolio/lib/auth.ts` is the single NextAuth configuration source.
- Credentials auth performs a Redis-backed rate limit before password comparison.
- Admin checks are done in route handlers rather than by a separate API gateway layer.

## Queue and worker conventions

- Queue constants and job types are centralized in `packages/queues/lib/queues.ts`.
- Stable job IDs are built through helpers like `buildTransactionalJobId` and `buildCampaignJobId`.
- Queue producers stay thin in `portfolio/lib/queues/*.queue.ts`.
- Worker modules expose factory functions instead of instantiating BullMQ workers at import time.
- Scheduling helpers such as `scheduleDailyStatus` and `scheduleViewsFlush` are idempotent.

## Search and indexing conventions

- There are two search implementations in-tree: the shared TypeScript engine in `packages/search/src/**` and the Go service in `search/**`.
- Reader-facing search currently favors the Go service through `portfolio/lib/search-go.ts`.
- Search sync from the worker is raw Redis-list based in `worker/workers/search.worker.ts`, not BullMQ-based.

## Styling conventions

- Global shell styling is loaded from `portfolio/app/[locale]/globals.css`.
- Components mix utility classes with local CSS files such as `portfolio/components/sections/vision/Vision.css`.
- Reusable primitives live under `portfolio/components/ui`.
- MUI and Radix are both present, so the UI layer is not limited to one component system.

## Language and copy conventions

- Product copy is bilingual through `portfolio/messages/en.json` and `portfolio/messages/pt.json`.
- Implementation comments and tests are mostly English, while some UI and operational text remains Portuguese.
- Locale parity matters because both the page tree and API helpers depend on `en` and `pt`.

## Testing conventions

- Small helpers and schemas use colocated `*.test.ts` files.
- Feature integration coverage lives under `portfolio/tests/integration` and `worker/tests/integration`.
- End-to-end browser coverage lives under `portfolio/tests/e2e`.
- Shared test aliases live in `testing/vitest.shared.ts`.

## Key files

- `portfolio/lib/api-errors.ts`
- `portfolio/lib/api-intl.ts`
- `portfolio/lib/api-validation.ts`
- `portfolio/lib/auth.ts`
- `portfolio/lib/auth-helpers.ts`
- `packages/queues/lib/queues.ts`
- `worker/index.ts`
- `worker/workers/email.worker.ts`
- `testing/vitest.shared.ts`
