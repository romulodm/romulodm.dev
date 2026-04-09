# Technology Stack

**Analysis Date:** 2026-04-08

## Languages

**Primary:**
- TypeScript 5.x - Main application code in `portfolio/`, `worker/`, and `packages/`
- TSX/React - UI code in `portfolio/components/`, `portfolio/app/`, and the legacy `frontend/src/`

**Secondary:**
- JavaScript - Next/Vite config files such as `portfolio/next.config.js`, `frontend/vite.config.js`, and Docker helper scripts
- SQL (via Prisma migrations) - Schema evolution in `packages/database/prisma/migrations/`
- YAML - Container orchestration in `docker-compose.yml` and `docker-compose.dev.yml`

## Runtime

**Environment:**
- Node.js 20.x style toolchain - implied by `next@14`, modern AWS SDK packages, Prisma 5, and TypeScript configs
- Browser runtime - Next.js App Router pages under `portfolio/app/` and the separate Vite React app under `frontend/`
- Dockerized local services - PostgreSQL, Redis, MinIO, Umami, WAHA, and the app/worker containers from the compose files

**Package Manager:**
- npm workspaces - root `package.json` declares `packages/*`, `portfolio`, and `worker`
- Lockfiles: root `package-lock.json` plus per-package lockfiles in `frontend/`, `portfolio/`, and `worker/`

## Frameworks

**Core:**
- Next.js 14.2 (`portfolio/package.json`) - Primary full-stack web app using App Router and route handlers
- React 18 - UI layer for both `portfolio` and the legacy `frontend`
- NextAuth 4 - Authentication in `portfolio/lib/auth.ts` and `portfolio/app/api/auth/[...nextauth]/`
- Prisma 5 - ORM/data access through `packages/database/`
- BullMQ 5 + ioredis 5 - Queueing and worker orchestration in `packages/queues/`, `portfolio/lib/queues/`, and `worker/workers/`
- Vite 4 - Bundler for the older `frontend/` app

**Testing:**
- No first-party test runner is configured in checked-in manifests
- Puppeteer is present as a dev dependency in `portfolio/package.json`, but there are no committed browser tests or runner config files

**Build/Dev:**
- TypeScript compiler - builds `worker/` and both shared packages
- tsx - local worker/dev scripts and maintenance scripts
- Tailwind CSS - styling in both `portfolio/` and `frontend/`
- ESLint - configured in `frontend/.eslintrc.cjs`; `portfolio` uses `next lint` via the Next.js toolchain

## Key Dependencies

**Critical:**
- `next` - Full-stack React runtime and server route handling in `portfolio/`
- `@romulo/database` - Shared Prisma client consumed by the app and worker
- `@romulo/queues` - Shared Redis/BullMQ queue primitives used across app and worker
- `next-auth` - Credentials and Google OAuth auth flows
- `openai` - AI-powered moderation/translation features in `portfolio/lib/moderation/` and `portfolio/lib/translate.ts`
- `stripe` and `@stripe/react-stripe-js` - Card donation flow
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` - MinIO/S3-compatible upload flow

**Infrastructure:**
- `ioredis` - Redis connectivity for queues and counters
- `bullmq` - Background jobs for email, notifications, and views flushing
- `nodemailer` and `@aws-sdk/client-ses` - SMTP/SES email delivery in `worker/lib/email/`
- `bcryptjs` - Password hashing for credentials auth
- `next-intl` - Locale-aware routing and content handling

## Configuration

**Environment:**
- Environment variables drive nearly everything; `.env` files exist at the repo root and inside apps/packages
- Critical variables include `DATABASE_URL`, Redis connection info, NextAuth secrets, Google OAuth creds, Stripe secrets, MinIO/S3 settings, WAHA credentials, Umami creds, and email provider settings
- `portfolio/next.config.js` loads the parent `.env` explicitly and configures remote image hosts from env values

**Build:**
- Root workspace manifest: `package.json`
- App configs: `portfolio/tsconfig.json`, `portfolio/next.config.js`, `portfolio/tailwind.config.ts`
- Worker/shared package configs: `worker/tsconfig.json`, `packages/database/tsconfig.json`, `packages/queues/tsconfig.json`
- Infra configs: `docker-compose.yml`, `docker-compose.dev.yml`, `nginx/default.conf`

## Platform Requirements

**Development:**
- Windows/macOS/Linux should all work if Node/npm and Docker are available
- Docker is effectively part of local development for Postgres, Redis, MinIO, Umami, WAHA, and Mailcatcher
- Prisma schema generation and migrations depend on PostgreSQL availability

**Production:**
- `portfolio/` is configured for standalone Next.js output in Docker
- `worker/` is a separate long-running Node process/container
- Reverse proxy assumptions live in `nginx/default.conf`
- External service credentials are required for production-grade features (Stripe, Google OAuth, OpenAI, Safe Browsing, email delivery, Umami, WAHA, MinIO)

---
*Stack analysis: 2026-04-08*
*Update after major dependency changes*
