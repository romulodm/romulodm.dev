# Phase 2: API And Auth Hardening - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the public and admin-facing server boundaries in the existing Next.js app. It covers consistent server-side validation and sanitization patterns, shared authorization enforcement for protected/admin routes, safer handling of exposed mutation endpoints, and error responses that do not leak sensitive internals. It does not redesign the application architecture or replace the existing authentication system.

</domain>

<decisions>
## Implementation Decisions

### Auth Enforcement Pattern
- **D-01:** Standardize on a shared server-side auth/authorization guard for protected and admin route handlers instead of keeping the current mix of `requireAdmin`, `isAdminAuthenticated`, and ad hoc `getServerSession` checks.
- **D-02:** Middleware may be used to improve admin page gating and UX, but it is not the primary security boundary for APIs. Route handlers must remain secure on their own.

### Auth Flow Boundary
- **D-03:** Treat NextAuth as the canonical authentication system for the application in this phase.
- **D-04:** Keep the custom `/api/auth/login` JWT route as a compatibility surface to audit and harden rather than redesigning or removing auth flows during Phase 2.

### the agent's Discretion
- The planner can decide whether the shared auth guard lives in `portfolio/lib/auth.ts` or a nearby auth-specific helper module as long as route handlers converge on one consistent pattern.
- The planner can decide how much middleware-based admin page gating to add in Phase 2 so long as it complements, rather than replaces, server-side route protection.
- The planner can decide whether the custom login route should be restricted, documented, deprecated, or wrapped with stronger validation as part of hardening, as long as NextAuth remains the source of truth.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - project goal, non-negotiables, and hardening constraints
- `.planning/REQUIREMENTS.md` - Phase 2 requirement set (`SEC-01`..`SEC-04`)
- `.planning/ROADMAP.md` - Phase 2 goal, success criteria, and plan breakdown
- `.planning/STATE.md` - current project position and active focus

### Prior Phase Decisions
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md` - Phase 1 repo-safety and governance decisions that Phase 2 builds on

### Auth And Route Surfaces
- `portfolio/lib/auth.ts` - canonical NextAuth configuration plus the existing `requireAdmin` helper
- `portfolio/lib/auth-helpers.ts` - alternate auth helper pattern currently in use and a consolidation target
- `portfolio/middleware.ts` - current middleware boundary and the starting point for any page-level auth gating
- `portfolio/app/api/auth/[...nextauth]/route.ts` - NextAuth route surface
- `portfolio/app/api/auth/login/route.ts` - custom compatibility login route that must be audited and hardened without becoming a redesign

### Admin API Examples
- `portfolio/app/api/admin/resync/route.ts` - current admin route using shared `requireAdmin`
- `portfolio/app/api/admin/newsletter/campaigns/route.ts` - current admin route using `isAdminAuthenticated`
- `portfolio/app/api/admin/newsletter/campaigns/[id]/route.ts` - duplicated admin auth pattern in a high-value admin surface
- `portfolio/app/api/admin/suspicious-comments/route.ts` - ad hoc session-plus-db admin check example
- `portfolio/app/api/admin/users/[id]/ban/route.ts` - another ad hoc admin authorization example

### Public Mutation And Validation Examples
- `portfolio/app/api/comments/route.ts` - public mutation route with manual body parsing, validation, and in-memory rate limiting
- `portfolio/app/api/comments/[id]/route.ts` - authenticated mutation route with owner/admin authorization behavior
- `portfolio/app/api/comments/[id]/vote/route.ts` - public/authenticated mutation route with in-memory rate limiting
- `portfolio/lib/rate-limit.ts` - shared Redis-backed limiter already available for production-oriented rate limiting
- `portfolio/app/api/auth/forgot-password/route.ts` - existing `zod` validation example to build on
- `portfolio/lib/s3.ts` - existing sanitization and upload validation example

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/lib/auth.ts`: already contains `authOptions` and a `requireAdmin` helper, making it the natural consolidation point for shared route guards.
- `portfolio/lib/rate-limit.ts`: provides a Redis-backed rate limiter that can replace route-local in-memory maps on exposed mutation endpoints.
- `portfolio/app/api/auth/forgot-password/route.ts`: shows that `zod` is already in use and can seed a more consistent boundary-validation approach.
- `portfolio/lib/s3.ts`: demonstrates an existing sanitization pattern for unsafe user-controlled input like filenames.

### Established Patterns
- Route handlers currently mix manual JSON parsing, inline guard clauses, and scattered auth checks instead of using one shared validation/auth boundary.
- Admin authorization is inconsistent across the codebase: some routes use `requireAdmin`, some use `isAdminAuthenticated`, and some re-query the database inline after fetching a session.
- Middleware currently handles locale routing only and does not enforce auth, so any auth-related middleware added in this phase should remain incremental and narrowly scoped.
- Public mutation endpoints such as comments and voting still use process-local `Map` rate limiters, which are not production-safe across instances.

### Integration Points
- Shared auth hardening will primarily connect through `portfolio/lib/auth.ts`, route handlers under `portfolio/app/api/admin/**`, and protected mutation routes under `portfolio/app/api/**`.
- Any middleware-based page gating will connect through `portfolio/middleware.ts` and the admin page tree under `portfolio/app/[locale]/admin/**`.
- Validation and sanitization patterns will need to fit the existing route-handler structure in `portfolio/app/api/**` without forcing an architectural rewrite.

</code_context>

<specifics>
## Specific Ideas

- The API security boundary should stay server-first: page middleware can improve UX, but route handlers must remain the real enforcement layer.
- The current dual auth surface should be clarified, not reinvented: NextAuth is the canonical system and the custom login route is a hardening target.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 02-api-and-auth-hardening*
*Context gathered: 2026-04-09*
