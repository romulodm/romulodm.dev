# Pitfalls Research

**Domain:** Production hardening for a public full-stack TypeScript monorepo
**Researched:** 2026-04-08
**Confidence:** HIGH

## Common Pitfalls

### Secret-safe release treated as a documentation task

- **Warning signs:** `.env` files, runtime session folders, provider credentials, or generated auth state remain near tracked code; `.env.example` is missing or incomplete
- **Why it happens:** teams focus on application code first and assume gitignore alone is enough
- **Prevention strategy:** perform a tracked-file secrets/data audit before public release, standardize env templates, and enable GitHub push protection
- **Phase mapping:** earliest hardening/governance phase

### Client-side validation mistaken for API security

- **Warning signs:** routes parse JSON manually, trust form/UI constraints, or duplicate shallow checks inconsistently
- **Why it happens:** client validation exists already, so server validation is deferred
- **Prevention strategy:** add server-side schemas and semantic checks at every public mutation boundary; follow OWASP allowlist-first validation
- **Phase mapping:** API security hardening phase

### Broken or incomplete authorization on admin/business flows

- **Warning signs:** auth checks vary per route, object ownership is inferred loosely, or admin checks live only in some helpers/pages
- **Why it happens:** routes evolve one by one and privilege assumptions drift
- **Prevention strategy:** centralize route guards, review admin-only endpoints, and test unauthorized scenarios explicitly
- **Phase mapping:** API security hardening and API test phases

### Queue retries without idempotency or visibility

- **Warning signs:** jobs mutate multiple systems in one pass, failures only show up in logs, retry behavior is inconsistent, or there is no backlog/failed-job reporting
- **Why it happens:** async systems are added incrementally and “working most of the time” seems sufficient
- **Prevention strategy:** make jobs idempotent, add explicit retries/backoff policy, surface queue metrics/failure counts, and test worker flows end-to-end
- **Phase mapping:** worker reliability phase

### Monorepo CI that is too slow or too broad to trust

- **Warning signs:** one giant workflow runs everything for every change, or CI is so expensive/slow it gets skipped
- **Why it happens:** easiest initial setup is a single workflow
- **Prevention strategy:** use GitHub path filters and matrix strategies to scope jobs by app/package while preserving a full required baseline
- **Phase mapping:** CI foundation phase

### Performance tuning before correctness and measurement

- **Warning signs:** index changes are made without query profiling, caching is added before data correctness is understood, or query hotspots are inferred from intuition
- **Why it happens:** production hardening discussions naturally drift toward “speed”
- **Prevention strategy:** security and correctness first, then measure real query behavior and tune using Prisma recommendations
- **Phase mapping:** later scalability/performance phase

### Public content and upload handling trusted too broadly

- **Warning signs:** upload checks rely on filename/content-type alone, rich text is rendered without a clear sanitization policy, or storage paths are too permissive
- **Why it happens:** portfolio/blog apps feel lower risk than SaaS apps
- **Prevention strategy:** validate file size/type server-side, prefer generated storage keys, and review rich-content rendering and public asset serving carefully
- **Phase mapping:** API security phase

## Pitfall Priorities

| Pitfall | Risk | Why It Matters Here |
|--------|------|---------------------|
| Secret leakage in public repo | CRITICAL | Public OSS release is a stated goal |
| Silent worker failure | CRITICAL | One of the top must-not-break outcomes |
| Broken auth/admin control | CRITICAL | Loss of operator control is a top risk |
| Missing critical-path tests | HIGH | Hardening work becomes guesswork without them |
| Ad hoc validation on public APIs | HIGH | Public exposure increases abuse and misuse risk |
| Query/caching issues without measurement | MEDIUM | Important, but secondary to security and correctness |

## Recommended Guardrails

- No public release before a documented secrets/runtime-data audit passes.
- No high-risk API route without explicit server-side validation and auth tests.
- No worker-critical flow without retry policy plus a way to notice failures/backlogs.
- No major performance work until baseline tests and security checks are green.

## Sources

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [BullMQ retrying failing jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)
- [BullMQ metrics](https://docs.bullmq.io/guide/telemetry/metrics)
- [GitHub push protection](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enabling-push-protection-for-your-repository)
- [GitHub workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [Prisma Optimize recommendations](https://docs.prisma.io/docs/v6/optimize/recommendations)

---
*Pitfalls research for: production hardening for a public monorepo*
*Researched: 2026-04-08*
