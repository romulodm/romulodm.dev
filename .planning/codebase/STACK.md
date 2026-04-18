# Stack

## Summary

This repository is a TypeScript-first npm workspace monorepo with one extra Go service.
The active roots are `portfolio`, `worker`, `packages/database`, `packages/queues`, `packages/search`, and `search`.

## Languages and runtimes

- TypeScript is the primary language in `portfolio`, `worker`, and `packages/*`.
- JavaScript is still used for framework/runtime config such as `portfolio/next.config.js`.
- Go is used for the standalone search service in `search/main.go`.
- The web app runs on Next.js 16 and React 19 from `portfolio/package.json`.
- The worker runs on Node.js with `tsx` in development and `tsc` output in `worker/package.json`.
- Prisma targets PostgreSQL through `packages/database/prisma/schema.prisma`.

## Workspace and package layout

- Root workspaces are declared in `package.json` as `packages/*`, `portfolio`, and `worker`.
- `portfolio/package.json` is the public site, blog, admin UI, and API surface.
- `worker/package.json` is the BullMQ worker and operational runtime.
- `packages/database/package.json` exports the Prisma client from `packages/database/index.ts`.
- `packages/queues/package.json` exports BullMQ queue contracts from `packages/queues/index.ts`.
- `packages/search/package.json` exports a TypeScript search engine from `packages/search/src/index.ts`.
- `search/go.mod` defines an additional Go search service that is not part of the npm workspaces.

## Frontend and web stack

- `next`, `react`, and `react-dom`
- `next-intl` for locale routing and message loading via `portfolio/i18n/routing.ts` and `portfolio/i18n/request.ts`
- `next-auth` for Google OAuth and credentials auth in `portfolio/lib/auth.ts`
- `next-themes`, `nextjs-toploader`, and `react-scroll-parallax` for app shell behavior in `portfolio/app/[locale]/layout.tsx` and `portfolio/app/providers.tsx`
- `react-hook-form` and `zod` for form and request validation across `portfolio/components/**` and `portfolio/lib/api-validation.ts`
- `@mui/material`, `@emotion/*`, `@radix-ui/*`, `class-variance-authority`, and `tailwind-merge` for UI primitives and styling
- `three`, `@react-three/fiber`, `@react-three/drei`, and `@react-three/rapier` for interactive sections under `portfolio/components/sections/**`

## Backend, data, and async stack

- Prisma client singleton in `packages/database/index.ts`
- Redis via `ioredis` in `portfolio/lib/redis.ts`, `worker/lib/redis.ts`, and `packages/queues/lib/redis.ts`
- BullMQ queues and job policies in `packages/queues/lib/queues.ts`
- Worker bootstrap and scheduling in `worker/index.ts`
- Email delivery abstraction in `worker/lib/email/email.service.ts`
- Search indexing and lookup split across `packages/search/src/**`, `portfolio/lib/search.ts`, `portfolio/lib/search-go.ts`, and `worker/workers/search.worker.ts`

## External services and SDKs

- AWS SDK S3 client for MinIO-compatible uploads in `portfolio/lib/s3.ts`
- Stripe SDK in `portfolio/lib/payments/stripe.ts`
- Abacate Pay HTTP integration in `portfolio/lib/payments/abacate.ts`
- OpenAI moderation REST calls in `portfolio/lib/moderation/providers/openai.ts`
- Google Safe Browsing REST calls in `portfolio/lib/moderation/providers/safe-browsing.ts`
- Umami auth and stats fetches in `worker/lib/telegram.ts`
- SMTP or SES provider selection in `worker/lib/email/email.service.ts`
- Meilisearch comparison support in `portfolio/lib/meilisearch.ts`

## Tooling and developer workflow

- Root orchestration scripts live in `package.json`
- Unit tests run through `vitest.config.ts`
- Integration tests run through `vitest.config.integration.ts`
- Browser tests run through `portfolio/playwright.config.ts`
- Shared Vitest aliases live in `testing/vitest.shared.ts`
- Dockerized environments are defined in `docker-compose.dev.yml`, `docker-compose.dev.nginx.yml`, and `docker-compose.prod.yml`
- GitHub Actions workflows live in `.github/workflows`

## Build and packaging model

- `portfolio/Dockerfile` builds shared packages before the Next.js standalone app
- `worker/Dockerfile` builds the worker runtime
- `packages/search/tsconfig.json` emits declarations and JS into `packages/search/dist`
- `search/Dockerfile` packages the Go search service
- The root lockfile is `package-lock.json`

## Key files

- `package.json`
- `portfolio/package.json`
- `worker/package.json`
- `packages/database/package.json`
- `packages/queues/package.json`
- `packages/search/package.json`
- `portfolio/next.config.js`
- `packages/database/prisma/schema.prisma`
- `packages/queues/lib/queues.ts`
- `search/main.go`
