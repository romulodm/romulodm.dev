# Structure

## Repository layout

- `portfolio/` - Next.js 16 app for the public site, blog, admin, and API
- `worker/` - BullMQ worker runtime and operational integrations
- `packages/database/` - shared Prisma schema, client export, and DB tests
- `packages/queues/` - shared BullMQ contracts and Redis helpers
- `packages/search/` - reusable TypeScript search engine and indexer
- `search/` - standalone Go search service
- `testing/` - shared Vitest aliases and setup files
- `.planning/` - GSD project state and generated codebase docs
- `.github/workflows/` - CI, security, and review automation
- `backup/`, `cron/`, and `nginx/` - production support assets

## `portfolio` breakdown

- `portfolio/app/` holds App Router layouts, localized pages, and route handlers
- `portfolio/app/[locale]/` contains the public and admin page tree
- `portfolio/app/api/` contains HTTP endpoints grouped by feature such as `admin`, `comments`, `donations`, `newsletter`, `posts`, `search`, and `uploads`
- `portfolio/components/` is grouped by domain: `auth`, `blog`, `comments`, `newsletter`, `sections`, `support`, `ui`, and admin-only areas
- `portfolio/lib/` contains server helpers for auth, validation, moderation, queues, payments, search, storage, and views
- `portfolio/i18n/` contains Next Intl routing and request config
- `portfolio/messages/` stores the locale catalogs
- `portfolio/scripts/` contains one-off utilities like `reindex.ts` and `update-blocklists.ts`
- `portfolio/tests/` contains integration and Playwright coverage

## `worker` breakdown

- `worker/index.ts` is the runtime entry point
- `worker/workers/` contains `email.worker.ts`, `notification.worker.ts`, `views.worker.ts`, and `search.worker.ts`
- `worker/lib/email/` contains provider abstractions and email templates
- `worker/lib/telegram.ts` and `worker/lib/whatsapp.ts` contain notification transports
- `worker/tests/` contains unit and integration tests

## `packages` breakdown

- `packages/database/index.ts` exports Prisma and generated types
- `packages/database/prisma/schema.prisma` is the central relational contract
- `packages/queues/index.ts` re-exports queue and Redis helpers
- `packages/queues/lib/queues.ts` holds queue names, job types, and runtime config
- `packages/search/src/engine/**` implements tokenization, indexing, scoring, and vector logic
- `packages/search/src/libs/indexer.ts` adapts Prisma posts into search documents

## `search` service breakdown

- `search/main.go` boots the HTTP server
- `search/api/handler.go` exposes `/health`, `/stats`, `/search`, `/index`, and `/reindex`
- `search/engine/*.go` holds the in-memory trie, BK-tree, vector scoring, and preprocessing logic
- `search/README.md` documents local usage and route contracts

## Naming and file patterns

- Next.js route files follow `page.tsx`, `layout.tsx`, and `route.ts`
- React components are usually PascalCase files under `portfolio/components/**`
- Shared library files are short, descriptive, and mostly kebab-case under `portfolio/lib/**`
- Worker modules are named by concern under `worker/workers/**`
- Generated outputs such as `.next/` and `dist/` are kept inside package roots

## Notable current route surfaces

- Public pages live under `portfolio/app/[locale]/blog`, `comments`, `newsletter`, `profile`, `resume`, and `support`
- Admin pages live under `portfolio/app/[locale]/admin/banned-users`, `donations`, `newsletter`, `posts`, and `suspicious-comments`
- API routes live under `portfolio/app/api/admin`, `auth`, `comments`, `donations`, `newsletter`, `posts`, `search`, and `uploads`

## Key files

- `portfolio/app/[locale]/page.tsx`
- `portfolio/app/[locale]/admin/layout.tsx`
- `portfolio/app/api/search/compare/route.ts`
- `portfolio/components/sections/**`
- `worker/workers/search.worker.ts`
- `packages/search/src/index.ts`
- `search/main.go`
- `testing/vitest.shared.ts`
