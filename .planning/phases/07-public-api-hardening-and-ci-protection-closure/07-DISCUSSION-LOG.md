# Phase 7: Public API Hardening And CI Protection Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 07-public-api-hardening-and-ci-protection-closure
**Areas discussed:** Shared hardening boundary, Donation route strictness, Newsletter subscribe alignment, PR test enforcement scope, CI scoping strategy

---

## Shared Hardening Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Move remaining live routes onto the shared Phase 2 helpers | Recommended. Finishes the intended API hardening architecture consistently | yes |
| Patch each route locally just enough to satisfy the audit | Faster short term, but leaves public API consistency weaker | |
| Leave special-case public routes as exceptions | Preserves the milestone blocker | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 7 should finish the shared validation/rate-limit/error boundary pattern rather than creating one-off exceptions for donation and newsletter routes.

---

## Donation Route Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Fully harden both PIX and Stripe create routes now | Recommended. Both are high-risk public mutation surfaces that create records and call providers | yes |
| Prioritize only one provider route now | Leaves one public payment path below the milestone baseline | |
| Rely on provider-side validation for most of the safety story | Too weak for routes that are still directly exposed from the public UI | |

**User's choice:** Auto-selected recommended option
**Notes:** Both donation creation surfaces need full shared-boundary hardening, not partial confidence borrowed from downstream providers.

---

## Newsletter Subscribe Alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve anti-enumeration but migrate to the shared boundary contract | Recommended. Keeps current user-safe behavior while removing the route-local exception | yes |
| Leave the newsletter route largely as-is because it already has basic safeguards | Leaves one public route outside the shared Phase 2 hardening model | |
| Redesign the newsletter UX/flow in this phase | Too broad for a milestone gap-closure phase | |

**User's choice:** Auto-selected recommended option
**Notes:** The route should keep its anti-enumeration messaging but stop being a special-case implementation.

---

## PR Test Enforcement Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce the critical root test baseline for affected changes | Recommended. Closes the “tests exist but don’t protect merges” gap directly | yes |
| Keep build/lint only and rely on manual test discipline | Leaves the milestone blocker unresolved | |
| Run an always-full monorepo test matrix on every PR | Stronger coverage, but likely heavier than needed for this milestone | |

**User's choice:** Auto-selected recommended option
**Notes:** The existing root scripts should become actual PR protection, not just local convenience.

---

## CI Scoping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep test enforcement change-scoped by surface and root impact | Recommended. Preserves practical CI speed while still protecting merges | yes |
| Run the same full test suite on every PR | Simpler logic, but more expensive and noisier than needed | |
| Keep tests entirely opt-in outside local runs | Fails the remaining milestone CI gap | |

**User's choice:** Auto-selected recommended option
**Notes:** Phase 7 should expand the current scoped-job workflow rather than replace it with an all-or-nothing matrix.

---

## the agent's Discretion

- Planning can choose the exact schemas, helper composition, and CI job layout as long as the remaining public mutation routes end up on the shared hardening boundary and the critical tests actively protect merges.
- Planning can decide how to group route migrations and test enforcement across plans, provided the work stays incremental and testable.
- Planning can choose whether route coverage expands existing integration files or introduces new focused ones, as long as the public flows become explicitly protected.

## Deferred Ideas

- Full monorepo exhaustive CI on every change is deferred beyond this milestone.
- Non-critical API surfaces and broader platform evolution stay outside this gap-closure phase.
