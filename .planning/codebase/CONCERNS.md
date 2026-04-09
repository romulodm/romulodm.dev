# Codebase Concerns

**Analysis Date:** 2026-04-08

## Tech Debt

**Dual frontend implementations:**
- Issue: Both the current Next.js app and an older Vite frontend live in the same repo
- Files: `portfolio/`, `frontend/`
- Why: The project appears to have evolved from a standalone frontend into a fuller monorepo without removing the old app
- Impact: Easy to edit the wrong UI surface, duplicate features/patterns, or carry legacy assumptions forward
- Fix approach: Decide whether `frontend/` is still deployed/needed; archive or document it more explicitly if it is legacy-only

**Business logic concentrated in route handlers:**
- Issue: Several route handlers perform validation, data access, orchestration, and side effects in one file
- Files: `portfolio/app/api/comments/route.ts`, `portfolio/app/api/posts/route.ts`, many donation/newsletter handlers
- Why: Fast feature iteration inside App Router endpoints
- Impact: Harder testing, larger blast radius for changes, duplicated patterns
- Fix approach: Extract shared domain services and server-side validators for hot paths first

**Operational data stored inside repo tree:**
- Issue: runtime directories like `portfolio/waha-data/` and top-level `waha-data/` sit beside source code
- Why: Docker bind mounts were pointed at workspace folders for convenience
- Impact: noisy scans, risk of accidental edits/commits, unclear separation between code and runtime state
- Fix approach: move runtime/session storage outside the repo or document/ignore it aggressively

## Known Bugs

**In-memory comment rate limiting resets per process:**
- Symptoms: limits are inconsistent across restarts/instances and do not work reliably in horizontally scaled deployments
- File: `portfolio/app/api/comments/route.ts`
- Trigger: app restart or multiple app instances
- Workaround: none beyond keeping a single warm process
- Root cause: `Map<string, number[]>` rate limit state is process-local
- Fix approach: move throttling to Redis or middleware-level persistent storage

**Compose indentation issue in base stack:**
- Symptoms: the `worker` service block appears nested under `redis` in `docker-compose.yml`
- File: `docker-compose.yml`
- Trigger: trying to rely on the base compose file for local/prod orchestration
- Workaround: use `docker-compose.dev.yml` or correct the YAML before deployment
- Root cause: malformed indentation

## Security Considerations

**Debug auth enabled in production-sensitive config:**
- Risk: verbose auth debugging can leak sensitive operational details into logs
- File: `portfolio/lib/auth.ts`
- Current mitigation: none visible in code
- Recommendations: gate `debug` by environment or disable outside local development

**Upload validation trusts authenticated users broadly:**
- Risk: any authenticated user can request presigned upload URLs; file validation checks type and optional size but not broader authorization/business rules
- Files: `portfolio/app/api/uploads/presign/route.ts`, `portfolio/lib/s3.ts`
- Current mitigation: auth check plus file type filtering
- Recommendations: add stronger role/rate limits, enforce file size consistently, and consider server-side virus/content scanning if uploads expand

**Secrets exposure risk via verbose logs and env-heavy integration code:**
- Risk: extensive `console.log` usage around integration flows can accidentally expose request data or provider responses
- Files: `worker/lib/whatsapp.ts`, worker startup/log-heavy modules
- Current mitigation: none systematic
- Recommendations: adopt structured/sanitized logging for external integrations

## Performance Bottlenecks

**Deep nested comment fetching:**
- Problem: comment listing eagerly includes nested replies and votes recursively
- File: `portfolio/app/api/comments/route.ts`
- Measurement: no timing instrumentation found
- Cause: large Prisma include tree plus pagination only at root comment level
- Improvement path: fetch replies lazily or cap nesting depth per request

**Campaign dispatch enqueues sequentially per recipient:**
- Problem: campaign jobs are added one-by-one in a loop
- File: `portfolio/lib/newsletter/newsletter.service.ts`
- Measurement: no instrumentation found
- Cause: sequential awaits inside recipient loop
- Improvement path: use batched queue insertion or controlled parallelism

## Fragile Areas

**Newsletter/campaign lifecycle:**
- Why fragile: campaign state is split across app routes, Prisma records, queue payloads, and worker completion logic
- Common failures: duplicate sends, stuck `SENDING` state, incorrect recipient counters
- Safe modification: trace both producer and consumer sides before changing campaign status logic
- Test coverage: no automated coverage found

**Payments/webhooks:**
- Why fragile: correctness depends on third-party callbacks and signature verification
- Common failures: donation status drift or webhook handling regressions
- Safe modification: keep webhook verification intact and test against provider fixtures/sandboxes
- Test coverage: no automated coverage found

**Moderation pipeline:**
- Why fragile: combines local blocklists, Safe Browsing, and OpenAI moderation in sequence
- Common failures: false positives, slow moderation, provider outages blocking comment flow
- Safe modification: preserve provider ordering and keep blocked-comment persistence behavior explicit
- Test coverage: no automated coverage found

## Scaling Limits

**Single worker process architecture:**
- Current capacity: one Node worker process with queue concurrency tuned per worker
- Limit: throughput and reliability depend on a single worker service instance unless more are provisioned intentionally
- Symptoms at limit: queue backlogs, delayed emails/notifications, view flush lag
- Scaling path: add more worker replicas and verify idempotency across jobs

**App-side memory throttling and runtime caches:**
- Current capacity: acceptable for one instance
- Limit: breaks down with multiple replicas or frequent restarts
- Symptoms at limit: inconsistent throttling and stale assumptions about state
- Scaling path: move ephemeral coordination to Redis/shared infra

## Dependencies at Risk

**Legacy frontend stack drift:**
- Risk: `frontend/` is pinned to older React/Vite/MUI-era dependencies than the main app
- Impact: maintenance cost and security/update surface increase if that app is still active
- Migration plan: retire it or define its ownership/deployment status clearly

**Large integration surface with many external credentials:**
- Risk: Stripe, OpenAI, Safe Browsing, Google OAuth, Umami, WAHA, MinIO, SMTP/SES all need healthy config
- Impact: configuration regressions can break major features without compile-time signals
- Migration plan: strengthen env validation and add smoke/integration tests

## Missing Critical Features

**Automated test harness:**
- Problem: important user flows are effectively untested in code
- Current workaround: manual verification and runtime logging
- Blocks: safe refactors, confident queue/payment/auth changes
- Implementation complexity: medium, because the repo spans web, worker, DB, Redis, and third-party integrations

**Centralized validation and error model:**
- Problem: request validation and error shape are inconsistent across routes
- Current workaround: ad hoc guard clauses in each handler
- Blocks: predictable API behavior and reuse
- Implementation complexity: medium

## Test Coverage Gaps

**Auth and registration flows:**
- What's not tested: credentials login, Google login edge cases, password reset
- Risk: account creation or login can regress silently
- Priority: High
- Difficulty to test: Medium

**Async email/notification pipelines:**
- What's not tested: queue payloads, worker processing, campaign completion logic
- Risk: user-visible side effects fail after data is persisted
- Priority: High
- Difficulty to test: Medium to High

**Moderation and comments:**
- What's not tested: provider sequencing, suspicious comment capture, rate limiting behavior
- Risk: abuse handling and normal commenting can both break
- Priority: High
- Difficulty to test: Medium

---
*Concerns audit: 2026-04-08*
*Update as issues are fixed or new ones discovered*
