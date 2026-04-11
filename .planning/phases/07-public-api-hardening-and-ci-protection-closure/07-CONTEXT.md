# Phase 7: Public API Hardening And CI Protection Closure - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the final milestone blockers for `v1.0` by hardening the remaining live public mutation routes and making the critical automated test baseline enforceable in pull requests. The work should preserve the current architecture, finish the shared API-boundary pattern introduced in Phase 2, and wire the already-existing test stack into PR validation so regressions are caught before merge.

</domain>

<decisions>
## Implementation Decisions

### Shared Hardening Boundary
- **D-01:** The remaining PIX, Stripe, and newsletter public mutation routes should be migrated onto the same shared validation, sanitization, rate-limit, and safe-error helpers introduced in Phase 2.
- **D-02:** Phase 7 should finish the original shared API-boundary architecture rather than rely on route-local ad hoc patches for the remaining live public mutation surfaces.

### Donation Route Strictness
- **D-03:** Both donation create routes (`PIX` and `Stripe`) should be treated as equally high-risk public mutation surfaces and fully hardened in this phase.
- **D-04:** Public donation create routes must get validation, abuse controls, and safe provider-failure handling even if their downstream payment providers also perform their own validation.

### Newsletter Subscribe Alignment
- **D-05:** The newsletter subscribe route should preserve anti-enumeration behavior and user-safe messaging.
- **D-06:** The newsletter route should still be migrated onto the shared validation/rate-limit/error contract so it stops being a route-local special case.

### PR Test Enforcement Scope
- **D-07:** PR validation should run the critical root test baseline for affected changes, not only build/lint checks.
- **D-08:** Existing root scripts should remain the source of truth for CI enforcement rather than creating a second parallel test orchestration path just for GitHub Actions.

### CI Scoping Strategy
- **D-09:** CI enforcement should stay scoped by changed app/package/root impact instead of turning every PR into a full monorepo test matrix.
- **D-10:** Root-level or shared-package changes may legitimately fan out to broader validation, but routine surface-specific changes should keep targeted enforcement where possible.

### the agent's Discretion
- The planner can choose the exact schemas, helper boundaries, and route refactors as long as the remaining live public mutation routes end up on the same shared boundary contract as the rest of the hardened API surface.
- The planner can choose the exact PR workflow structure and job fan-out as long as critical tests actively protect merges and remain aligned with the existing root scripts.
- The planner can decide whether donation and newsletter route tests live in existing integration files or new targeted files, provided the coverage becomes explicit and maintainable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - production-hardening goal and release baseline
- `.planning/REQUIREMENTS.md` - Phase 7 requirement set (`SEC-01`, `SEC-03`, `SEC-04`, `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04`)
- `.planning/ROADMAP.md` - Phase 7 goal, success criteria, and dependency on completed Phases 1 through 6
- `.planning/STATE.md` - current milestone position with Phase 6 complete
- `.planning/v1.0-MILESTONE-AUDIT.md` - exact evidence for the remaining public API and PR-protection blockers

### Prior Phase Decisions
- `.planning/phases/02-api-and-auth-hardening/02-CONTEXT.md` - shared validation/auth/rate-limit/error decisions that Phase 7 must finish applying
- `.planning/phases/02-api-and-auth-hardening/02-VERIFICATION.md` - current Phase 2 implementation boundary and what was already hardened
- `.planning/phases/03-test-foundation-and-critical-coverage/03-CONTEXT.md` - active test-stack and scope decisions
- `.planning/phases/03-test-foundation-and-critical-coverage/03-VERIFICATION.md` - current root test baseline and residual warnings
- `.planning/phases/06-view-tracking-and-worker-flow-closure/06-VERIFICATION.md` - latest milestone gap closure and current verification baseline after Phase 6

### Shared API Hardening Surfaces
- `portfolio/lib/api-validation.ts` - shared body parsing, normalization, and validation helpers
- `portfolio/lib/api-errors.ts` - shared safe-response and logging helpers
- `portfolio/lib/rate-limit.ts` - existing abuse-control primitives
- `portfolio/lib/auth.ts` - shared protected-route guard patterns from Phase 2

### Remaining Live Public Mutation Routes
- `portfolio/app/api/donations/pix/create/route.ts` - live PIX donation create route still using ad hoc body handling
- `portfolio/app/api/donations/stripe/create-intent/route.ts` - live Stripe intent route still outside the shared boundary contract
- `portfolio/app/api/newsletter/subscribe/route.ts` - newsletter subscribe route with partial protections but route-local implementation
- `portfolio/lib/payments/abacate.ts` - PIX provider integration boundary
- `portfolio/lib/payments/stripe.ts` - Stripe provider boundary
- `portfolio/lib/newsletter/newsletter.service.ts` - newsletter domain logic used by the public subscribe route

### Test And CI Enforcement Surfaces
- `package.json` - root test and CI entrypoints that should stay canonical
- `.github/workflows/pr.yml` - current PR validation workflow that still lacks critical test enforcement
- `vitest.config.integration.ts` - root integration test matrix
- `portfolio/playwright.config.ts` - existing E2E runner setup already established in Phase 3

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/lib/api-validation.ts` already provides shared parsing, sanitization, and error-shaping helpers that the remaining live routes have not yet adopted.
- `portfolio/lib/api-errors.ts` already centralizes safe public error responses and logging boundaries for the Phase 2-hardened routes.
- The root `package.json` already exposes `test:unit`, `test:integration`, `test:e2e`, and `test:phase3`, so CI enforcement can build on established commands rather than inventing new ones.

### Established Patterns
- The hardened Phase 2 routes already show the intended shared-boundary style: parse request through helpers, apply shared rate limiting, and return structured safe errors.
- The remaining donation and newsletter routes are still reachable from live public UI surfaces and remain the exception to that pattern.
- The current PR workflow already uses change-scoped jobs, so the likely win is expanding those jobs with test enforcement rather than redesigning CI from scratch.

### Integration Points
- Public donation UI -> PIX and Stripe create routes -> provider SDKs and pending donation records
- Newsletter subscribe UI -> public subscribe route -> newsletter service
- Root test scripts -> GitHub PR workflow jobs -> merge protection behavior

</code_context>

<specifics>
## Specific Ideas

- Phase 7 should make the remaining live public mutation routes look and behave like the Phase 2-hardened routes rather than leaving “special” public endpoints behind.
- CI should stop treating tests as optional post-facto confidence and instead make the critical baseline part of merge protection.
- The end result should remove the last audit evidence that keeps `v1.0` from being archive-ready: no remaining ad hoc public mutation boundaries and no unprotected critical test baseline.

</specifics>

<deferred>
## Deferred Ideas

- Full repo-wide CI expansion beyond the critical baseline remains out of scope; Phase 7 should enforce the must-not-break tests, not every possible suite.
- Broader observability, dashboarding, or future platform work remains deferred beyond this milestone.

</deferred>

---

*Phase: 07-public-api-hardening-and-ci-protection-closure*
*Context gathered: 2026-04-10*
