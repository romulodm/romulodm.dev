# Technology Stack

**Analysis Date:** 2026-09-25

## Languages

**Primary:**
- TypeScript 5.9.3 (root `overrides` pins `typescript: ^5.9.3`) - Next.js app (`portfolio/`), background worker (`worker/`), internal packages (`packages/*`), test harness (`testing/`), root configs (`vitest.config.ts`, `vitest.config.integration.ts`)

**Secondary:**
- Go 1.22 - Full-text search microservice (`search/`, module `search`, deps `github.com/kljensen/snowball v0.10.0`, `golang.org/x/text v0.14.0`)
- Python 3.12 - Telegram notification bridge (`bot/main.py`, FastAPI)
- POSIX shell - Postgres backup job (`backup/backup.sh`), nginx SSL bootstrap (`nginx/init-ssl.sh`, `nginx/scripts/`)
- JavaScript (CommonJS/ESM) - `portfolio/next.config.js`, `portfolio/postcss.config.js`, `eslint.config.mjs`, `scripts/*.mjs`, `portfolio/scripts/generate-resume-pdf.mjs`
- SQL - Prisma migrations in `packages/database/prisma/migrations/`

## Runtime

**Environment:**
- Node.js 22 (all Node Dockerfiles use `node:22-bookworm-slim`; CI uses `actions/setup-node@v4` with `node-version: 22`; `@types/node` overridden to `^22`). No `.nvmrc`.
- Go 1.22 (`search/Dockerfile`: `golang:1.22-alpine` builder, `alpine:latest` runtime)
- Python 3.12 (`bot/Dockerfile`: `python:3.12-slim`, served by `uvicorn`)

**Package Manager:**
- npm workspaces (root `package.json` `workspaces`: `packages/*`, `portfolio`, `worker`)
- Lockfile: `package-lock.json` present (root, single lockfile for all workspaces)
- Go modules: `search/go.mod` + `search/go.sum`
- pip: `bot/requirements.txt` (pinned versions)

## Frameworks

**Core:**
- Next.js 16.3.x (installed 16.3.5; root override `next: ^16.3.0`) - App Router web app in `portfolio/app/`, `output: 'standalone'`, Turbopack root set to repo root (`portfolio/next.config.js`)
- React 19.2.5 / React DOM 19.2.5 (exact pins in `portfolio/package.json`)
- next-intl 4.x (installed 4.14.4) - i18n, locales `en` + `pt`, default `pt`, `localePrefix: "always"` (`portfolio/i18n/routing.ts`, `portfolio/i18n/request.ts`, messages in `portfolio/messages/en.json`, `portfolio/messages/pt.json`)
- NextAuth 4.24.x (installed 4.24.15) - Auth (`portfolio/lib/auth.ts`, `portfolio/app/api/auth/[...nextauth]/`)
- Prisma 5.22.0 (`@prisma/client` + `prisma` CLI) - ORM, schema at `packages/database/prisma/schema.prisma`
- BullMQ 5.x (installed 5.81.5) - Job queues (`packages/queues/`, consumers in `worker/workers/`)
- FastAPI 0.115.0 + uvicorn 0.30.6 + httpx 0.27.2 + pydantic 2.7.4 - `bot/main.py`
- Go stdlib `net/http` - `search/main.go`, `search/api/handler.go`, custom engine in `search/engine/` (trie, BK-tree, vector, snowball stemming)

**UI:**
- Tailwind CSS 3.4.x (installed 3.4.19) + `@tailwindcss/typography`, `autoprefixer` (`portfolio/tailwind.config.ts`, `portfolio/postcss.config.js`)
- MUI 7.3.x (`@mui/material`) with Emotion (`@emotion/react`, `@emotion/styled`)
- Radix UI primitives (`@radix-ui/react-dropdown-menu`, `react-slot`, `react-tooltip`), `class-variance-authority`, `clsx`, `tailwind-merge`
- Three.js 0.167.1 + `@react-three/fiber` 9, `@react-three/drei` 10, `@react-three/rapier`, `meshline`
- `@react-spring/web`, `react-scroll-parallax`, `embla-carousel-react`, `recharts` 3, `maplibre-gl` 6, `lucide-react`, `react-icons`, `react-toastify`, `nextjs-toploader`, `next-themes`, `seedicon` (generated avatars)
- `transpilePackages: ["game", "phaser", "centrifuge"]` in `portfolio/next.config.js` (no matching dependency declared in `portfolio/package.json`)

**Content pipeline:**
- unified 11 / remark (`remark-parse`, `remark-gfm`, `remark-rehype`) / rehype (`rehype-slug`, `rehype-highlight`, `rehype-sanitize`, `rehype-external-links`, `rehype-stringify`) - Markdown rendering (`portfolio/lib/markdown.ts`, `portfolio/lib/remark-youtube.ts`)
- `sanitize-html` - newsletter HTML sanitizing (`portfolio/lib/newsletter-html-sanitizer.ts`)

**Forms/Validation:**
- `react-hook-form` 7 + `@hookform/resolvers` 5
- zod 3.25.76 in `portfolio` (a zod 4.6.2 copy exists hoisted at root `node_modules/` from transitive deps)

**Testing:**
- Vitest 5.0.0 (root devDependency) - unit (`vitest.config.ts`) and integration (`vitest.config.integration.ts`), shared aliases in `testing/vitest.shared.ts`, setup in `testing/setupTests.unit.ts`, `testing/setupTests.integration.ts`
- jsdom 26 - opt-in per file via `// @vitest-environment jsdom`
- Playwright 1.63 (`@playwright/test`) - E2E in `portfolio/tests/e2e/`, config `portfolio/playwright.config.ts`
- `bot/smoke_test.py` - Python smoke test for the bot

**Build/Dev:**
- `tsc` - builds each internal package to `dist/` (`packages/*/tsconfig.json`)
- `tsx` 4 - runs the worker directly in production (`worker/Dockerfile`: `CMD ["npx", "tsx", "index.ts"]`) and portfolio scripts (`portfolio/scripts/reindex.ts`, `update-blocklists.ts`)
- ESLint 9 flat config (`eslint.config.mjs`) with `typescript-eslint` 8, `@next/eslint-plugin-next` 16, `eslint-plugin-react`, `eslint-plugin-react-hooks` 7, `eslint-plugin-unused-imports`
- Puppeteer 25 - resume PDF generation (`portfolio/scripts/generate-resume-pdf.mjs`)
- Docker multi-stage builds: `portfolio/Dockerfile` (stages `base`, `deps`, `builder`, `migrator`, `runner`), `worker/Dockerfile`, `search/Dockerfile`, `bot/Dockerfile`, `backup/Dockerfile` (`alpine:3.19`)

## Key Dependencies

**Critical:**
- `@romulo/database` (`packages/database/`) - Prisma client singleton + `settlement.ts`; consumed by portfolio and worker. Must run `prisma generate` before typecheck/build (`npm run build:database`)
- `@romulo/queues` (`packages/queues/`) - BullMQ queue factory, names (`newsletter-transactional`, `newsletter-campaign`, `notifications`, `backups` in `packages/queues/src/constants.ts`), scheduling, job ids
- `@romulo/templates` (`packages/templates/`) - transactional/newsletter email HTML templates with i18n
- `@romulo/web3` (`packages/web3/`) - chain/token config (Arbitrum, Polygon, Base), CoinGecko price lookup, NaCl encryption (`tweetnacl`, `tweetnacl-util`)
- `stripe` 21.0.1 (server) + `@stripe/stripe-js` 9 / `@stripe/react-stripe-js` 6 (client) - card donations
- `viem` 2.x - on-chain donation verification (portfolio + worker)
- `openai` 6.x - post translation (`portfolio/lib/translate.ts`); moderation via raw fetch (`portfolio/lib/moderation/providers/openai.ts`)
- `ioredis` 5.x - rate limiting, caching, BullMQ connection (`portfolio/lib/redis.ts`, `worker/lib/redis.ts`)
- `bcryptjs` - credential password hashing (`portfolio/lib/auth.ts`)

**Infrastructure:**
- `@sentry/nextjs` 10.x / `@sentry/node` 10.x - error tracking (`portfolio/sentry.server.config.ts`, `portfolio/sentry.edge.config.ts`, `portfolio/instrumentation.ts`, `portfolio/instrumentation-client.ts`, `worker/lib/sentry.ts`)
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/lib-storage` - MinIO uploads and S3 backups
- `@aws-sdk/client-ses`, `nodemailer` (overridden to `^10.0.9` at root; `^8.0.5` override in portfolio) - email providers in `worker/lib/email/providers/`
- `@google-analytics/data` 5 - GA4 Data API (`portfolio/lib/ga4.ts`, `worker/lib/ga4.ts`)
- `dockerode`, `systeminformation` - worker container/system metrics (`worker/workers/metrics.worker.ts`)
- `dotenv` - portfolio loads `../.env` in `portfolio/next.config.js`; worker loads `../.env` in `worker/env.ts`

## Configuration

**Environment:**
- Single root `.env` shared by all services (`portfolio/next.config.js` and `worker/env.ts` resolve `../.env`; docker compose uses `env_file: .env`). Files present: `.env`, `.env.production`, `t.env` (contents not read)
- `NEXT_PUBLIC_*` variables are inlined at build time; they are passed as Docker `build.args` in `docker-compose.prod.yml` and as `env` in `.github/workflows/ci.yml`. Keep both lists in sync
- Request-time server vars that must not be prerendered: `SITE_URL`, `ROBOTS_ALLOW_INDEXING` (read by `portfolio/app/robots.ts`, `portfolio/app/sitemap.ts`, both `force-dynamic`; CI asserts this)
- Key required vars: `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `MINIO_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `EMAIL_PROVIDER` (full list in `INTEGRATIONS.md`)

**Build:**
- `portfolio/next.config.js` - standalone output, next-intl plugin, Sentry wrapper (`tunnelRoute: "/monitoring"`, source map upload only when `SENTRY_AUTH_TOKEN` set), image `remotePatterns` (MinIO host, `lh3.googleusercontent.com`, `avatars.githubusercontent.com`), dev `allowedDevOrigins` (Tailscale)
- `portfolio/tsconfig.json` (`strict: true`, `noImplicitAny: false`, `moduleResolution: bundler`, alias `@/*` -> `portfolio/*`, path mappings for `@romulo/*`), `portfolio/tsconfig.build.json` used by Next build
- `packages/*/tsconfig.json`, `worker/tsconfig.json`
- `eslint.config.mjs` (root, lints entire repo)
- `portfolio/tailwind.config.ts`, `portfolio/postcss.config.js`
- `portfolio/vercel.json` - declares a cron to `/api/posts/flush-views` (route does not exist; deployment target is a VPS, views flush runs in `worker/workers/views.worker.ts`)
- Root `package.json` `overrides` pin `next`, `typescript`, `@types/node`, `nodemailer`, `picomatch`, `yaml`, `basic-ftp`, `uuid`

## Platform Requirements

**Development:**
- Node 22 + npm, Docker (Postgres 16, Redis 7, MinIO, mailcatcher via `docker-compose.dev.yml`; nginx variant `docker-compose.dev.nginx.yml`)
- Go 1.22 only if working on `search/` outside Docker
- Build order: `npm run ci:packages` (database generate+build, queues, templates, web3) before `typecheck`/`build:portfolio`
- Full local CI mirror: `npm run ci`

**Production:**
- Self-hosted VPS with Docker Compose (`docker-compose.prod.yml`): `postgres:16-alpine`, `redis:7-alpine`, `minio/minio`, `nginx:alpine`, `certbot/certbot`, `mcuadros/ofelia` (cron), plus app/worker/search/migrator images from GHCR (`ghcr.io/<owner>/romulodm-{app,worker,search,migrator}:<sha>`)
- Cloudflare in front of nginx (`nginx/conf.d/cloudflare-real-ip.inc`)
- Telegram bot deployed separately on Render (`bot/render.yaml`, free plan, Docker runtime)

---

*Stack analysis: 2026-09-25*
