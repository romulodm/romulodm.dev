# Codebase Concerns

**Analysis Date:** 2026-09-25

## Tech Debt

**Dead "game" / Centrifugo remnants:**
- Issue: A removed multiplayer game still leaves traces. `portfolio/next.config.js` lists `transpilePackages: ["game", "phaser", "centrifuge"]` and sets a Cache-Control header for `/game/assets/:path*`, but `portfolio/package.json` declares none of these packages and `portfolio/public/game` does not exist. `worker/workers/game.worker.ts` publishes to Centrifugo at `CENTRIFUGO_API_URL`, which defaults to `http://realtime:8000/api`. No compose file defines a `realtime` service, and `worker/index.ts` never imports or starts the game worker.
- Files: `portfolio/next.config.js`, `worker/workers/game.worker.ts`, `worker/index.ts`, `docker-compose.prod.yml`
- Impact: Misleading config. Anyone reading it may assume a realtime service exists, and it adds noise to Next.js build config.
- Fix approach: Delete `worker/workers/game.worker.ts`. Remove the `transpilePackages` entry and the `/game/assets` header rule from `portfolio/next.config.js`.

**Orphan search event consumer:**
- Issue: `worker/workers/search.worker.ts` (around line 132) loops on `redis.brpop("search:events", 2)`, and `worker/index.ts:98` starts it through `startSearchConsumer()`. Nothing in `portfolio/`, `worker/` or `packages/` ever pushes to `search:events`. The portfolio syncs synchronously through `portfolio/lib/search-sync.ts` (`syncPostToSearch`/`removePostFromSearch`, called from `portfolio/app/api/posts/route.ts` and `portfolio/app/api/posts/[id]/route.ts`).
- Files: `worker/workers/search.worker.ts`, `worker/index.ts`, `portfolio/lib/search-sync.ts`
- Impact: The worker holds a Redis connection that polls forever for nothing. It also suggests an async path that doesn't exist. If the search service is down during a post write, the index silently drifts until the next `reindexAll()` at worker boot.
- Fix approach: Pick one path. Either have `search-sync.ts` push to `search:events` and let the worker retry, or delete the consumer and keep the direct HTTP sync, with a retry or reindex job added.

**Stale Vercel config:**
- Issue: `portfolio/vercel.json` defines a cron for `/api/posts/flush-views`, but that route doesn't exist (`portfolio/app/api/posts/` has only `[id]`, `public`, `random` and `route.ts`). Production runs on a VPS through Docker. View flushing is handled by `scheduleViewsFlush` in `worker/workers/views.worker.ts`.
- Files: `portfolio/vercel.json`
- Fix approach: Delete `portfolio/vercel.json`.

**Duplicate backup mechanisms:**
- Issue: Two separate Postgres backup paths exist. The first is `backup/backup.sh` (Alpine plus the AWS CLI), run daily at 03:00 by Ofelia (`cron/config.ini`). The second is the BullMQ `worker/workers/backup.worker.ts` with `worker/lib/backup.ts`, whose output is listed by the admin UI (`portfolio/app/api/admin/observability/backups/`).
- Files: `backup/backup.sh`, `backup/Dockerfile`, `cron/config.ini`, `worker/lib/backup.ts`, `worker/workers/backup.worker.ts`
- Impact: Two retention policies and two formats (`backup_*.tar.gz` and `backup-*.dump`). `backup.sh` retention deletes every object in the bucket older than the cutoff with no prefix filter, so it also deletes the worker's backups if they share `AWS_S3_BUCKET`.
- Fix approach: Standardize on one mechanism. If `backup.sh` stays, give the retention step a `--prefix` filter.

**Unfinished API i18n / inconsistent error responses:**
- Issue: Most routes use `getApiTranslator` plus the helpers in `portfolio/lib/api-errors.ts`. Several routes return hardcoded strings instead:
  - English: `portfolio/app/api/wall/route.ts` and `portfolio/app/api/wall/[id]/route.ts` (for example `{ error: "Unauthorized" }` and `"You already left a message on the wall"`).
  - Portuguese: `portfolio/app/api/donations/onchain/register/route.ts` (`'txHash inválido.'`, `'Muitas tentativas.'`).
  - These routes also don't use a translator: `admin/analytics`, `admin/dashboard`, `admin/observability/*`, `donations/ranking`, `posts/public`, `presence`, `prices`, `profile`, `profile/avatar`, `status`.
- Files: the routes listed above, `portfolio/lib/api-intl.ts`, `portfolio/lib/api-errors.ts`
- Impact: Error messages come back in mixed languages and in different shapes. This matches the open blocker in `.planning/STATE.md`.
- Fix approach: Route every error through `badRequestResponse`/`unauthorizedResponse`/`rateLimitResponse` with `t(...)` keys in `portfolio/messages/*.json`.

**Loose TypeScript in portfolio:**
- Issue: `portfolio/tsconfig.json` sets `"noImplicitAny": false`, and there are about 88 `as any`/`: any` casts. Heavy spots are `portfolio/lib/auth.ts` (session and token plumbing), `portfolio/lib/auth-helpers.ts`, `portfolio/components/support/DonationWidget.tsx`, `portfolio/components/admin/dashboard/charts.tsx` and `portfolio/app/api/donations/pix/create/route.ts`.
- Impact: Session shape (`id`, `admin`, `username`, avatar fields) isn't type-checked, so a typo in a session field compiles fine.
- Fix approach: Add a `types/next-auth.d.ts` module augmentation for `Session`/`JWT`, remove the casts, then turn `noImplicitAny` on.

**Oversized components/routes:**
- Files: `portfolio/components/sections/vision/Software.tsx` (790 lines), `portfolio/components/sections/terminal/TerminalExtraMessages.tsx` (772), `portfolio/components/sections/terminal/TerminalMessages.tsx` (753), `portfolio/app/api/admin/dashboard/route.ts` (701), `portfolio/components/support/DonationWidget.tsx` (672), `worker/workers/donations.worker.ts` (653), `portfolio/app/[locale]/admin/observability/system/page.tsx` (627)
- Impact: Hard to review and test. The dashboard route bundles dozens of Prisma queries into one handler.
- Fix approach: Split the dashboard into per-panel query modules under `portfolio/lib/`. Move terminal message data into `portfolio/data/`.

**Layering leak:**
- Issue: The API route `portfolio/app/api/wall/route.ts` imports validation from the UI module `portfolio/components/wall/cardArt.ts`.
- Fix approach: Move `CARD_ART_STYLES`/`CARD_ART_TONES` and the guards into `portfolio/lib/wall.ts` and import them from there in both places.

**Formatting / encoding hygiene:**
- Issue: No formatter is configured (no Prettier or Biome), and 59 tracked `.ts`/`.tsx` files start with a UTF-8 BOM (for example `portfolio/app/api/donations/pix/simulate/route.ts`). Quote style differs between files (single quotes without semicolons in `onchain/register/route.ts`, double quotes elsewhere).
- Fix approach: Add Prettier with a lint-staged hook and strip the BOMs in a single commit.

**Working-tree clutter:**
- Issue: `portfolio/components/sections/Herobackup.tsx` is an untracked backup copy. `portfolio/components/sections/vision/illustrations/SatelliteIllustration.tsx` is deleted but not committed. Stale compiled tests sit in `worker/dist/` (for example `worker/dist/tests/integration/email.worker.test.js`); this directory is gitignored, but the worker image never uses it. `README.md` links to `docs/DEPLOY.md`, but there is no `docs/` directory.
- Fix approach: Delete the backup copy, commit the deletion, run `rm -rf worker/dist`, and either write `docs/DEPLOY.md` or fix the README link.

## Known Bugs

**Telegram webhook reuses one Response object across requests:**
- Symptoms: `const OK = NextResponse.json({ ok: true });` is created once at module scope and returned from every branch. A Response body stream can only be read once, so after the first delivery, later requests can fail with "body already used/locked" and return a 500. Telegram then retries and eventually drops updates.
- Files: `portfolio/app/api/telegram/webhook/route.ts:46`
- Trigger: Two or more webhook deliveries to the same server process.
- Fix: Replace it with a function, `const ok = () => NextResponse.json({ ok: true });`, and return `ok()`.

**Wall one-message-per-user check is racy:**
- Symptoms: `POST /api/wall` runs `findFirst({ where: { authorId } })` and then `create`. Two concurrent requests can both pass the check. The schema has only `@@index([authorId])`, not `@unique`.
- Files: `portfolio/app/api/wall/route.ts`, `packages/database/prisma/schema.prisma` (model `WallMessage`)
- Fix: Add `@@unique([authorId])` with a migration, and catch Prisma `P2002` and return 409.

**Backup retention likely fails on Alpine:**
- Symptoms: `backup/backup.sh` computes `CUTOFF=$(date -d "-${RETENTION_DAYS} days" ...)`. The image (`backup/Dockerfile`, `alpine:3.19`) doesn't install `coreutils`, and BusyBox `date` doesn't parse relative expressions like `-7 days`. Under `set -e` the script exits after uploading, so old backups are never pruned.
- Files: `backup/backup.sh`, `backup/Dockerfile`
- Fix: Add `coreutils` to the `apk add` line, or compute the cutoff with `date -d @$(( $(date +%s) - N*86400 ))`.

## Security Considerations

**Ban not enforced on most write paths:**
- Risk: `banned` is checked only in credentials `authorize` (`portfolio/lib/auth.ts`) and in comment creation (`portfolio/app/api/comments/route.ts:108`). OAuth sign-in (`handleOAuthSignIn`) never checks it. Wall posts, votes, likes, profile and avatar updates don't check it either. Sessions are JWTs (`session: { strategy: "jwt" }`), so a ban or an admin revocation only takes effect when the token is re-read.
- Files: `portfolio/lib/auth.ts`, `portfolio/lib/auth-helpers.ts`, `portfolio/app/api/wall/route.ts`, `portfolio/app/api/comments/[id]/vote/route.ts`, `portfolio/app/api/posts/[id]/like/route.ts`, `portfolio/app/api/profile/route.ts`
- Recommendations: Reject banned users in `handleOAuthSignIn`. Add a `requireActiveUser()` helper in `auth-helpers.ts` that reads `banned` from the database, and use it for every authenticated write. In the `jwt` callback, re-read `admin`/`banned` periodically (for example when a timestamp in the token goes stale).

**No Content-Security-Policy or HSTS:**
- Risk: `nginx/conf.d/security-headers.inc` sets X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy, but no CSP. `Strict-Transport-Security` is commented out (line 61). The app injects HTML in many places with `dangerouslySetInnerHTML` (see below), so a CSP would be the second line of defense.
- Files: `nginx/conf.d/security-headers.inc`, `portfolio/next.config.js`
- Recommendations: Enable HSTS once HTTPS works on every vhost. Add a CSP that allows the known third parties (Stripe, Turnstile, GA4, Sentry, MapLibre and MinIO origins), starting in report-only mode.

**Search highlight HTML is not escaped:**
- Risk: `search/engine/highlight.go` wraps matches in `<mark>` without HTML-escaping the source text. `portfolio/components/blog/SearchDialog.tsx:184-190` and `portfolio/components/blog/BlogHeader.tsx:303-307` render `hit.title`/`hit.summary` through `dangerouslySetInnerHTML`. Titles and summaries are admin-authored, but any HTML in them runs in visitors' browsers.
- Files: `search/engine/highlight.go`, `search/api/handler.go`, the components above
- Recommendations: In `Highlight`, run `html.EscapeString` on each text segment before adding the `<mark>` tags.

**Search service auth fails open:**
- Risk: `requireAuth` in `search/api/handler.go` skips authentication entirely when `SEARCH_INTERNAL_SECRET` is empty, and compares tokens with `!=`, which isn't constant-time. Production enforces the variable (`${SEARCH_INTERNAL_SECRET:?...}` in `docker-compose.prod.yml`). `docker-compose.dev.yml` and `docker-compose.dev.nginx.yml` commit a literal secret value and publish port `8080:8080`.
- Recommendations: Fail closed when the secret is missing (unless `ENV=dev`), use `subtle.ConstantTimeCompare`, and read the dev secret from `.env`.

**Telegram secret compare not constant-time:**
- Files: `portfolio/app/api/telegram/webhook/route.ts` (uses `!==`, unlike the `timingSafeEqual` in `portfolio/app/api/donations/pix/webhook/route.ts`)
- Recommendations: Reuse the `secretMatches` helper. Extract it to `portfolio/lib/` first.

**PIX simulate endpoint gated only by NODE_ENV:**
- Risk: `portfolio/app/api/donations/pix/simulate/route.ts` needs no authentication and marks any `PENDING` donation `COMPLETED` by `donationId`, whether or not `pixId` belongs to it. It is blocked only when `NODE_ENV === "production"`. A staging or demo deployment (`nginx/templates/app.demo.conf`) that runs a non-production `NODE_ENV` would expose it.
- Recommendations: Require `requireAdmin()`, or an explicit `ENABLE_PIX_SIMULATION=true` flag, and check that `pixId` matches the donation's `abacatePayChargeId`.

**Third-party API keys in query strings:**
- Risk: Keys in URLs end up in proxy, CDN and error logs, and Sentry breadcrumbs capture fetch URLs.
- Files: `portfolio/app/api/donations/eth/verify/route.ts:46-47` (`apikey=${process.env.ETHERSCAN_API_KEY}`), `portfolio/lib/moderation/providers/safe-browsing.ts:51` (`?key=${apiKey}`)
- Recommendations: Etherscan and Safe Browsing both require query-string keys, so scrub these URLs in Sentry `beforeBreadcrumb` (`portfolio/sentry.server.config.ts`).

**Client-exposed "secret" env vars:**
- Risk: `NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD` and `NEXT_PUBLIC_TERMINAL_SECRET_REWARD` (`portfolio/components/sections/terminal/TerminalClient.tsx:63`, build args in `docker-compose.prod.yml`) are inlined into the client JS bundle, so anyone can read them.
- Recommendations: Treat them as public, or move the check to a server route if the reward has real value.

**NextAuth debug outside production:**
- Files: `portfolio/lib/auth.ts:109` (`debug: process.env.NODE_ENV !== "production"`)
- Risk: Any non-production deployment that is publicly reachable logs verbose auth details, including token contents.

**Sensitive local files at repo root:**
- `.env`, `.env.production` and `t.env` are present and gitignored (`.gitignore` covers `.env`, `.env.*` and `t.env`). Keep it that way, and remove `t.env` if it is a scratch copy.
- `minio-images.tar` (about 62 MB) and `romulodm-images.tar` (about 853 MB) are untracked and **not ignored**, so a `git add .` would commit nearly 1 GB of Docker images. Add `*.tar` to `.gitignore`.

## Performance Bottlenecks

**On-chain donation registration blocks the request for up to 90 s:**
- Problem: `portfolio/app/api/donations/onchain/register/route.ts` polls `getTransactionReceipt` every 3 s for up to `MAX_WAIT = 90_000` ms inside the HTTP handler.
- Cause: Confirmation is synchronous.
- Improvement path: Save the donation as `PENDING` and return immediately. Let `worker/workers/onchain.worker.ts` (which already has `scheduleOnchainRetry`) confirm it, and have the client poll a status endpoint.

**Admin dashboard single mega-query:**
- Problem: `portfolio/app/api/admin/dashboard/route.ts` runs dozens of Prisma aggregates per request.
- Improvement path: Cache per panel in Redis with a short TTL, the way `portfolio/lib/status-cache.ts` does, or split it into lazy-loaded endpoints.

**Unoptimized static images:**
- Problem: `portfolio/public/assets/evento_3.png` (5.8 MB), `formatura.png` (3.3 MB) and `curso.png` (1.1 MB) are imported in `portfolio/components/sections/About.tsx`. `next/image` resizes them at runtime, but each first request still costs CPU on the VPS, and the repository grows with every version.
- Improvement path: Pre-convert them to WebP/AVIF at display size.

## Fragile Areas

**Client IP resolution / rate limiting:**
- Files: `portfolio/lib/rate-limit.ts` (`getRequestIp`), `nginx/conf.d/proxy-params.inc`, `nginx/conf.d/cloudflare-real-ip.inc`
- Why fragile: Every per-IP limit trusts `x-real-ip`, which nginx sets. If the proxy changes, `X-Real-IP $remote_addr` is dropped, or the Cloudflare ranges in `cloudflare-real-ip.inc` go stale (refreshed by `nginx/scripts/update-cloudflare-ips.sh`), limits become bypassable, or all visitors share one bucket (`"anonymous"`).
- Safe modification: Keep `proxy-params.inc` included in every `location`, and run `update-cloudflare-ips.sh` regularly.
- Test coverage: `portfolio/lib/rate-limit.test.ts` covers the limiter, not the proxy config.

**Payments / donation settlement:**
- Files: `portfolio/app/api/donations/**`, `packages/database/settlement.ts`, `portfolio/lib/payments/webhook-events.ts`, `worker/workers/donations.worker.ts`, `packages/web3/`
- Why fragile: Four payment rails (Stripe, PIX via AbacatePay, ETH through Etherscan, on-chain USDC/USDT on Arbitrum/Polygon/Base) plus reconcile and audit jobs. Webhook idempotency depends on `recordWebhookEvent`.
- Safe modification: Always settle through `markDonationCompleted`/`markDonationExpired` in `@romulo/database`, and never through a raw `prisma.donation.update`. `pix/simulate` currently breaks this rule.
- Test coverage: Only PIX webhook and ETH verify are unit tested (`portfolio/app/api/donations/__tests__/`). The Stripe webhook, on-chain register and `packages/web3` have no tests.

**Next.js request interception (`proxy.ts`):**
- Files: `portfolio/proxy.ts`
- Why fragile: The matcher excludes `api` and any path containing a dot. New top-level routes that need locale handling must match it, and routes that must skip i18n (webhooks, feeds) must stay excluded.

## Scaling Limits

**Search engine:**
- Current capacity: The index lives in memory in a single Go process (`search/engine/`), persisted to a JSON snapshot (`search/api/snapshot.go`, `SNAPSHOT_PATH`).
- Limit: One instance, no replication, and the whole snapshot is rewritten on save. That's fine for a personal blog but can't scale horizontally.
- Scaling path: Acceptable at current size. If it outgrows this, move to Meilisearch or Postgres FTS.

**Single-VPS deployment:**
- Postgres, Redis, MinIO, app, worker, search and nginx all run on one host (`docker-compose.prod.yml`). The in-process fallback rate limiter (`portfolio/lib/rate-limit.ts`) and the module-level caches assume one app replica.
- Backups cover Postgres only. MinIO objects (uploaded images and avatars) are not backed up by `backup/backup.sh` or `worker/lib/backup.ts`.

## Dependencies at Risk

**next-auth v4 on Next 16:**
- Risk: `next-auth@^4.24.13` is in maintenance mode. Auth.js v5 is the supported path for the App Router. Type augmentation is also missing (see the Loose TypeScript item).
- Migration plan: Move to Auth.js v5 (`auth()` helper) and replace `getServerSession(authOptions)` in `portfolio/lib/auth-helpers.ts` and in direct callers (`portfolio/app/api/wall/*`).

**Etherscan V1 API:**
- Risk: `portfolio/app/api/donations/eth/verify/route.ts` calls `https://api.etherscan.io/api?module=proxy...`, the legacy V1 endpoint. Etherscan has moved to the multichain V2 API (`/v2/api?chainid=...`) and deprecated V1.
- Impact: ETH donation verification fails when V1 shuts down.
- Migration plan: Switch to V2, or use a viem public client against an RPC through `getRpcUrl` from `@romulo/web3`, as `onchain/register` already does.

**Unpinned `:latest` images:**
- Risk: `minio/minio:latest` and `mcuadros/ofelia:latest` in `docker-compose.prod.yml`. Upstream MinIO no longer ships community Docker images regularly (the local `minio-images.tar` suggests the image is saved as a workaround), so `latest` may be frozen or disappear.
- Migration plan: Pin exact digests. Evaluate a maintained S3-compatible alternative, or keep the saved image in a private registry (GHCR).

**Conflicting `overrides`:**
- Risk: Root `package.json` overrides `nodemailer` to `^10.0.9`, while `portfolio/package.json` overrides it to `^8.0.5`. npm applies root overrides, so the portfolio entry is dead and misleading.
- Migration plan: Remove the portfolio override.

## Missing Critical Features

**No integration/E2E gate in CI:**
- Problem: `.github/workflows/ci.yml` runs lint, typecheck, `test:unit` and the build only. `test:integration` (Postgres and Redis) and `test:e2e` (Playwright, `portfolio/tests/e2e/`) never run in CI, and no coverage is collected.
- Blocks: Regressions in route handlers covered only by `portfolio/tests/integration/api/*` reach production.

**No data backup for object storage:**
- See Scaling Limits: MinIO uploads have no backup.

## Test Coverage Gaps

**Stripe webhook and on-chain donations:**
- What's not tested: Signature verification, idempotency and settlement in `portfolio/app/api/donations/stripe/webhook/route.ts`. Receipt parsing and amount checks in `portfolio/app/api/donations/onchain/register/route.ts`.
- Risk: Money is credited wrongly or missed without anyone noticing.
- Priority: High

**Auth and moderation:**
- What's not tested: `handleOAuthSignIn` and the `jwt` refresh logic in `portfolio/lib/auth.ts`, ban enforcement, `portfolio/lib/moderation/`.
- Priority: High

**Webhooks for Telegram and the wall:**
- What's not tested: `portfolio/app/api/telegram/webhook/route.ts` (a test with two requests would expose the reused-Response bug) and `portfolio/app/api/wall/*`.
- Priority: Medium

**Internal packages and search service:**
- What's not tested: `packages/web3` (price conversion, `decryptMessage`), `packages/templates` (email rendering), and the Go search service (`search/` has no `*_test.go`).
- Priority: Medium

**UI components:**
- What's not tested: No component tests exist. `portfolio/components/` holds about 170 files, and only `portfolio/components/auth/schemas.test.ts` covers schema logic.
- Priority: Low

---

*Concerns audit: 2026-09-25*
