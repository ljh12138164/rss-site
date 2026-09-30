# Redis translation result cache

## Background
Translation results previously lived only in page state. The service merged in-flight work but repeated inference after refresh. The user approved a seven-day Redis cache and a reusable foundation for future AI summaries.

## Scope
- Cache article and AI event translations for 604800 seconds after creation.
- Share JSON cache read/write and hashed, versioned key helpers with future AI summaries.
- Deploy a private Redis container with persistence and bounded memory.

## Out of scope
- AI summary generation, distributed inference locks, automatic pretranslation and UI changes.
- The pre-existing GoogleScripts GTM test edit is retained locally and excluded from this change, as clarified by the user.

## Acceptance criteria
- A repeated request returns the cached translation without inference; hits do not renew expiration.
- Source changes and operation/version differences produce different keys.
- Only successful translations are written, using atomic SET EX 604800.
- Missing Redis configuration, unavailable Redis and invalid cache data fall back to translation.
- Existing in-process deduplication and two-distinct-translation limit remain; hits bypass the limit.

## Feasibility
Feasible: translation runs in the self-hosted Next Node-compatible/Bun runtime. Redis needs no Supabase migration. Existing Compose deployment must pull the new Redis image before its `up --pull never web` invocation. REDIS_URL stays server-only; Compose provides the internal address without changes to existing production secrets.

## Implementation
- Shared `lib/redis-cache.ts` provides namespace/version/SHA-256 keys, validated JSON reads and seven-day writes. Redis operations use 500 ms connection/command timeouts, no offline queue or automatic retries, and generic error messages without connection credentials. Failed connections are disconnected and discarded so timed-out commands and payloads cannot accumulate; a later request can reconnect. Invalid JSON leaves a healthy connection intact.
- Translation keys include source content, ID, language/model/behavior version and article URL/section. Failed inference never writes a result. Model or rendering behavior changes require a version bump.
- Compose adds Redis 7.4 with AOF, a named volume, 128 MB cache budget, allkeys-lru eviction, 256 MB container limit and no published ports. The deploy script pulls Redis before starting the release.
- Future summaries can reuse the helpers with their own namespace and a version including model/prompt/language, hashing their source input. No summary endpoint is introduced here.
- Branch `feat/redis-ai-cache` starts at latest `origin/master` (`58b6d80`). The user initially authorized the existing test edit, then clarified it should be excluded; it remains untouched.

## Verification
- Red phase: repeated article/event request tests failed because inference repeated; cache module tests could not load the not-yet-created module.
- Regression red/green: a real TCP server accepting connections but never replying to GET/SET reproduced retained sockets after command timeout. Exact-client cleanup made the same test pass for both reads and writes.
- Cache/translation focused tests: 23 passed, covering cache hits, input changes, namespace separation, failed inference/retry, deduplication, hits at inference capacity, schema validation, SET EX 604800, absent configuration, outages and stalled connection cleanup.
- Manual Bun + real Redis 7.4.0 smoke check (temporary WSL instance): write/read returned the Chinese result; Redis TTL was exactly 604800 seconds; a later read did not renew TTL; shortened expiration returned a cache miss; shutting down Redis allowed read/write fallback within 2500 ms. Temporary verification scripts and downloads were removed from the repository. This is runtime evidence, not production deployment evidence.
- `docker compose -f compose.yaml config --no-interpolate --no-env-resolution`: passed; no Redis published port. `bash -n deploy/server/deploy-rss-site` through WSL: passed.
- Initial full `pnpm test`: signals 7 passed, API 85 passed, Web 226 passed and 1 failed. The sole failure is the pre-existing uncommitted GTM assertion (`places GTM bootstrap before hydration with a noscript fallback`); the user explicitly excluded that change. It remains unchanged locally, and is not part of the branch's committed code.
- Final `pnpm --filter @rss-site/web test --exclude components/google-scripts.test.tsx`: 228 tests passed in 63 files. All three workspace type checks passed. Production Web rebuild passed, generating 61/61 pages.
- Changed-file Biome check and `git diff --check`: passed. Docker daemon is unavailable locally, so the full Linux container build and production rollout remain CI/deployment checks.

## Review
- Independent requesting-code-review review found the stalled connection retention issue; it was resolved and re-reviewed. No blocking findings remain, and there are no accepted follow-ups requiring a roadmap in this change.
- [ioredis API documentation](https://redis.github.io/ioredis/) and [Redis SET documentation](https://redis.io/docs/latest/commands/set/) support the connection settings and atomic expiration used here.

## Risks
- Redis can evict results before seven days under memory pressure; seven days is a maximum lifetime, not guaranteed retention.
- Deduplication remains per process; multiple web replicas can infer the same cache miss concurrently.
- First deployment needs registry access to pull Redis. Production behavior requires post-deployment verification.
- Generic warnings indicate cache failures without exposing credentials.
