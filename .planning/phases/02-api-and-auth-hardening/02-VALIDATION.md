# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | existing app lint/build plus targeted route verification |
| **Config file** | none - uses existing repo/app configs |
| **Quick run command** | `npm run lint:portfolio` |
| **Full suite command** | `npm run ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint:portfolio`
- **After every plan wave:** Run `npm run ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SEC-01 | T-2-01 | Shared validation/sanitization helpers exist for API boundaries | lint | `npm run lint:portfolio` | yes | pending |
| 02-01-02 | 01 | 1 | SEC-01 | T-2-02 / T-2-03 | High-risk public and admin routes, including auth registration, use the shared boundary pattern | lint/build | `npm run ci:portfolio` | yes | pending |
| 02-02-01 | 02 | 2 | SEC-02 | T-2-04 | One server-side auth/authz helper pattern governs protected/admin route enforcement | lint | `npm run lint:portfolio` | yes | pending |
| 02-02-02 | 02 | 2 | SEC-02 | T-2-04 / T-2-06 | Targeted admin/protected routes and the compatibility login surface converge on the shared guard boundary | lint/build | `npm run ci:portfolio` | yes | pending |
| 02-03-01 | 03 | 3 | SEC-03 | T-2-07 | Shared Redis-backed abuse-control primitive is production-safe and reusable | lint | `npm run lint:portfolio` | yes | pending |
| 02-03-02 | 03 | 3 | SEC-03 | T-2-07 / T-2-09 | Targeted mutation routes, including auth registration and login, replace in-memory or missing abuse controls with the shared limiter | lint/build | `npm run ci:portfolio` | yes | pending |
| 02-04-01 | 04 | 4 | SEC-04 | T-2-08 / T-2-10 | Shared safe-error helpers exist for public and admin routes | lint/build | `npm run ci:portfolio` | yes | pending |
| 02-04-02 | 04 | 4 | SEC-04 | T-2-08 / T-2-10 / T-2-11 | Targeted public and admin routes return bounded safe errors without leaking internals | lint/build | `npm run ci` | yes | pending |

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compatibility login route still matches intended operator usage after hardening | SEC-02, SEC-04 | Intended non-browser/operator workflow is contextual | Verify the route either remains intentionally usable with safer boundaries or is explicitly restricted/documented according to the implementation choice |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all phase tasks
- [ ] No watch-mode flags
- [x] Feedback latency < 30s
- [x] nyquist compliant validation coverage exists for all planned tasks

**Approval:** approved 2026-04-09
