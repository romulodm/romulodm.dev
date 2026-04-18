# Architecture

## High-level shape

This repository is a split application architecture inside one monorepo:

1. `portfolio` serves the public site, localized pages, admin UI, and HTTP API routes.
2. `worker` processes BullMQ jobs, periodic operational tasks, and search sync.
3. `packages/database` owns Prisma and the shared relational schema.
4. `packages/queues` owns queue names, runtime defaults, and stable job IDs.
5. `packages/search` contains a reusable TypeScript search engine.
6. `search` is a standalone Go search service with its own HTTP API.

## Primary entry points

- Web shell root: `portfolio/app/layout.tsx`
- Localized app shell: `portfolio/app/[locale]/layout.tsx`
- Locale middleware proxy: `portfolio/proxy.ts`
- Public and admin HTTP API: `portfolio/app/api/**/route.ts`
- Worker bootstrap: `worker/index.ts`
- Shared Prisma export: `packages/database/index.ts`
- Shared queue export: `packages/queues/index.ts`
- Go search bootstrap: `search/main.go`

## Request and rendering flow

- Requests hit `portfolio/proxy.ts`, which enforces `/en` and `/pt` locale prefixes.
- `portfolio/app/[locale]/layout.tsx` validates locale, loads messages, injects Umami, and resolves the session.
- `NextIntlClientProvider`, `ThemeProvider`, `SessionProvider`, and `ParallaxProvider` are composed through `portfolio/app/providers.tsx`.
- Server components are the default in `portfolio/app/[locale]/**`, with client opt-in for interactive widgets and forms.

## Data access model

- Prisma is shared through the singleton in `packages/database/index.ts`.
- Redis access is split between web and worker helpers to support request-time limits, buffered counters, and queue connections.
- BullMQ queues are created through `packages/queues/lib/queues.ts` and consumed by worker factories in `worker/workers/*.worker.ts`.
- The Go search service stores its index in memory; the TypeScript search package stores index data in Redis.

## Important application flows

### Posts and admin editing

- Admin CRUD for posts is centered on `portfolio/app/api/posts/[id]/route.ts` and related admin pages under `portfolio/app/[locale]/admin/posts/**`.
- Public listing and pagination use `portfolio/app/api/posts/public/route.ts`.
- Localized post content is stored in `PostTranslation` rows from `packages/database/prisma/schema.prisma`.

### Comments and moderation

- Comment reads and writes happen in `portfolio/app/api/comments/route.ts`.
- Moderation combines local blocklists, Google Safe Browsing, and OpenAI moderation through `portfolio/lib/moderation/index.ts`.
- Accepted comments enqueue notification jobs; rejected comments are written to `SuspiciousComment`.

### Newsletter and campaigns

- Subscription, confirmation, and unsubscribe flows are routed through `portfolio/app/api/newsletter/**/route.ts`.
- `portfolio/lib/newsletter/newsletter.service.ts` owns subscriber and campaign state transitions.
- Email dispatch is async through `portfolio/lib/queues/email.queue.ts` and `worker/workers/email.worker.ts`.

### Donations

- Payment initiation is handled in `portfolio/app/api/donations/**/route.ts`.
- Stripe and PIX webhooks update donation status in Prisma.
- Ranking data is served from `portfolio/app/api/donations/ranking/route.ts`.

### Search

- Reader search uses `portfolio/app/api/search/route.ts`, which calls the Go service through `portfolio/lib/search-go.ts`.
- The comparison route in `portfolio/app/api/search/compare/route.ts` queries the TypeScript engine, Meilisearch, and the Go service side by side.
- The worker performs a full reindex at startup and then listens on the raw Redis list `search:events` in `worker/workers/search.worker.ts`.

### View buffering and flush

- Page views are buffered in Redis through `portfolio/lib/views.ts`.
- Flush scheduling is registered in `worker/workers/views.worker.ts`.
- Actual flush execution runs under the notification worker in `worker/workers/notification.worker.ts`.

## Operational architecture

- `docker-compose.dev.yml` provisions Postgres, Redis, MinIO, Umami, Meilisearch, search, worker, and app.
- `docker-compose.prod.yml` adds nginx, certbot, backup, and cron services.
- The worker also performs startup verification for email and search sync in `worker/index.ts`.

## Architectural characteristics

- Shared contracts are extracted into workspace packages instead of duplicated across app and worker.
- HTTP routes are mostly thin handlers over helpers in `portfolio/lib/**`.
- Async work is preferred for email, notifications, search sync, and buffered views.
- Search is currently hybrid: one TypeScript engine, one Go service, and optional Meilisearch comparisons coexist in the tree.

## Key files

- `portfolio/app/[locale]/layout.tsx`
- `portfolio/proxy.ts`
- `portfolio/app/api/comments/route.ts`
- `portfolio/app/api/search/route.ts`
- `portfolio/lib/newsletter/newsletter.service.ts`
- `portfolio/lib/views.ts`
- `worker/index.ts`
- `worker/workers/email.worker.ts`
- `worker/workers/notification.worker.ts`
- `worker/workers/search.worker.ts`
- `search/api/handler.go`
