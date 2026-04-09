# External Integrations

**Analysis Date:** 2026-04-08

## APIs & External Services

**Payment Processing:**
- Stripe - Card donations
  - SDK/Client: `stripe` plus `@stripe/react-stripe-js`
  - Auth: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  - Endpoints used: `portfolio/app/api/donations/stripe/create-intent/route.ts`, `portfolio/app/api/donations/stripe/webhook/route.ts`
- Abacate Pay - PIX donations
  - Integration method: custom helper in `portfolio/lib/payments/abacate.ts`
  - Auth: env-driven API credentials
  - Endpoints used: `portfolio/app/api/donations/pix/create/route.ts`, `portfolio/app/api/donations/pix/webhook/route.ts`
- Ethereum wallet verification - crypto donations
  - Integration method: custom route logic under `portfolio/app/api/donations/eth/verify/route.ts`
  - Auth: wallet/transaction data from the client and env-configured chain settings

**Email/SMS/Messaging:**
- SMTP or AWS SES - transactional and campaign email delivery
  - SDK/Client: `nodemailer` plus `@aws-sdk/client-ses`
  - Auth: SMTP creds or AWS SES creds in env vars
  - Templates: local HTML generators in `worker/lib/email/templates.ts`
- WAHA (WhatsApp HTTP API) - comment alerts and daily status messages
  - Integration method: `fetch` calls in `worker/lib/whatsapp.ts`
  - Auth: `WAHA_URL`, `WAHA_CHAT_ID`, optional `WAHA_API_KEY`

**External APIs:**
- OpenAI - content moderation and AI translation
  - SDK/Client: `openai`
  - Auth: `OPENAI_API_KEY`
  - Integration points: `portfolio/lib/moderation/providers/openai.ts`, `portfolio/lib/translate.ts`
- Google Safe Browsing - malicious-link checks in moderation flow
  - Integration point: `portfolio/lib/moderation/providers/safe-browsing.ts`
  - Auth: env-based API key
- Google OAuth - social sign-in
  - Integration point: `portfolio/lib/auth.ts`
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Umami API - daily analytics summary
  - Integration method: login + REST fetches in `worker/lib/whatsapp.ts`
  - Credentials: `UMAMI_URL`, `UMAMI_USER`, `UMAMI_PASSWORD`, `UMAMI_SITE_ID`

## Data Storage

**Databases:**
- PostgreSQL - primary relational store
  - Connection: `DATABASE_URL`
  - Client: Prisma via `@romulo/database`
  - Migrations: `packages/database/prisma/migrations/`
  - Domain data includes users, posts, translations, comments, moderation flags, newsletter campaigns, and donations

**File Storage:**
- MinIO (S3-compatible) - upload storage for blog images/assets
  - SDK/Client: `@aws-sdk/client-s3` and presigned uploads
  - Auth: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, bucket/env config
  - Integration point: `portfolio/lib/s3.ts` and `portfolio/app/api/uploads/presign/route.ts`

**Caching / Queues / Buffers:**
- Redis - queue backend and ephemeral counters
  - Connection: `REDIS_URL`
  - Client: `ioredis`
  - Integration points: `packages/queues/lib/redis.ts`, `portfolio/lib/redis.ts`, `worker/lib/redis.ts`
- BullMQ - async job orchestration on top of Redis
  - Queue definitions: `packages/queues/lib/queues.ts`
  - Producers: `portfolio/lib/queues/email.queue.ts`, `portfolio/lib/queues/notification.queue.ts`
  - Consumers: `worker/workers/*.ts`

## Authentication & Identity

**Auth Provider:**
- NextAuth - custom auth/session management inside the Next.js app
  - Implementation: `portfolio/lib/auth.ts`
  - Token storage: JWT session strategy
  - Session management: `getServerSession` in route handlers and helpers

**OAuth Integrations:**
- Google OAuth - optional sign-in path
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Scopes: standard email/profile access via NextAuth provider defaults

**Credentials Auth:**
- Email/password login - custom credential flow
  - Password hashing: `bcryptjs`
  - User data: Prisma `User` model and `PasswordResetToken` model in `packages/database/prisma/schema.prisma`

## Monitoring & Observability

**Analytics:**
- Umami - traffic analytics and daily metrics reporting
  - Dashboard/API integration: compose services plus `worker/lib/whatsapp.ts`
  - Shared dashboard URL: env-based `UMAMI_SHARED_URL`
- Vercel analytics/speed insights packages are installed in the legacy `frontend/` app

**Logs:**
- No dedicated logging platform is wired in code
- Observability is currently stdout/stderr oriented with extensive `console.log`/`console.error` usage across app routes and worker processes

## CI/CD & Deployment

**Hosting:**
- Docker-first deployment shape
  - Next app container built from `portfolio/Dockerfile`
  - Worker container built from `worker/Dockerfile`
  - Reverse proxy assumptions in `nginx/default.conf`
- Vercel config files exist (`frontend/vercel.json`, `portfolio/vercel.json`), suggesting at least partial or historical Vercel deployment support

**CI Pipeline:**
- No committed GitHub Actions or other CI config was found in the repo root during this pass

## Environment Configuration

**Development:**
- Root `.env` plus app/package-specific `.env` files are present
- `docker-compose.dev.yml` provisions Postgres, Redis, MinIO, Mailcatcher, Umami, WAHA, the worker, and the Next app
- Local file/object storage and messaging integrations are expected to run via containers rather than mocks

**Staging/Production:**
- No separate committed env template hierarchy or staging compose override was found
- Production readiness depends on external secret management outside the repo

## Webhooks & Callbacks

**Incoming:**
- Stripe - `portfolio/app/api/donations/stripe/webhook/route.ts`
  - Verification: `stripe.webhooks.constructEvent(...)`
  - Events handled: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Abacate PIX - `portfolio/app/api/donations/pix/webhook/route.ts`
  - Verification: custom route logic
  - Events: PIX charge lifecycle

**Outgoing:**
- WAHA - sends WhatsApp messages on comment events and daily summaries
- Email providers - sends confirmation, welcome, unsubscribe, password reset, and campaign emails
- MinIO/S3 - presigned upload URLs returned to authenticated clients

---
*Integration audit: 2026-04-08*
*Update when adding/removing external services*
