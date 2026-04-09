# Architecture

**Analysis Date:** 2026-04-08

## Pattern Overview

**Overall:** Full-stack monorepo with a primary Next.js application, shared infrastructure packages, and a separate BullMQ worker service

**Key Characteristics:**
- Monorepo with npm workspaces centered on `portfolio/`, `worker/`, and `packages/*`
- Server-rendered UI and JSON APIs coexist in the same Next.js app under `portfolio/app/`
- Background processing is event-driven through Redis/BullMQ queues
- Legacy Vite frontend remains in-tree as an older standalone frontend implementation

## Layers

**Presentation Layer:**
- Purpose: Render pages, client components, forms, admin screens, and localized routes
- Contains: `portfolio/app/[locale]/`, `portfolio/components/`, `portfolio/hooks/`, `portfolio/messages/`
- Depends on: auth helpers, server routes, shared formatting/util modules
- Used by: end users and admins in the browser

**HTTP/API Layer:**
- Purpose: Accept user/admin requests, validate auth, orchestrate domain operations, and return JSON
- Contains: `portfolio/app/api/**/route.ts`
- Depends on: Prisma, auth/session helpers, moderation, queue producers, payment/storage helpers
- Used by: client components, admin tools, third-party webhook senders

**Domain/Service Layer:**
- Purpose: Encapsulate reusable business logic outside individual route handlers
- Contains: `portfolio/lib/auth.ts`, `portfolio/lib/newsletter/newsletter.service.ts`, `portfolio/lib/moderation/`, `portfolio/lib/payments/`, `portfolio/lib/views.ts`, `portfolio/lib/translate.ts`
- Depends on: Prisma, external SDKs, queue adapters, env config
- Used by: route handlers, server components, and worker jobs

**Data Access Layer:**
- Purpose: Centralize persistence models and shared clients
- Contains: `packages/database/index.ts`, `packages/database/prisma/schema.prisma`, `portfolio/lib/prisma.ts`
- Depends on: Prisma client generation and PostgreSQL
- Used by: app routes, services, and worker jobs

**Async Processing Layer:**
- Purpose: Handle deferred email delivery, notification fan-out, scheduled jobs, and view counter flushing
- Contains: `packages/queues/lib/*.ts`, `portfolio/lib/queues/*.ts`, `worker/index.ts`, `worker/workers/*.ts`
- Depends on: Redis, BullMQ, Prisma, external providers (email, WAHA, Umami)
- Used by: the app when enqueuing work and the worker when consuming jobs

**Infrastructure Layer:**
- Purpose: Provide local/prod execution environment and reverse proxying
- Contains: `docker-compose*.yml`, `nginx/default.conf`, `portfolio/Dockerfile`, `worker/Dockerfile`
- Depends on: Docker images and environment variables
- Used by: local development and container deployments

## Data Flow

**Interactive Web Request:**

1. Browser requests a localized route in `portfolio/app/[locale]/...`
2. `portfolio/middleware.ts` ensures locale-prefixed routing
3. Server components and/or client components fetch from route handlers under `portfolio/app/api/`
4. Route handlers authenticate via `portfolio/lib/auth.ts` or `portfolio/lib/auth-helpers.ts`
5. Business logic uses Prisma through `@romulo/database` and helper modules in `portfolio/lib/`
6. Response returns JSON or rendered HTML back to the browser

**Async Email/Notification Flow:**

1. A route or service enqueues work through `portfolio/lib/queues/email.queue.ts` or `notification.queue.ts`
2. Queue payloads use shared types/constants from `packages/queues/lib/queues.ts`
3. Redis stores jobs and repeatable schedules
4. `worker/index.ts` boots workers and schedule registration
5. Worker handlers in `worker/workers/*.ts` call email/WhatsApp/analytics providers and update Prisma state

**Content/Moderation Flow:**

1. User submits comment or admin submits content
2. API route validates request/auth
3. Moderation pipeline in `portfolio/lib/moderation/index.ts` extracts URLs and runs provider checks sequentially
4. Allowed content is persisted normally; blocked content is diverted into `SuspiciousComment`
5. Notifications are queued only after successful persistence

**State Management:**
- Durable state lives in PostgreSQL via Prisma
- Ephemeral async state lives in Redis/BullMQ
- Some request throttling is currently process-local in-memory (`portfolio/app/api/comments/route.ts`)
- Browser state is mostly handled through React state/client components rather than a global state library

## Key Abstractions

**Route Handler Modules:**
- Purpose: API boundary objects for each domain capability
- Examples: `portfolio/app/api/comments/route.ts`, `portfolio/app/api/posts/route.ts`, `portfolio/app/api/donations/stripe/create-intent/route.ts`
- Pattern: Next.js App Router `GET`/`POST`/`PATCH`/`DELETE` exports

**Service Modules:**
- Purpose: Reusable domain logic outside handlers
- Examples: `portfolio/lib/newsletter/newsletter.service.ts`, `portfolio/lib/moderation/index.ts`, `portfolio/lib/s3.ts`
- Pattern: named function exports with env-backed singleton helpers

**Shared Packages:**
- Purpose: Cross-service contracts and clients
- Examples: `@romulo/database`, `@romulo/queues`
- Pattern: workspace packages exposing small public APIs from `index.ts`

**Worker Jobs:**
- Purpose: Deferred side effects and scheduled processing
- Examples: transactional email jobs, campaign email jobs, WhatsApp notifications, view flush jobs
- Pattern: BullMQ workers created once per queue with typed payloads

## Entry Points

**Primary Web App:**
- Location: `portfolio/app/layout.tsx`, `portfolio/app/page.tsx`, and localized routes under `portfolio/app/[locale]/`
- Triggers: HTTP requests to the Next.js app
- Responsibilities: render pages, serve APIs, host auth/webhook endpoints

**App Middleware:**
- Location: `portfolio/middleware.ts`
- Triggers: non-static/non-API incoming requests
- Responsibilities: locale routing enforcement

**Worker Service:**
- Location: `worker/index.ts`
- Triggers: container/process startup
- Responsibilities: verify email provider, register cron-like repeatable jobs, attach worker listeners, handle graceful shutdown

**Legacy Frontend:**
- Location: `frontend/src/main.jsx`
- Triggers: Vite dev/build workflow
- Responsibilities: standalone older portfolio/blog UI

## Error Handling

**Strategy:** Boundary-level handling with lots of local `try/catch` blocks in route handlers and worker functions, plus console logging

**Patterns:**
- API routes usually return `NextResponse.json({ error }, { status })` on validation/auth failures
- Worker handlers throw to let BullMQ retries/backoff handle transient failures
- No shared error abstraction or structured error class hierarchy was found

## Cross-Cutting Concerns

**Logging:**
- `console.log`, `console.warn`, and `console.error` are used across both app and worker code
- Worker startup and queue processing are especially log-heavy

**Validation:**
- Mostly manual input validation in route handlers
- `react-hook-form` and schema files exist on the client side, but server validation is inconsistent

**Authentication:**
- NextAuth with JWT sessions protects user routes
- Admin checks are helper-based (`requireAdmin`, `isAdminAuthenticated`)

**Internationalization:**
- `next-intl` drives locale routing and messages in `portfolio/`
- The legacy `frontend/` uses `i18next`

---
*Architecture analysis: 2026-04-08*
*Update when major patterns change*
