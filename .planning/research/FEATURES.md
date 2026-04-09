# Feature Research

**Domain:** Production hardening for a public full-stack TypeScript monorepo
**Researched:** 2026-04-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Secret-safe repository hygiene | Public repos are expected not to expose secrets, tokens, local runtime state, or private credentials | MEDIUM | Includes `.env.example`, `.gitignore`, history/repo scan, and runtime-data cleanup |
| Automated CI on pull requests and main | Production-ready OSS projects are expected to validate changes automatically | MEDIUM | Needs monorepo-aware jobs, path filters, and reproducible local/CI commands |
| Unit and API test coverage on critical logic | Without this, regressions are expected in public maintenance work | HIGH | Especially important for auth, moderation, newsletter, donations, and shared packages |
| E2E smoke coverage for the public app | Public production systems need browser-level validation of core paths | MEDIUM | Portfolio uptime and auth control are must-not-break flows |
| Server-side input validation and access control | Public APIs are assumed hostile by default | HIGH | OWASP guidance strongly favors early server-side validation, not client-only checks |
| Queue failure visibility and retry safety | Async systems must not fail silently | HIGH | Worker health and queue backlog visibility are table stakes for production reliability |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Path-aware monorepo CI | Keeps CI fast enough to run consistently while still covering all apps/packages | MEDIUM | Important because this repo spans Next.js, worker, packages, and a Vite app |
| Explicit open-source-safe publish checklist | Makes public release safer and repeatable | LOW | Valuable because the repo mixes code, env-driven integrations, and runtime operational data |
| Production-grade worker observability | Helps a single operator notice silent failures before they pile up | MEDIUM | More valuable here than generic enterprise dashboards because one person is operating the system |
| Security-first hardening roadmap | Prevents “tests first, security later” drift | LOW | Aligns work order with the real risk profile of a public monorepo |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Rewriting the stack during hardening | Feels like a clean way to solve old issues | Adds migration risk and delays production readiness | Keep the architecture and harden incrementally |
| Chasing 100% test coverage immediately | Feels comprehensive | Slows delivery and hides risk prioritization | Cover critical flows first, then expand strategically |
| Adding more integrations before hardening | Feels like visible progress | Expands the attack surface and config complexity | Freeze feature expansion until OSS safety and CI are in place |
| Heavy distributed systems complexity for a single-operator app | Feels “enterprise-ready” | Increases operational burden more than it helps | Improve observability, retries, limits, and query efficiency within the current architecture |

## Feature Dependencies

```text
Repository hygiene
    └──requires──> Secrets inventory
                      └──requires──> .gitignore / env-template cleanup

CI pipeline
    └──requires──> Stable test commands
                      └──requires──> Test harness setup

E2E coverage
    └──requires──> Deterministic app startup
                      └──requires──> Seeded/test-safe environment config

Queue observability
    └──enhances──> Worker reliability

Input validation
    └──enhances──> Auth and API security

Rewrite architecture
    ──conflicts──> Incremental hardening baseline
```

### Dependency Notes

- **Repository hygiene requires secrets inventory:** you cannot make the repo public safely without knowing what sensitive material exists in tracked files and runtime directories.
- **CI pipeline requires stable test commands:** workflows only help when each app/package has explicit commands that are reproducible locally.
- **E2E coverage requires deterministic startup:** browser tests need a known app URL, environment, and seed data strategy.
- **Queue observability enhances worker reliability:** retries alone are not enough when the main risk is silent failure.
- **Rewrite architecture conflicts with incremental hardening:** it violates the project constraint and adds avoidable instability.

## MVP Definition

### Launch With (v1)

- [ ] Secrets and sensitive data audit/remediation — essential for safe public release
- [ ] CI workflow for lint/build/test/security checks — essential for a production-ready baseline
- [ ] Critical-path automated tests — essential for portfolio uptime, auth safety, and worker confidence
- [ ] Server-side validation, auth/access-control, and rate-limiting hardening — essential for public exposure
- [ ] Worker observability and failure visibility — essential because silent failure is a top risk

### Add After Validation (v1.x)

- [ ] Broader test coverage across less critical paths — add once the baseline is green and stable
- [ ] Query and index optimization informed by real profiling — add after core correctness and security stabilize
- [ ] More sophisticated CI partitioning/caching — add once the initial pipeline is proven useful

### Future Consideration (v2+)

- [ ] Major dependency/runtime upgrades — defer unless required by security or platform support
- [ ] Deeper platform-level observability stack — defer until the simpler logging/alert baseline is in place
- [ ] Retirement or extraction of the legacy `frontend/` app — defer until production/publication status is clearer

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Repo secret hygiene and publish safety | HIGH | MEDIUM | P1 |
| CI pipeline with security checks | HIGH | MEDIUM | P1 |
| Critical-path unit/API/E2E coverage | HIGH | HIGH | P1 |
| Input validation, access control, and rate limiting | HIGH | HIGH | P1 |
| Worker logging, telemetry, and alertability | HIGH | MEDIUM | P1 |
| Query/index optimization | MEDIUM | MEDIUM | P2 |
| Broader non-critical coverage expansion | MEDIUM | MEDIUM | P2 |
| Architecture cleanup beyond hardening | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Sources

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [GitHub dependency review](https://docs.github.com/en/enterprise-cloud%40latest/code-security/concepts/supply-chain-security/about-dependency-review)
- [GitHub push protection](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enabling-push-protection-for-your-repository)
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright)
- [BullMQ retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- [BullMQ metrics](https://docs.bullmq.io/guide/telemetry/metrics)

---
*Feature research for: production hardening for a public monorepo*
*Researched: 2026-04-08*
