# Phase 2 Research: API And Auth Hardening

**Phase:** 2 - API And Auth Hardening
**Date:** 2026-04-09
**Status:** Ready for planning

## Research Objective

Determine the safest incremental way to harden the Next.js app's public and admin API boundaries so Phase 2 can deliver consistent validation, authorization, production-safe rate limiting, and non-leaky error handling without redesigning authentication.

## Repo-Specific Starting Point

- `portfolio/lib/auth.ts` already holds the canonical NextAuth configuration and a usable `requireAdmin` helper, but many routes do not use it consistently.
- `portfolio/lib/auth-helpers.ts` duplicates part of the auth boundary with a weaker boolean-only `isAdminAuthenticated()` helper.
- Admin API routes currently mix three patterns: `requireAdmin`, `isAdminAuthenticated`, and direct `getServerSession` plus database re-checks.
- Public mutation routes under `portfolio/app/api/comments/**` still use in-memory `Map` rate limiters, which are not production-safe across instances.
- `portfolio/lib/rate-limit.ts` already provides a Redis-backed limiter, so Phase 2 can harden abuse controls without inventing new infrastructure.
- Validation is inconsistent: `portfolio/app/api/auth/forgot-password/route.ts` already uses `zod`, while routes like `comments` and newsletter admin handlers still parse and validate bodies manually.
- The repo contains a custom `portfolio/app/api/auth/login/route.ts` that signs JWTs directly with `NEXTAUTH_SECRET`, which means the auth surface is broader than NextAuth alone and must be hardened carefully.
- `portfolio/middleware.ts` currently handles locale routing only, so any auth-related middleware added in Phase 2 starts from a minimal baseline.

## Key Research Findings

### 1. Shared route guards should be the primary security boundary

The current admin/auth protection is inconsistent enough that Phase 2 should standardize on one server-side guard pattern for route handlers. The existing `requireAdmin()` helper in `portfolio/lib/auth.ts` is a better consolidation point than the boolean-only helper in `auth-helpers.ts`, because it already returns status-aware auth results.

Planning implication:
- centralize route-level admin protection around a shared helper in `portfolio/lib/auth.ts` or an adjacent auth boundary module
- migrate boolean-only and ad hoc session-plus-db checks toward the same shared contract
- keep API authorization explicit inside route handlers, even if middleware later improves admin-page UX

### 2. Middleware should stay complementary, not authoritative

Because `portfolio/middleware.ts` is currently focused on i18n and the user explicitly chose server-first enforcement, Phase 2 should not depend on middleware as the only protection layer. Middleware can still help by gating admin page trees early or redirecting unauthenticated users, but the real authorization decisions must remain inside server handlers.

Planning implication:
- page gating belongs in a separate plan slice from API guard consolidation
- middleware additions should be narrow and reversible, not a redesign of request flow

### 3. Validation should move toward shared schemas at API boundaries

The repo already demonstrates a good direction in `forgot-password/route.ts`: parse once at the boundary, return predictable validation failures, and keep handler logic simpler after parsing. Other routes, especially `comments` and newsletter admin handlers, still mix JSON parsing, coercion, trimming, and branching inline.

Planning implication:
- introduce a shared validation/sanitization pattern first, then migrate high-risk routes to it
- prioritize routes with user-controlled bodies or HTML/content entry, not every API in the repo at once
- use `zod` or the existing boundary style already proven in the app rather than inventing a parallel validation system

### 4. Sanitization needs to be separated from validation

The codebase already has an example of input sanitization in `portfolio/lib/s3.ts`, where filenames are normalized separately from being accepted. That is a useful model: Phase 2 should not treat "string exists" as equivalent to "string is safe to use." Content-heavy routes like newsletter campaign creation and comment submission need consistent rules for trimming, size limits, and sanitization of risky fields.

Planning implication:
- plans should distinguish schema validation from normalization/sanitization helpers
- centralize sanitization for repeated risky input categories where possible

### 5. Production-safe rate limiting should reuse the existing Redis helper

There is already a shared Redis-backed limiter in `portfolio/lib/rate-limit.ts`, but comments and votes still rely on process-local memory. That means the repo already contains the safer building block; the main Phase 2 work is selecting which routes adopt it first and standardizing how keys/windows/limits are expressed.

Planning implication:
- prioritize exposed mutation endpoints first: comments, votes, auth/login-like surfaces, and other public writes
- use explicit per-route keys and thresholds instead of one global policy
- plan for a fail-open/fail-closed discussion in implementation, since the current Redis limiter fails open if Redis is unavailable

### 6. Error handling currently leaks too much implementation detail through inconsistency

The codebase is inconsistent rather than uniformly insecure. Some routes already use generic safe messages (`forgot-password`), while others expose detailed validation strings, authorization distinctions, or route-specific internals. The main hardening need is a consistent public error contract with logging preserved for diagnosis.

Planning implication:
- standardize response shape and public-detail policy on high-risk routes
- keep internal logging for operators, but do not leak stack traces, auth internals, or sensitive branching reasons in public responses
- avoid a giant repo-wide exception framework; Phase 2 should stay incremental and route-boundary focused

### 7. The custom login route should be treated as a compatibility liability

`portfolio/app/api/auth/login/route.ts` issues a JWT directly using `NEXTAUTH_SECRET`, returns role-bearing claims, and appears intended for Postman or non-browser use. Since the user explicitly does not want auth redesign in this phase, the correct posture is to audit and harden this route as a compatibility surface, not to delete or replace it wholesale.

Planning implication:
- review whether this route needs stronger validation, rate limiting, safer errors, and clearer intended use
- keep NextAuth canonical in plans and documentation
- do not let this route drive a broader auth rewrite in Phase 2

## Recommended Plan Shape

The roadmap's three planned slices still fit the repo well, but research suggests the cleanest execution order is:

### Plan 02-01: Shared validation and sanitization boundary

Focus:
- introduce shared request parsing/validation patterns
- migrate highest-risk admin/public routes away from manual body parsing
- centralize repeated normalization and sanitization helpers where the same risky fields recur

Key outcome:
- API boundaries stop duplicating parsing and fragile inline validation logic

### Plan 02-02: Shared auth/authz enforcement

Focus:
- standardize admin/protected route guards around one shared server-side helper
- reduce or remove `isAdminAuthenticated` and ad hoc session-plus-db admin checks
- optionally add narrow middleware gating for admin pages without making middleware the security boundary
- audit the compatibility login route and document/harden its intended use

Key outcome:
- protected/admin authorization behaves consistently across route handlers and auth surfaces

### Plan 02-03: Abuse controls and safe error responses

Focus:
- replace in-memory rate limiting on exposed mutation routes with the shared Redis-backed limiter
- normalize rate-limit behavior and keys per route
- standardize public-safe error responses and logging boundaries on high-risk endpoints

Key outcome:
- exposed mutation routes are safer under public traffic and operationally diagnosable without leaking internals

## Planning Constraints And Tradeoffs

### Keep the auth boundary incremental

Phase 2 should not rewrite NextAuth, replace session strategy, or unify every auth surface under a new design. The goal is to harden what exists and clarify the boundary.

### Prefer convergence over abstraction for its own sake

The repo already has working route patterns. Plans should converge them onto shared helpers and schemas instead of introducing a large new framework layer that would increase migration risk.

### Separate route-hardening work from test expansion

Phase 2 can and should add verification commands in plans, but deep automated coverage belongs to Phase 3. Planning should keep execution slices focused on security behavior, not on building the full test matrix early.

### Be selective about route coverage

Not every route needs to be migrated at once. The highest-value targets are:
- admin mutation routes
- public write endpoints
- auth-related endpoints
- any route returning sensitive distinctions between unauthenticated, unauthorized, and internal failure states

### Respect the single-operator operating model

Safer public errors should not come at the cost of silent failures. Plans should preserve or improve useful internal logging, especially in auth and abuse-control paths.

## Validation Architecture

Phase 2 validation should combine targeted command checks, route-focused regression checks, and artifact verification of the standardized boundary helpers.

### Artifact-level validation

- Verify a shared auth/authz helper exists and is referenced by targeted protected/admin route handlers
- Verify high-risk routes use schema-based validation or a shared boundary helper instead of only manual parsing
- Verify exposed mutation routes no longer rely on process-local `Map` rate limiting where Phase 2 migrates them
- Verify compatibility auth surfaces document or enforce their hardened boundary

### Command-level validation

- lint/typecheck/build commands for the edited app surface still pass through the existing root CI contract
- targeted smoke verification of hardened routes should cover auth failure, validation failure, and success-path behavior where practical
- grep-verifiable checks should confirm removal of known duplicated auth patterns from the targeted routes

### Security-behavior validation

- unauthenticated requests return safe 401-style responses without leaking internals
- unauthorized requests return safe 403-style responses where applicable
- validation failures return bounded public detail
- operator logs retain enough context to diagnose failures without exposing secrets or credential data

## Risks To Watch During Planning

- over-scoping route migration so the phase becomes an auth redesign
- introducing middleware-based auth assumptions that bypass server-side checks
- replacing route-local in-memory limiters without defining stable Redis keys and thresholds
- collapsing all validation and sanitization into one utility that becomes too abstract to apply safely
- "fixing" the custom login route by removing it without understanding whether the operator still depends on it for non-browser/admin workflows
- making public errors too generic to support a single operator diagnosing production issues

## Sources

### Local Context
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `portfolio/lib/auth.ts`
- `portfolio/lib/auth-helpers.ts`
- `portfolio/middleware.ts`
- `portfolio/lib/rate-limit.ts`
- `portfolio/app/api/auth/login/route.ts`
- `portfolio/app/api/auth/forgot-password/route.ts`
- `portfolio/app/api/comments/route.ts`
- `portfolio/app/api/admin/newsletter/campaigns/route.ts`
- `portfolio/app/api/admin/suspicious-comments/route.ts`
- `portfolio/app/api/admin/resync/route.ts`

---

## RESEARCH COMPLETE
