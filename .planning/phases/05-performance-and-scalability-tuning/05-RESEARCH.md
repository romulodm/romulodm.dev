# Phase 5 Research: Performance And Scalability Tuning

**Phase:** 5 - Performance And Scalability Tuning
**Date:** 2026-04-10
**Status:** Ready for planning

## Research Objective

Identify the highest-value, lowest-risk performance and scalability improvements that can be applied to the active production surfaces without changing the architecture. The phase must make public portfolio delivery more intentional, tighten obvious Prisma hotspots, and tune queue throughput conservatively around the worker reliability baseline established in Phase 4.

## Repo-Specific Starting Point

- `portfolio/next.config.js` already uses standalone output, but the app still relies heavily on incidental framework behavior for caching and rendering strategy.
- Public read-heavy routes exist in the blog list page, blog post page, and `app/api/posts/public/route.ts`, but they do not currently make caching intent explicit.
- `portfolio/app/[locale]/blog/[slug]/page.tsx` does substantial work per request: post lookup with relations, metadata generation with a second query, markdown rendering, comment loading, related-post lookup, and client-side view tracking.
- Prisma already has a meaningful index baseline in `packages/database/prisma/schema.prisma`, which means the likely wins are on targeted query/index alignment rather than greenfield database design.
- The donation ranking API and admin donation dashboard both perform repeated donation queries that are good candidates for narrow index review.
- Newsletter dispatch performs a full confirmed-subscriber read plus recipient upsert/refetch flow in `portfolio/lib/newsletter/newsletter.service.ts`, which is a worker-adjacent query hotspot rather than a general request-path concern.
- Queue defaults and per-queue policies are now explicit after Phase 4, with transactional/campaign/notification jobs separated enough that throughput tuning can be conservative and queue-specific instead of global.

## Key Research Findings

### 1. The public portfolio/blog surface is the clearest caching target

The portfolio front door is the system's highest-priority uptime surface, and the blog list/detail routes are read-heavy content paths. Right now they fetch from Prisma directly and do not make rendering or revalidation intent explicit. The work here is not to add broad caching everywhere, but to make the public content routes deliberate and stable while leaving admin/auth flows dynamic.

Planning implication:
- focus Phase 5 caching work on public blog/listing and content APIs first
- explicitly separate cacheable public reads from admin/auth/mutation routes
- use the existing App Router patterns rather than introducing a new delivery layer

### 2. `dynamicParams` and route behavior should be reviewed as part of build strategy, not just warning cleanup

The existing `portfolio/next.config.js` still carries the pre-existing `dynamicParams` warning noted in prior phases. The warning is small on its own, but it is a signal that route-level rendering and static behavior are not fully intentional yet.

Planning implication:
- include Next.js rendering/caching review as part of the build strategy work
- tie any config cleanup to actual route behavior, not cosmetic warning removal alone

### 3. The most obvious Prisma hotspots are public listing/sorting paths and donation/newsletter reads

The public posts API supports multiple sort modes including likes/views ordering, while current schema indexes emphasize `status` + `publishedAt`. Donation routes query by combinations such as `status`, `isPrivate`, `currency`, `amount`, and `createdAt`, but the current indexes only partially align with those access patterns. Newsletter dispatch reads all confirmed subscribers and then refetches pending recipients, which is acceptable functionally but worth reviewing for scale.

Planning implication:
- prioritize `posts/public`, blog page loaders, donation ranking/dashboard queries, and newsletter dispatch/recipient flows
- consider both query shape and schema index alignment
- avoid broad ORM rewrites outside these obvious high-value paths

### 4. Blog post delivery likely needs query consolidation more than exotic infrastructure

`app/[locale]/blog/[slug]/page.tsx` performs separate queries for the main post, metadata, and related posts, and then does markdown conversion and comment loading in parallel. There may be room to reduce repeated database work or make static/revalidated segments do more of the heavy lifting before reaching for heavier caching complexity.

Planning implication:
- measure and tighten duplicated query work on the blog detail page
- keep improvements local to route/module boundaries already present
- preserve correctness for locale-aware content and comments

### 5. Queue tuning should remain conservative because throughput is provider-bound, not just CPU-bound

The critical queue consumers are external-side-effect-heavy: email delivery is bounded by provider capacity and notification flows depend on external dispatch. Campaign email is already rate-limited in worker code. Views flushing is buffered and low-frequency by design. The safest tuning approach is to make throughput settings intentional and possibly env-driven, not simply increase concurrency.

Planning implication:
- review concurrency and limiter settings on campaign, transactional, notification, and flush flows
- prefer conservative, explicit tuning over aggressive parallelism
- keep Phase 4 health signaling as the safety net for any throughput changes

### 6. The worker reliability baseline from Phase 4 changes how queue tuning should be validated

Since queue settings are now tied to explicit retry behavior, health snapshots, and integration coverage, Phase 5 can tune throughput more safely than earlier phases, but it also needs to preserve those guarantees. Any queue setting change should still leave the worker diagnosable and not reopen silent-failure risk.

Planning implication:
- include worker integration/build checks in Phase 5 validation where queue settings change
- keep throughput tuning aligned with reliability, not separate from it

### 7. The best Phase 5 shape still matches the roadmap's three-plan breakdown

The codebase naturally clusters into three execution buckets:
- public Next.js caching/build strategy
- Prisma hotspot review and targeted index/query improvements
- queue throughput tuning under the Phase 4 reliability baseline

Planning implication:
- use the roadmap's existing 05-01 / 05-02 / 05-03 structure
- keep each plan scoped enough to verify independently

## Recommended Plan Shape

### Plan 05-01: Public portfolio build and caching strategy

Focus:
- review and tighten Next.js rendering/caching behavior on public blog/content paths
- make public reads intentionally cacheable or revalidated where safe
- keep admin/auth and mutation surfaces explicitly dynamic

### Plan 05-02: Prisma hotspot review and targeted database tuning

Focus:
- measure and improve the highest-value public/admin/worker query paths
- align indexes with real query filters/sorts where clearly justified
- reduce duplicated or obviously wasteful query work without broad rewrites

### Plan 05-03: Conservative queue throughput tuning

Focus:
- review concurrency, limiter, retry/load, and flush cadence settings on critical queues
- make settings more intentional and production-aware
- preserve the Phase 4 reliability/health baseline

## Validation Architecture

Phase 5 validation should combine build checks, targeted integration verification, and artifact review.

- `npm run build:portfolio` should remain the primary build-level verification for public delivery changes
- `npm run test:integration` should verify Prisma and queue-related behavior where touched
- `npm run build:worker` should remain part of validation when queue throughput settings change

## Sources

### Local Context
- `.planning/phases/05-performance-and-scalability-tuning/05-CONTEXT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `portfolio/next.config.js`
- `portfolio/app/[locale]/blog/page.tsx`
- `portfolio/app/[locale]/blog/[slug]/page.tsx`
- `portfolio/app/[locale]/admin/page.tsx`
- `portfolio/app/api/posts/public/route.ts`
- `portfolio/app/api/donations/ranking/route.ts`
- `portfolio/lib/views.ts`
- `portfolio/lib/newsletter/newsletter.service.ts`
- `packages/database/prisma/schema.prisma`
- `packages/queues/lib/queues.ts`
- `worker/workers/email.worker.ts`
- `worker/workers/notification.worker.ts`
- `worker/workers/views.worker.ts`

---

## RESEARCH COMPLETE
