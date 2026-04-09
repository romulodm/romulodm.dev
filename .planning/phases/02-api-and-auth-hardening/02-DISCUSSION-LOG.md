# Phase 2: API And Auth Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 02-api-and-auth-hardening
**Areas discussed:** Auth enforcement pattern, Auth flow cleanup boundary

---

## Auth Enforcement Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Shared route guard everywhere, plus optional middleware only for page gating | Standardize API authz in one server helper pattern, while middleware improves admin UX without being the only protection layer | yes |
| Middleware-first for admin pages and APIs | More aggressive centralization, but couples API protection more tightly to middleware behavior | |
| Route-local hardening only | Lowest-risk change footprint, but preserves duplication and inconsistency | |

**User's choice:** Shared route guard everywhere, plus optional middleware only for page gating
**Notes:** The user accepted the recommended boundary. Phase 2 should converge route handlers on one shared server-side guard pattern while allowing middleware to remain complementary rather than authoritative.

---

## Auth Flow Cleanup Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Keep NextAuth as the canonical auth system and treat the custom login route as a compatibility surface to audit/harden | Preserves the current architecture and reduces rewrite risk while still hardening the custom route | yes |
| Fully unify auth flows under NextAuth in this phase | Stronger cleanup, but drifts into redesign rather than hardening | |
| Leave the dual-flow setup mostly as-is and just patch obvious issues | Lowest effort, but leaves ambiguity in a must-not-break area | |

**User's choice:** Keep NextAuth as the canonical auth system and treat the custom login route as a compatibility surface to audit/harden
**Notes:** The user wants hardening, not auth redesign. Planning should preserve NextAuth as the source of truth and decide the safest way to restrict, document, or de-risk the compatibility login surface.

---

## the agent's Discretion

- Validation/sanitization structure, rate-limiting rollout order, and error-shaping mechanics were not locked during discussion and can be determined during research and planning.

## Deferred Ideas

None.
