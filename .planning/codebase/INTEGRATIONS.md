# Integrations

## Summary

The codebase integrates with PostgreSQL, Redis, MinIO, Stripe, Abacate Pay, Google OAuth, OpenAI Moderation, Google Safe Browsing, Umami, Telegram, Meilisearch, and a custom Go search service.
Most of those integrations are mediated through thin helpers under `portfolio/lib/**` or `worker/lib/**`.

## Databases and stateful infrastructure

- PostgreSQL is the primary application database via Prisma in `packages/database/prisma/schema.prisma`
- Redis supports rate limiting, view buffering, BullMQ, and search event consumption through `portfolio/lib/redis.ts`, `worker/lib/redis.ts`, and `packages/queues/lib/redis.ts`
- MinIO-compatible object storage is used for uploads through `portfolio/lib/s3.ts`
- Meilisearch is present as a comparison or fallback index through `portfolio/lib/meilisearch.ts`
- The custom Go search service is exposed over HTTP from `search/api/handler.go`

## Authentication and identity

- Google OAuth is configured through `next-auth` in `portfolio/lib/auth.ts`
- Credentials login is also handled in `portfolio/lib/auth.ts` using `bcryptjs`
- Session hydration for the app shell is wired in `portfolio/app/[locale]/layout.tsx` and `portfolio/app/providers.tsx`

## Payments and donation providers

- Stripe Payment Intents are created in `portfolio/app/api/donations/stripe/create-intent/route.ts`
- Stripe webhooks are verified in `portfolio/app/api/donations/stripe/webhook/route.ts`
- Abacate Pay PIX charges are created in `portfolio/lib/payments/abacate.ts`
- PIX webhook reconciliation runs in `portfolio/app/api/donations/pix/webhook/route.ts`
- ETH donation verification has a dedicated route in `portfolio/app/api/donations/eth/verify/route.ts`

## Content, moderation, and search

- OpenAI Moderation is called directly in `portfolio/lib/moderation/providers/openai.ts`
- Google Safe Browsing is called in `portfolio/lib/moderation/providers/safe-browsing.ts`
- Local domain blocklists live under `portfolio/lib/moderation/data/**`
- Portfolio search calls the Go service through `portfolio/lib/search-go.ts`
- The in-process TypeScript search engine is initialized in `portfolio/lib/search.ts`
- Search engine comparisons are exposed through `portfolio/app/api/search/compare/route.ts`
- Worker-side Go index sync happens in `worker/workers/search.worker.ts`

## Messaging, email, and operational notifications

- Transactional and campaign email jobs are queued in `portfolio/lib/queues/email.queue.ts`
- Transactional and campaign email delivery is performed in `worker/workers/email.worker.ts`
- SMTP and SES providers are selected in `worker/lib/email/email.service.ts`
- Telegram notifications and Umami stats fetches are handled in `worker/lib/telegram.ts`
- A legacy WAHA helper still exists in `worker/lib/whatsapp.ts`

## Analytics and monitoring

- Umami is injected into the app shell in `portfolio/app/[locale]/layout.tsx`
- Worker health monitoring lives in `worker/lib/worker-observability.ts`
- Queue lag and failure tracking are started from `worker/index.ts`

## Infrastructure and deployment surfaces

- Docker Compose brings up app, worker, Postgres, Redis, MinIO, Umami, Meilisearch, and search services in `docker-compose.dev.yml`
- The production compose file adds nginx, certbot, backup, and cron in `docker-compose.prod.yml`
- GitHub Actions enforce PR validation, dependency review, secret scanning, security review, and CodeQL under `.github/workflows`

## Integration entry points worth tracing

- `portfolio/app/api/uploads/presign/route.ts`
- `portfolio/app/api/comments/route.ts`
- `portfolio/app/api/newsletter/subscribe/route.ts`
- `portfolio/app/api/newsletter/request-unsubscribe/route.ts`
- `portfolio/app/api/search/route.ts`
- `worker/workers/notification.worker.ts`
- `worker/workers/search.worker.ts`
- `search/api/handler.go`
