# Architecture

**Analysis Date:** 2026-09-25

## Pattern Overview

**Overall:** npm-workspaces monorepo. A Next.js 16 App Router monolith (`portfolio/`) holds the UI, admin area and HTTP API. Slow or scheduled work goes to a BullMQ background worker (`worker/`) over Redis. A standalone Go search microservice (`search/`) sits beside them. Docker Compose runs everything behind nginx on a single VPS.

**Key Characteristics:**
- **Server-first Next.js.** Pages in `portfolio/app/[locale]/**/page.tsx` are async Server Components that query Prisma directly (no service/repository layer). Client interactivity lives in `"use client"` components under `portfolio/components/` that call `/api/*` Route Handlers with `fetch`.
- **Shared contracts through workspace packages.** `@romulo/database` provides the Prisma client, schema and settlement logic. `@romulo/queues` provides queue names, job types, job options, job ids and repeatable-job scheduling. `@romulo/templates` provides email HTML. `@romulo/web3` provides on-chain helpers. The portfolio and the worker both import these, so producer and consumer share one type.
- **Database as source of truth, derived stores rebuildable.** The Go search index, the Redis view buffer and the caches can all be rebuilt from Postgres. Side effects (search sync, notifications) must never fail the primary write.
- **Locale-prefixed routing.** Every page lives under `/[locale]` (`pt` default, `en`) through `next-intl`. API routes stay outside the locale segment and work out the locale per request with `getApiTranslator(req)`.
- **Idempotency built in.** Webhooks are recorded in a `WebhookEvent` table (the unique insert acts as the lock). BullMQ job ids are deterministic (`buildTransactionalJobId`, `buildCampaignJobId`). Repeatable jobs are scheduled idempotently every time the worker starts.

## Layers

**Edge / Reverse proxy:**
- Purpose: TLS termination, Cloudflare real-IP, security headers, proxying to the app
- Location: `nginx/nginx.conf`, `nginx/templates/app.conf` (prod), `nginx/templates/app.dev.conf`, `nginx/templates/app.demo.conf`, `nginx/conf.d/*.inc`
- Depends on: `app` container; certbot for certificates (`nginx/init-ssl.sh`)
- Used by: public internet

**Request middleware (proxy):**
- Purpose: next-intl locale detection and redirect, with Sentry capture
- Location: `portfolio/proxy.ts` (the Next 16 name for middleware)
- Matcher skips `api`, `monitoring`, `_next` and static files, so API routes never get a locale prefix

**Presentation (pages and layouts):**
- Purpose: render public site, blog, profile, wall, support/donations, legal pages, status, admin UI
- Location: `portfolio/app/[locale]/`
- Contains: async Server Component `page.tsx`/`layout.tsx`, `loading.tsx`, `error.tsx`, colocated client components (`*Client.tsx`, `page-client.tsx`), and server actions (`actions.ts`)
- Depends on: `@romulo/database`, `portfolio/lib/*`, `portfolio/components/*`, `next-intl/server`
- Used by: browser

**UI components:**
- Purpose: reusable and feature-specific React components (134 of 161 `.tsx` files are `"use client"`)
- Location: `portfolio/components/` (grouped by feature: `blog/`, `comments/`, `admin/`, `wall/`, `sections/`, `support/`, etc.; primitives in `ui/`)
- Depends on: `portfolio/hooks/`, `portfolio/lib/utils.ts`, `next-intl`, `next-auth/react`, `/api/*` endpoints through `fetch`
- Used by: pages in `portfolio/app/`

**HTTP API (Route Handlers):**
- Purpose: JSON API for client components, webhooks (Stripe, PIX/AbacatePay, Telegram), admin operations, uploads, search proxy, RSS
- Location: `portfolio/app/api/**/route.ts`
- Contains: `GET/POST/PATCH/DELETE` exports; each one does translate → auth → rate limit → validate (zod) → Prisma → side effects → respond
- Depends on: `portfolio/lib/auth-helpers.ts`, `portfolio/lib/api-errors.ts`, `portfolio/lib/api-validation.ts`, `portfolio/lib/api-intl.ts`, `portfolio/lib/rate-limit.ts`, `portfolio/lib/queues/*`, `@romulo/database`
- Used by: client components, external webhook providers, Telegram, the Go search service indirectly

**Domain / infrastructure helpers:**
- Purpose: cross-cutting server logic
- Location: `portfolio/lib/`
- Contains: auth (`auth.ts`, `auth-helpers.ts`), moderation pipeline (`moderation/`), payments (`payments/stripe.ts`, `payments/abacate.ts`, `payments/webhook-events.ts`), queue producers (`queues/*.queue.ts`), Redis (`redis.ts`), S3/MinIO (`s3.ts`, `backups/`), search client (`search.ts`, `search-sync.ts`), view counting (`views.ts`, `views-internal.ts`), presence (`presence/`), SEO (`seo.ts`), newsletter (`newsletter/newsletter.service.ts`)
- Depends on: shared packages, external SDKs
- Used by: pages, route handlers, server actions

**Shared packages:**
- `packages/database/` - Prisma schema (`prisma/schema.prisma`), migrations, singleton client (`index.ts`), donation settlement state machine (`settlement.ts`: `markDonationCompleted`, `markDonationFailed`, ...)
- `packages/queues/` - `src/constants.ts` (queue and job names, Redis keys), `src/types.ts` (job unions), `src/options.ts`, `src/ids.ts`, `src/factory.ts` (`createQueue`), `src/scheduling.ts`, `src/config.ts`
- `packages/templates/` - email templates (`src/templates/*.template.ts`), `src/base.ts` layout, `src/i18n.ts`
- `packages/web3/` - `src/config.ts`, `src/price.ts`, `src/encryption.ts`
- Each package compiles to `dist/`; the portfolio `tsconfig.json` points `@romulo/queues` at the source (`../packages/queues/index.ts`)

**Background worker:**
- Purpose: email delivery (transactional and campaign), notifications (Telegram, WhatsApp), cron-like repeatable jobs, search index sync, system metrics, backups
- Location: `worker/index.ts` (bootstrap), `worker/workers/*.worker.ts` (one factory per concern), `worker/lib/` (email providers, alerts, observability, redis, sentry)
- Depends on: `@romulo/queues`, `@romulo/database`, `@romulo/templates`, Redis, Go search service, SMTP/SES/Resend
- Used by: portfolio (enqueues jobs), itself (repeatable jobs)

**Search service (Go):**
- Purpose: in-memory full-text search (trie prefix, BK-tree fuzzy, vector scoring, Snowball stemming, highlights)
- Location: `search/main.go`, `search/api/handler.go`, `search/api/snapshot.go`, `search/engine/*.go`
- Endpoints (`search/api/handler.go`): public `GET /health`, `GET /search`; bearer-protected (`SEARCH_INTERNAL_SECRET`) `GET /debug`, `GET /stats`, `POST /index`, `DELETE /index/{docID}`, `POST /reindex`
- Persists a JSON snapshot (`SNAPSHOT_PATH`, default `/data/documents.json`) and replays it at startup

**Support containers:**
- `backup/` - `backup.sh` + Dockerfile (pg dump to MinIO/S3), triggered by Ofelia (`cron/config.ini`, daily at 03:00) and by the worker `backups` queue
- `bot/` - Python FastAPI/Pydantic Telegram bridge (`bot/main.py`) deployed on Render (`bot/render.yaml`); receives `POST /notify` from the worker and CI

## Data Flow

**Public page render (e.g. blog index):**

1. `portfolio/proxy.ts` makes sure the path has a `/pt` or `/en` prefix
2. `portfolio/app/[locale]/layout.tsx` checks the locale, calls `setRequestLocale`, loads `portfolio/messages/{locale}.json` and wraps children in `NextIntlClientProvider` → `ThemeProvider` → `portfolio/app/providers.tsx` (`SessionProvider`, `AuthModalProvider`, `ParallaxProvider`)
3. `portfolio/app/[locale]/blog/page.tsx` reads Prisma inside `unstable_cache` (key `blog-index-data-${locale}`, 300 s) with matching `export const revalidate = 300`
4. The server resolves the translation for the locale (falling back to the first translation) and passes plain data to a client component (`BlogListClient`)

**Authenticated mutation (e.g. create comment):**

1. A client component POSTs to `/api/comments`
2. `portfolio/app/api/comments/route.ts`: `getApiTranslator(req)` → `requireAuth()` → `rateLimit(key, max, windowSec)` → ban check → `parseJsonBodyWithMessages(req, zodSchema, msgs)`
3. `moderate(bodyMd)` (`portfolio/lib/moderation/index.ts`) runs the providers in order: domain blocklist → Google Safe Browsing → OpenAI moderation. If it rejects, the comment goes into `SuspiciousComment`
4. Prisma write, then `enqueueNotification({ type: "comment", ... })` pushes to the `notifications` BullMQ queue
5. The worker `notification.worker.ts` picks up the job and sends a Telegram alert through the bot

**Post publish → search index:**

1. Admin edits a post through `portfolio/app/api/posts/route.ts` / `portfolio/app/api/posts/[id]/route.ts` (guarded by `requireAdmin`)
2. After saving, `syncPostToSearch(postId)` (`portfolio/lib/search-sync.ts`) reads the post and calls `goIndex` or `goRemove` (`portfolio/lib/search.ts`) with one document per translation, id `${postId}_${locale}`. It never throws.
3. At startup the worker calls `reindexAll()` (`worker/workers/search.worker.ts`) → `POST /reindex` with every published translation
4. Reads: `/api/search` → `goSearch(query, locale)` → Go `GET /search`

**Post view counting:**

1. `portfolio/app/[locale]/blog/[slug]/ViewTracker.tsx` calls the server action `recordPostView(postId)` (`portfolio/lib/views.ts`)
2. `registerPostView` (`portfolio/lib/views-internal.ts`, deliberately not `"use server"`) dedupes per visitor and runs `HINCRBY views:buffer postId 1`
3. The worker's repeatable job `flush-views-cron` (`worker/workers/views.worker.ts`) flushes the hash into `Post.views`

**Newsletter:**

1. `/api/newsletter/subscribe` → `portfolio/lib/newsletter/newsletter.service.ts` → `enqueueConfirmation(...)` (`portfolio/lib/queues/email.queue.ts`) on queue `newsletter-transactional`
2. Admin sends a campaign through `/api/admin/newsletter/campaigns/[id]/send` → jobs on `newsletter-campaign`
3. `worker/workers/email.worker.ts` renders with `@romulo/templates` and sends through `worker/lib/email/email.service.ts` (providers `smtp`, `ses`, `resend`, `fallback` in `worker/lib/email/providers/`)
4. Opens are tracked through `/api/newsletter/track/[trackingId]`; unsubscribe/confirm pages live under `portfolio/app/[locale]/newsletter/`

**Donations:**

1. Stripe: `/api/donations/stripe/create-intent` → client Stripe Elements → `/api/donations/stripe/webhook`, which verifies the signature, calls `recordWebhookEvent` (dedupe), then `markDonationCompleted/Failed/Expired` from `@romulo/database` settlement, then `finalizeWebhookEvent`
2. PIX (AbacatePay): `/api/donations/pix/create` → `/api/donations/pix/webhook` (same record → settle → finalize pattern) plus polling at `/api/donations/pix/check`
3. On-chain ETH: `/api/donations/eth/verify` and `/api/donations/onchain/register`, verified with `viem`; the worker retries through `onchain.worker.ts` (`retry-onchain-cron`)
4. The worker `donations.worker.ts` reconciles and audits on a schedule (`reconcile-donations-cron`, `audit-donations-cron`)

**Presence / status:**

1. Telegram `/status` command → `portfolio/app/api/telegram/webhook/route.ts` → `portfolio/lib/presence/status.ts` (Redis)
2. `/api/presence` combines `lib/presence/github.ts`, `spotify.ts`, `visitors.ts`, `status.ts` for the home page presence section

**State Management:**
- Server state: Postgres through Prisma; request-scoped reads happen in Server Components
- Caching: `unstable_cache` with per-locale keys plus route `revalidate`; shared tag constants in `portfolio/lib/cache-tags.ts` (e.g. `PROFILE_CACHE_TAG`) invalidated with `revalidateTag`
- Ephemeral state: Redis (rate limits, view buffer, presence, visitor sets, status cache `portfolio/lib/status-cache.ts`, worker log ring buffer)
- Client state: React local state and context (`AuthModalProvider`, `SessionProvider`); forms use `react-hook-form` + zod. No global client store.

## Key Abstractions

**RouteAuthResult (auth guards):**
- Purpose: discriminated union result for authorization in route handlers
- Examples: `portfolio/lib/auth-helpers.ts` (`requireAuth`, `requireAdmin`, `requireOwnerOrAdmin`, `isAdminAuthenticated`)
- Pattern: `const auth = await requireAdmin(); if (!auth.ok) return unauthorizedResponse(...)`; pages use `isAdminAuthenticated()` + `redirect('/')` (see `portfolio/app/[locale]/admin/layout.tsx`)

**Standard API error responses:**
- Purpose: consistent `{ error, message, code }` payloads
- Examples: `portfolio/lib/api-errors.ts` (`badRequestResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `conflictResponse`, `rateLimitResponse`, `validationErrorResponse`, `internalErrorResponse`, `logApiError`)

**Request validation:**
- Examples: `portfolio/lib/api-validation.ts` (`parseJsonBodyWithMessages`, `RequestValidationError`, `sanitizeMultilineText`)
- Pattern: zod schema factories that take the translator `t` so messages are localized (`createCommentSchema(t)`)

**Queue producers and consumers:**
- Producers: `portfolio/lib/queues/email.queue.ts`, `notification.queue.ts`, `password.queue.ts`, with lazy singleton queues (`_queue ??= createQueue(...)`)
- Consumers: `worker/workers/*.worker.ts` export `startXWorker(redis)` and `scheduleX(redis)` factories that `worker/index.ts` wires up
- Contracts: `packages/queues/src/types.ts` (`TransactionalEmailJob`, `CampaignEmailJob`, `NotificationJob` discriminated by `type`)

**Moderation providers:**
- Purpose: pluggable content checks
- Examples: `portfolio/lib/moderation/providers/domain-blocklist.ts`, `safe-browsing.ts`, `openai.ts`; types in `portfolio/lib/moderation/types.ts`
- Pattern: chain of responsibility, where each provider has `check(ctx)` returning `{ allowed, reason }` and the first rejection wins

**Email providers:**
- Examples: `worker/lib/email/providers/base.provider.ts`, `smtp.provider.ts`, `ses.provider.ts`, `resend.provider.ts`, `fallback.provider.ts`
- Pattern: strategy + fallback composite behind `worker/lib/email/email.service.ts`

**Donation settlement:**
- Purpose: the single state machine for donation status transitions
- Examples: `packages/database/settlement.ts`
- Pattern: webhook handlers and worker reconcilers all call the same functions (`markDonationCompleted`, `needsAttention`, `describeOutcome`)

## Entry Points

**Next.js app:**
- Location: `portfolio/app/[locale]/layout.tsx` (real root layout), `portfolio/app/layout.tsx` (pass-through), `portfolio/app/page.tsx` (redirect to `/pt`)
- Triggers: HTTP through nginx → `app` container (`output: 'standalone'`, `portfolio/Dockerfile`)
- Responsibilities: pages, API, server actions

**Middleware:**
- Location: `portfolio/proxy.ts`

**Instrumentation:**
- Location: `portfolio/instrumentation.ts` (loads `sentry.server.config.ts` / `sentry.edge.config.ts`, exports `onRequestError`), `portfolio/instrumentation-client.ts`

**Worker:**
- Location: `worker/index.ts` (run with `npx tsx index.ts`, see `worker/Dockerfile`); env loaded by `worker/env.ts`
- Responsibilities: verify and warm up email, reindex search, start metrics, start the workers, schedule repeatable jobs, health monitor, graceful shutdown on SIGTERM/SIGINT, heartbeat log every 30 s

**Search service:**
- Location: `search/main.go`; port from `PORT` (default 8080)

**Migrations:**
- `migrate` service in `docker-compose.prod.yml` (image `romulodm-migrator`) runs Prisma migrations from `packages/database/prisma/migrations/`

**Scripts:**
- `portfolio/scripts/*.ts|mjs` (cleanup jobs/subscribers, seed, blocklist update, resume generation, ops password hash), `worker/scripts/ga4-check.ts`, `scripts/check-rate-limits.mjs`, `scripts/spotify-auth.mjs`

**CI/CD:**
- `.github/workflows/ci.yml` (lint, typecheck, unit tests, build; mirrored by `npm run ci`), `.github/workflows/deploy.yml` (build 4 images → GHCR → VPS pull, migrate, swap → notify bot), plus security workflows (`secret-scan.yml`, `static-security.yml`, `security-review.yml`, `dependency-review.yml`)

## Error Handling

**Strategy:** Fail closed on the primary operation, fail open on side effects. Route handlers catch and map errors to typed JSON responses. Background side effects (search sync, view recording, notifications) log and swallow so the main request can still succeed.

**Patterns:**
- Route handlers wrap their body in `try/catch`; a `RequestValidationError`/`ZodError` becomes `validationErrorResponse`, anything else becomes `internalErrorResponse(context, error, message)`, which logs and reports to Sentry (`portfolio/lib/api-errors.ts`, `portfolio/lib/sentry.ts`)
- Page level: `portfolio/app/[locale]/error.tsx`, `portfolio/app/global-error.tsx`, `not-found.tsx` at the root and locale levels
- Worker: `worker.on("failed")` → `recordQueueFailure` + `logWorkerError`; alerts (`sendWorkerAlertAsync`, `worker/lib/alerts.ts` → Telegram bot / WhatsApp) fire only once attempts are exhausted; `uncaughtException` → alert → `flushSentry` → exit(1)
- Webhooks: duplicate deliveries return 200 `{ ok: true, duplicate: true }`; signature failures return 400

## Cross-Cutting Concerns

**Logging:** `console.*` in the portfolio plus `logApiError`; structured JSON events in the worker through `logWorkerEvent(level, event, data)` / `logWorkerError` (`worker/lib/worker-observability.ts`), persisted to a Redis ring buffer and shown at `/api/admin/observability/worker/logs`. Sentry runs in the app (server, edge, client) and in the worker (`worker/lib/sentry.ts`).
**Validation:** zod schemas in route handlers through `portfolio/lib/api-validation.ts`; Cloudflare Turnstile for public forms (`portfolio/lib/turnstile.ts`, `portfolio/hooks/useTurnstile.ts`); content moderation for user text (`portfolio/lib/moderation/`); sanitizing of newsletter HTML (`portfolio/lib/newsletter-html-sanitizer.ts`).
**Authentication:** NextAuth v4 with the JWT session strategy (`portfolio/lib/auth.ts`): Google, GitHub, Credentials (bcrypt). Session types are extended in `portfolio/types/next-auth.d.ts`. The admin role is `User.admin`. Admin ops such as backup download also use an ops password (`portfolio/lib/backups/ops-password.ts`).
**Rate limiting:** Redis-backed `rateLimit(key, max, windowSeconds)` + `getRequestIp` (`portfolio/lib/rate-limit.ts`); keys look like `feature:action:userId:ip`.
**i18n:** `next-intl` (`portfolio/i18n/routing.ts`, `request.ts`, `navigation.ts`), messages in `portfolio/messages/{en,pt}.json`; API routes use `getApiTranslator(req)` (`portfolio/lib/api-intl.ts`, which resolves the locale from `NEXT_LOCALE` cookie / Accept-Language); DB content is translated per locale (`PostTranslation`); legal markdown in `portfolio/content/legal/*.{locale}.md`.
**Analytics:** GA4 client (`portfolio/components/GoogleAnalytics.tsx`) and Data API (`portfolio/lib/ga4.ts`, `worker/lib/ga4.ts`) for the admin analytics dashboard.

---

*Architecture analysis: 2026-09-25*
