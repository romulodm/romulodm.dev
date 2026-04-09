# Phase 1: OSS Safety And Governance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 1-OSS Safety And Governance
**Areas discussed:** Public repo boundary, Env contract strategy, CI baseline strictness, Security automation level, Legacy frontend handling

---

## Public Repo Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Whole repo public-safe | Treat the whole repo as intended-for-public and remove or ignore unsafe material everywhere | yes |
| Mixed boundary | Keep some folders effectively private by convention while publishing the rest | |
| Minimal cleanup | Remove only obvious secrets and leave broader runtime/generated hygiene for later | |

**User's choice:** Auto-selected recommended default
**Notes:** Locked to whole-repo public safety so Phase 1 planning cannot rely on undocumented private corners.

---

## Env Contract Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Per-surface contract plus root guide | Add explicit env examples/docs for runnable surfaces and a root explanation of integrations and variable purpose | yes |
| Single root env file only | Document everything in one root file even if apps differ operationally | |
| Minimal examples | Keep only the current env example and add brief notes later | |

**User's choice:** Auto-selected recommended default
**Notes:** The current `portfolio/.env.example` should become part of a fuller OSS-safe env contract.

---

## CI Baseline Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Root entrypoint with scoped baseline checks | Add one documented CI command and run scoped lint/build/security checks first | yes |
| Full monorepo checks on every change | Run everything for every PR immediately | |
| Docs-only CI in Phase 1 | Delay meaningful CI gates until the testing phase | |

**User's choice:** Auto-selected recommended default
**Notes:** Keeps Phase 1 practical and fast while still making merge protection meaningful before Phase 3 expands test depth.

---

## Security Automation Level

| Option | Description | Selected |
|--------|-------------|----------|
| Strong baseline guardrails | Enable secret scanning, dependency/security review, and baseline static security automation where supported | yes |
| Secret scanning only | Focus on leak prevention and defer dependency or code scanning | |
| Manual operator review | Document checks but rely mostly on human review | |

**User's choice:** Auto-selected recommended default
**Notes:** Phase 1 should establish both repository-level and code-level safety automation rather than treating security as a manual checklist.

---

## Legacy Frontend Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Public but clearly legacy | Keep `frontend/` in the repo, document it clearly, and include it in OSS hygiene rules | yes |
| Exclude from Phase 1 | Ignore the legacy frontend for now and revisit it later | |
| Remove immediately | Delete or archive the legacy frontend as part of Phase 1 | |

**User's choice:** Auto-selected recommended default
**Notes:** This keeps hardening incremental while preventing the legacy app from becoming a blind spot in public release safety.

---

## the agent's Discretion

- CI workflow names and file breakdown
- Exact documentation split for env/reference material
- Specific repo-security workflow selection based on available platform support

## Deferred Ideas

None.
