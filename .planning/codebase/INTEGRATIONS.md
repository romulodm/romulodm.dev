# External Integrations

**Analysis Date:** 2026-09-25

## APIs & External Services

**Payments / Donations:**
- Stripe - card donations via PaymentIntents
  - SDK/Client: `stripe` 21 (server, `portfolio/lib/payments/stripe.ts`), `@stripe/stripe-js` + `@stripe/react-stripe-js` (client)
  - Routes: `portfolio/app/api/donations/stripe/create-intent/`, `portfolio/app/api/donations/stripe/webhook/route.ts`
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Worker side: `worker/workers/donations.worker.ts` (uses `stripe`)
- AbacatePay - Brazilian PIX QR-code donations
  - SDK/Client: raw `fetch` to `https://api.abacatepay.com/v1` (`portfolio/lib/payments/abacate.ts`: `pixQrCode/create`, `pixQrCode/check`, `pixQrCode/simulate-payment`)
  - Routes: `portfolio/app/api/donations/pix/{create,check,simulate,webhook}/`
  - Auth: `ABACATE_PAY_API_KEY`, `ABACATE_PAY_WEBHOOK_SECRET`
- Webhook idempotency: `portfolio/lib/payments/webhook-events.ts` backed by Prisma `WebhookEvent` model

**Blockchain / Crypto donations:**
- EVM chains (Arbitrum, Polygon, Base; ETH, USDC and other tokens) - on-chain donation verification
  - SDK/Client: `viem` (`packages/web3/src/config.ts` defines networks/tokens; `worker/workers/onchain.worker.ts` polls/verifies)
  - RPC: defaults to public RPCs (`https://arb1.arbitrum.io/rpc`, `https://polygon-rpc.com`, `https://mainnet.base.org`), overridable per network via `<NETWORK>_RPC_URL` (`getRpcUrl()` in `packages/web3/src/config.ts`)
  - Routes: `portfolio/app/api/donations/onchain/register/route.ts`, `portfolio/app/api/donations/eth/verify/route.ts`
  - Receiving wallet: `NEXT_PUBLIC_WALLET_ADDRESS`, `WALLET_ADDRESS`, `ETH_WALLET_ADDRESS`
  - Message encryption: NaCl box (`packages/web3/src/encryption.ts`) with `NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY` / `ENCRYPTION_PRIVATE_KEY`
- Etherscan API - ETH tx lookup (`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash` in `portfolio/app/api/donations/eth/verify/route.ts`)
  - Auth: `ETHERSCAN_API_KEY` (sent as URL query param)
- CoinGecko - token USD prices (`https://api.coingecko.com/api/v3/simple/price` in `packages/web3/src/price.ts`; exposed via `portfolio/app/api/prices/route.ts`)
  - Auth: none (public endpoint)

**AI:**
- OpenAI - blog post translation pt/en (`portfolio/lib/translate.ts`, `openai` SDK) and comment moderation (`https://api.openai.com/v1/moderations` via fetch in `portfolio/lib/moderation/providers/openai.ts`)
  - Auth: `OPENAI_API_KEY`

**Content Safety / Anti-abuse:**
- Google Safe Browsing v4 - URL threat checks in comments (`portfolio/lib/moderation/providers/safe-browsing.ts`)
  - Auth: `GOOGLE_SAFE_BROWSING_API_KEY` (URL query param)
- Local domain blocklists - `portfolio/lib/moderation/providers/domain-blocklist.ts` with data in `portfolio/lib/moderation/data/{gambling,porn}-domains.json` (refreshed by `npm --prefix portfolio run update-blocklists`)
- Cloudflare Turnstile - CAPTCHA verification (`https://challenges.cloudflare.com/turnstile/v0/siteverify` in `portfolio/lib/turnstile.ts`)
  - Auth: `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Redis-based rate limiting - `portfolio/lib/rate-limit.ts`

**"Presence" widgets (live status):**
- GitHub REST search + GraphQL - recent commits/contributions (`portfolio/lib/presence/github.ts`, `portfolio/components/sections/projects/github-contributions.ts`, `portfolio/components/sections/projects/data.ts`)
  - Auth: `NEXT_GITHUB_TOKEN`
- Spotify Web API - now playing (`portfolio/lib/presence/spotify.ts`, refresh-token flow against `https://accounts.spotify.com/api/token`; helper to obtain token: `scripts/spotify-auth.mjs`)
  - Auth: `SPOTIFY_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`
- Visitor presence - `portfolio/lib/presence/visitors.ts`, `portfolio/lib/visitor.ts` (HMAC visitor id with `VISITOR_ID_SECRET`), route `portfolio/app/api/presence/route.ts`

**Analytics:**
- Google Analytics 4 (client tag) - `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- GA4 Data API - admin dashboard reports (`portfolio/lib/ga4.ts`, `worker/lib/ga4.ts`, `@google-analytics/data`); CLI checks `npm run ga4:check` (`worker/scripts/ga4-check.ts`)
  - Auth: `GA4_PROPERTY_ID`, `GOOGLE_SA_KEY` (inline service account JSON) or `GOOGLE_APPLICATION_CREDENTIALS` (file path)

**Email (outbound):**
- Provider chosen by `EMAIL_PROVIDER=ses|smtp|resend|fallback` (default `smtp`) in `worker/lib/email/email.service.ts`
  - SMTP via `nodemailer` - `worker/lib/email/providers/smtp.provider.ts` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`)
  - AWS SES - `worker/lib/email/providers/ses.provider.ts` (`@aws-sdk/client-ses`; `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM`)
  - Resend - `worker/lib/email/providers/resend.provider.ts` (`RESEND_API_KEY`, `RESEND_FROM`)
  - Fallback chain - `worker/lib/email/providers/fallback.provider.ts`
  - Sender name: `EMAIL_FROM_NAME`
  - Dev: `sj26/mailcatcher` container in `docker-compose.dev.yml`
- Templates: `packages/templates/src/templates/`
- Enqueued from portfolio via `portfolio/lib/queues/email.queue.ts`, `password.queue.ts`; consumed by `worker/workers/email.worker.ts`

**Messaging / Notifications:**
- Telegram (via own bot bridge) - worker/CI alerts POST to `${TELEGRAM_BOT_URL}/notify` (`worker/lib/telegram.ts`, `worker/lib/alerts.ts`), bridge implemented in `bot/main.py` (FastAPI, bearer auth with shared secret, forwards to Telegram Bot API with MarkdownV2)
  - Auth: `TELEGRAM_BOT_URL`, `TELEGRAM_NOTIFY_SECRET` (shared), bot side `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  - Tuning: `TELEGRAM_BOT_TIMEOUT_MS`, `TELEGRAM_ALERT_TIMEOUT_MS`, `WORKER_TELEGRAM_ALERTS`, `WORKER_ALERT_WINDOW_MS`, `WORKER_HEALTH_CHECK_INTERVAL_MS`
- Telegram Bot API direct - `portfolio/app/api/telegram/webhook/route.ts` receives updates and replies via `https://api.telegram.org/bot<token>/sendMessage`
  - Auth: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (checked against `x-telegram-bot-api-secret-token`)
- WhatsApp via WAHA (self-hosted WhatsApp HTTP API) - `worker/lib/whatsapp.ts` (`${WAHA_URL}/api/sendText`)
  - Auth: `WAHA_URL`, `WAHA_API_KEY`, `WAHA_CHAT_ID`
- Centrifugo (realtime pub/sub) - `worker/workers/game.worker.ts` publishes to `CENTRIFUGO_API_URL` (default `http://realtime:8000/api`) with `X-API-Key: CENTRIFUGO_API_KEY`. No `realtime` service exists in any compose file.

**Internal services:**
- Go search service - `portfolio/lib/search.ts` calls `SEARCH_GO_URL` (default `http://localhost:8080`, `http://search-go:8080` in compose); index sync in `portfolio/lib/search-sync.ts` and `worker/workers/search.worker.ts`; internal endpoints protected by `SEARCH_INTERNAL_SECRET` (`search/api/handler.go`); snapshot persisted at `SNAPSHOT_PATH` (`/data/documents.json`, volume `search_data`); health at `/health`

## Data Storage

**Databases:**
- PostgreSQL 16 (`postgres:16-alpine`)
  - Connection: `DATABASE_URL` (container vars `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`)
  - Client: Prisma 5.22 (`packages/database/index.ts`, schema `packages/database/prisma/schema.prisma`, 18 models: User, PasswordResetToken, Post, PostTranslation, PostLike, PostTag, SuspiciousComment, Comment, CommentVote, NewsletterSubscriber, Campaign, CampaignRecipient, CampaignPost, Donation, OnChainDonation, WebhookEvent, WallMessage, ContactMessage)
  - Migrations: `packages/database/prisma/migrations/`, applied by the `migrator` image (`portfolio/Dockerfile` target `migrator`, `npx prisma migrate deploy`; compose service `migrate`, profile `tools`)
  - Tests: `TEST_DATABASE_URL`

**File Storage:**
- MinIO (S3-compatible, `minio/minio:latest`) - blog cover/inline images and avatars
  - Client: `@aws-sdk/client-s3` + presigner (`portfolio/lib/s3.ts`, route `portfolio/app/api/uploads/presign/`, `portfolio/app/api/profile/avatar/`)
  - Config: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`, `MINIO_PUBLIC_URL`; bucket created with anonymous download by the `minio-init` service
- AWS S3 (or S3-compatible) - database backups
  - Shell job: `backup/backup.sh` (`pg_dump` -> tar.gz -> S3, retention `BACKUP_RETENTION_DAYS`), scheduled daily 03:00 by Ofelia (`cron/config.ini`)
  - Worker-driven backups: `worker/lib/backup.ts`, `worker/workers/backup.worker.ts` (`@aws-sdk/lib-storage`), admin listing in `portfolio/lib/backups/s3-client.ts`, `portfolio/app/api/admin/observability/backups/`
  - Config: `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX`, `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY`; admin ops gated by `BACKUP_OPS_PASSWORD_HASH` (`portfolio/lib/backups/ops-password.ts`)

**Caching / Queues:**
- Redis 7 (`redis:7-alpine`)
  - Connection: `REDIS_URL` (tests: `TEST_REDIS_URL`)
  - Clients: `portfolio/lib/redis.ts` (two singletons: general with `maxRetriesPerRequest: 3`, BullMQ with `null`), `worker/lib/redis.ts`
  - Uses: BullMQ queues (`packages/queues/`), rate limiting (`portfolio/lib/rate-limit.ts`), status cache (`portfolio/lib/status-cache.ts`), view counters (`portfolio/lib/views.ts`, flushed by `worker/workers/views.worker.ts`), presence, worker logs
- Next.js cache tags - `portfolio/lib/cache-tags.ts`

## Authentication & Identity

**Auth Provider:**
- NextAuth 4 (`portfolio/lib/auth.ts`, `portfolio/lib/auth-helpers.ts`, `portfolio/app/api/auth/[...nextauth]/`)
  - Implementation: Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), GitHub OAuth (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`), Credentials (email + bcrypt password, rate-limited). Users stored in Prisma `User` with `provider` + `sub`; cross-provider email collision returns `/?error=AccountNotLinked`
  - Registration / password reset: `portfolio/app/api/auth/register/`, `portfolio/app/api/auth/forgot-password/` (Prisma `PasswordResetToken`, email via queue)
  - Secret: `NEXTAUTH_SECRET`; `NEXTAUTH_URL` / `AUTH_TRUST_HOST` as applicable
  - Admin role: `admin` flag on `User`; admin APIs under `portfolio/app/api/admin/`
  - Request edge logic: `portfolio/proxy.ts` (Next 16 proxy/middleware)

## Monitoring & Observability

**Error Tracking:**
- Sentry
  - Next.js: `@sentry/nextjs` (`portfolio/sentry.server.config.ts`, `portfolio/sentry.edge.config.ts`, `portfolio/instrumentation.ts`, `portfolio/instrumentation-client.ts`, `portfolio/lib/sentry.ts`), tunnel route `/monitoring`, source maps uploaded at build when `SENTRY_AUTH_TOKEN` provided (Docker build secret `sentry_auth_token`)
  - Worker: `@sentry/node` (`worker/lib/sentry.ts`)
  - Vars: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_RELEASE`, `SENTRY_RELEASE`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_DEBUG`

**Logs:**
- `console.*` with bracketed prefixes (e.g. `[auth]`, `[Redis]`) in app code
- Worker structured events and failure tracking in `worker/lib/worker-observability.ts` (logs mirrored to Redis), health monitor + Telegram alerts
- System metrics via `dockerode` + `systeminformation` in `worker/workers/metrics.worker.ts` (toggle `ENABLE_METRICS`); surfaced in `portfolio/app/api/admin/observability/{system,worker,search,backups}/` and `portfolio/app/api/status/route.ts`
- nginx access/error logs mounted at `./nginx/logs`

## CI/CD & Deployment

**Hosting:**
- Self-hosted VPS(s) (staging + production) running `docker-compose.prod.yml`; nginx (`nginx/nginx.conf`, `nginx/templates/app.conf` rendered with `envsubst` for `SITE_DOMAIN`/`WWW_DOMAIN`) + Let's Encrypt via `certbot` (renew every 12h); Cloudflare proxy in front (`nginx/conf.d/cloudflare-real-ip.inc`)
- Container registry: GHCR (`ghcr.io/<owner>/romulodm-app`, `-worker`, `-search`, `-migrator`, tagged by commit SHA via `APP_TAG`)
- Telegram bot on Render (`bot/render.yaml`)
- `portfolio/vercel.json` present (cron config only); Vercel is not the active deployment target

**CI Pipeline:**
- GitHub Actions (`.github/workflows/`)
  - `ci.yml` - on PR / push to main / `workflow_call`: `npm ci`, `npm run ci:packages`, lint, typecheck, unit tests, `build:portfolio`, asserts no `http://localhost:3000` in server bundle and that `robots.txt`/`sitemap.xml` are not prerendered
  - `deploy.yml` - manual `workflow_dispatch` (target `staging`|`production`; push trigger commented out): reuses CI, builds/pushes images to GHCR, SSH deploy to VPS replacing app/worker/search
  - `secret-scan.yml` - gitleaks
  - `static-security.yml` - CodeQL (JS/TS + Go)
  - `security-review.yml` - `npm audit` (runtime blocking, full tree informational)
  - `dependency-review.yml` - `actions/dependency-review-action@v4`

## Environment Configuration

**Required env vars (by area):**
- Core: `DATABASE_URL`, `REDIS_URL`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`, `ROBOTS_ALLOW_INDEXING`, `SITE_DOMAIN`, `WWW_DOMAIN`, `APP_SECRET`
- Auth: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Storage: `MINIO_*`, `BACKUP_S3_*`, `BACKUP_OPS_PASSWORD_HASH`, `POSTGRES_*`
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `ABACATE_PAY_API_KEY`, `ABACATE_PAY_WEBHOOK_SECRET`, `ETHERSCAN_API_KEY`, wallet/encryption keys, optional `<NETWORK>_RPC_URL`
- Email: `EMAIL_PROVIDER` + provider-specific vars (`SMTP_*`, `SES_FROM`/`AWS_*`, `RESEND_*`), `EMAIL_FROM_NAME`
- Integrations: `OPENAI_API_KEY`, `GOOGLE_SAFE_BROWSING_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_GITHUB_TOKEN`, `SPOTIFY_*`, `GA4_PROPERTY_ID`, `GOOGLE_SA_KEY`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `VISITOR_ID_SECRET`, `SEARCH_GO_URL`, `SEARCH_INTERNAL_SECRET`
- Notifications: `TELEGRAM_*`, `WAHA_*`, `CENTRIFUGO_*`
- Observability: `SENTRY_*`, `NEXT_PUBLIC_SENTRY_*`
- Client-exposed oddities: `NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD`, `NEXT_PUBLIC_TERMINAL_SECRET_REWARD` (inlined into client bundle by design of `NEXT_PUBLIC_*`)
- Tests: `TEST_DATABASE_URL`, `TEST_REDIS_URL`, `TEST_SUITE`, `PLAYWRIGHT_TEST_BASE_URL`, `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD`, `RL_TEST_EMAIL`, `RL_TEST_PASSWORD`

**Secrets location:**
- Local/VPS: root `.env` (also `.env.production`, `t.env` present in working tree; contents not inspected), loaded via `env_file: .env` in compose
- CI/CD: GitHub repository secrets and GitHub Environment secrets (`staging`, `production`)
- Render dashboard for bot (`sync: false` vars in `bot/render.yaml`)
- Sentry auth token passed as Docker build secret (`sentry_auth_token` in `docker-compose.prod.yml`)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/donations/stripe/webhook` - Stripe events, verified with `stripe.webhooks.constructEvent` + `STRIPE_WEBHOOK_SECRET` (`portfolio/app/api/donations/stripe/webhook/route.ts`)
- `POST /api/donations/pix/webhook` - AbacatePay events, verified by constant-time compare of `x-webhook-secret` header against `ABACATE_PAY_WEBHOOK_SECRET` (`portfolio/app/api/donations/pix/webhook/route.ts`)
- `POST /api/telegram/webhook` - Telegram bot updates, verified via `x-telegram-bot-api-secret-token` == `TELEGRAM_WEBHOOK_SECRET` (`portfolio/app/api/telegram/webhook/route.ts`)
- `GET /api/newsletter/track/[trackingId]` - email open tracking pixel (`portfolio/app/api/newsletter/track/[trackingId]/route.ts`)
- `POST /notify` on bot service - bearer-authenticated notifications from worker/CI (`bot/main.py`)
- `/monitoring` - Sentry tunnel route (proxied to Sentry ingest)

**Outgoing:**
- Telegram bridge `${TELEGRAM_BOT_URL}/notify` (`worker/lib/telegram.ts`)
- WAHA `${WAHA_URL}/api/sendText` (`worker/lib/whatsapp.ts`)
- Centrifugo `${CENTRIFUGO_API_URL}` publish (`worker/workers/game.worker.ts`)
- Go search service index/query (`portfolio/lib/search.ts`, `portfolio/lib/search-sync.ts`, `worker/workers/search.worker.ts`)
- Email providers (SMTP/SES/Resend) from `worker/lib/email/`

---

*Integration audit: 2026-09-25*
