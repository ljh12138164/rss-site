# Incremental Auto-Verification and Activation for Unverified Cron Jobs

- **Branch**: `feat/auto-activate-unverified-cron` (base `origin/master` @ `c1d9274`)
- **Date**: 2026-11-15
- **Status**: Implementing

## Background

Previously, adding a new signal source in `deploy/server/business-jobs.json` left its PostgreSQL `pg_cron` job disabled (`verified = false`, `active = false`) even after CI merged and deployed the new release to ECS. Operators then had to log into ECS manually (for example via `alibabacloud-workbench-cli`), invoke `POST /cron/signals/:source`, run `pnpm setup:cron --output ...` across **all** 50+ configured sources, and call `private.activate_business_jobs(jsonb)` in PostgreSQL before the new source could ingest on schedule.

That manual full-fleet gate made sense during the initial PostgreSQL 18 cutover, when all jobs were brand new and legacy ECS/Supabase writers still existed. After cutover, every already-verified source stays verified (`verified = true`) across redeployments, so blocking new sources on a manual Workbench session plus full-fleet re-verification adds avoidable toil without improving safety for existing jobs.

## Scope

1. **Incremental DB activation function (`deploy/postgres/migrations/009-incremental-cron-activation.sql`)**:
   - Add `private.activate_verified_business_jobs(evidence jsonb)` which validates fresh evidence (`database_major = 18`, `old_writers_disabled = true`, `verified_at` within the last 2 hours, non-empty string array `verified_jobs` where every job exists in `private.business_cron_jobs`) and enables (`verified = true`, `cron.job.active = true`) **only** the subset listed in `verified_jobs`.
   - Keep `private.activate_business_jobs(jsonb)` strictly requiring all rows in `private.business_cron_jobs` by delegating activation to `private.activate_verified_business_jobs(evidence)`, and revoke public execute permissions on both functions so `rss_site_app` retains zero scheduler/credential access.
2. **Incremental loopback verification CLI (`server/api/src/setup/cron.ts`, `server/api/src/setup/cli.ts`)**:
   - Add `verifyBusinessJobs(...)` in `cron.ts` to test requested job names independently (`failed` on one job never prevents another valid job from being returned in `verified`), supporting both `/cron/signals/:source` (reusing `setupSignalCron` + `/cron/verify/:source`) and `/cron/maintenance/*` endpoints with transient HTTP `502/503/504` retries.
   - Extend `cli.ts` with `--sources <csv>`, `--loopback`, and `--json` flags (bundled into `/app/server/api/src/setup/cli.mjs` by `Dockerfile`) while keeping `pnpm setup:cron --output <path>` strict all-or-nothing behavior unchanged.
3. **ECS deploy hook (`deploy/server/sync-business-cron`, `deploy/server/deploy-rss-site`)**:
   - Add `--activate-unverified` mode to `deploy/server/sync-business-cron` that fast-exits when `private.business_cron_jobs where not verified` is empty, checks `systemctl` (when present) to ensure no stray legacy `rss-site-*.timer` units remain active (`rss-site-postgres-backup.timer` and `rss-site-supabase-keepalive.timer` excepted), probes unverified jobs via loopback `cli.mjs`, activates verified jobs cleanly via `-v report="$report"` (`:'report'::jsonb`), and exits non-zero only if any unverified source fails.
   - Call `sync-business-cron --activate-unverified` in `deploy/server/deploy-rss-site` **after `trap - ERR`** and **before `prewarm-lists.mjs`**, guarded so a transient upstream failure on a newly added source never rolls back a healthy web deploy or active existing jobs.
4. **Tests & workflow docs**:
   - Unit tests in `server/api/src/setup/cron.test.ts` for `verifyBusinessJobs` (partial success isolation, maintenance 200/202, failure reason sanitization, unknown job rejection).
   - Packaging & non-rollback guard tests in `deploy/server/test-release-packaging.py`.
   - Runtime PostgreSQL 18 + `pg_cron` isolation, privilege revocation, and live container `cli.mjs --loopback --json` smoke in `deploy/server/verify-release-runtime`.
   - Update `AGENTS.md`, `README.md`, `deploy/postgres/README.md`, and `docs/research/rsshub-route-candidates-and-workflow.md`.

## Out of scope

- Removing `pnpm setup:cron --output <path>` or `private.activate_business_jobs(jsonb)` (kept for full-fleet disaster recovery and manual verification).
- Auto-retiring or auto-rolling back upstream RSSHub feeds; failed unverified sources stay `verified = false, active = false` for operator follow-up.
- Adding host packages (`jq`) or changing SSH deploy `FILES=(...)` / sudoers whitelist.

## Acceptance criteria

- Adding one or more new entries to `deploy/server/business-jobs.json` (or changing a job's `path`) and running the ECS deployment sequence automatically ingests, verifies against PostgreSQL 18, and enables `verified = true, active = true` only for those passing jobs without SSH/Workbench manual SQL steps.
- Normal deploys with zero unverified jobs perform one fast DB query (`~1` SQL check) and skip HTTP verification entirely (`0` extra requests).
- Partial failure isolation works at both DB and deploy boundaries:
  - If new job `A` passes and new job `B` fails upstream, `A` becomes `verified = true, active = true`, `B` remains `verified = false, active = false`, all existing verified jobs remain undisturbed, and `deploy-rss-site` does not roll back.
- Privilege separation remains intact: `rss_site_app` has `false` execute privilege on `private.activate_verified_business_jobs(jsonb)`, `private.activate_business_jobs(jsonb)`, `private.dispatch_business_job(text,integer)`, and no `SELECT` privilege on `private.business_cron_settings`.
- Zero secrets (`CRON_SECRET`, `DATABASE_URL`, headers) are printed to stdout/stderr or stored in verification output.

## Feasibility

- **Concurrency, bottleneck, and timeouts**:
  - `deploy-rss-site` acquires `/run/lock/rss-site-deploy.lock`, preventing overlapping deploys.
  - Inside `sync-business-cron --activate-unverified`, only rows with `not verified` are tested (typically 0 on routine deploys -> ~30ms single SQL check; 1-3 requests for new-source PRs -> ~10-40s over loopback `127.0.0.1:3000`, well inside the 180s per-request `AbortSignal.timeout`).
  - Existing 53+ verified jobs are untouched and never re-hit during incremental activation.
- **Privilege & rollback safety**:
  - Inside `web`, `bun server/api/src/setup/cli.mjs` uses `CRON_SECRET` only to call loopback `/cron/signals/*`, `/cron/verify/*`, and `/cron/maintenance/*`. It outputs non-secret JSON (`{"verified":[...],"failed":[...]}`).
  - Host `sync-business-cron` passes that non-secret JSON into `postgres` (`psql -U postgres -v report="$report"`) to execute `private.activate_verified_business_jobs`, preserving complete isolation between `rss_site_app` and `private.business_cron_*` / `cron.job`.
  - Placing `--activate-unverified` after `trap - ERR` guarantees `deploy-rss-site` only rolls back on health check or SQL schema sync failure, never on an external feed hiccup. Running it before `prewarm-lists.mjs` allows the newly ingested articles to populate warmed list caches immediately.
- **Two-step ECS rollout behavior**:
  - On the deploy that introduces this PR, ECS initially executes the previously installed `/usr/local/sbin/deploy-rss-site`, which runs `sync-business-cron` (installing migration `009`) and installs the new `/usr/local/sbin/deploy-rss-site` + `/usr/local/sbin/deploy-rss-site` helper expectations (`MANAGED` stays unchanged: `deploy-rss-site`, `rss-site-deploy-gate`, `rss-site-deploy.sudoers`). Every deploy thereafter executes the new `/usr/local/sbin/deploy-rss-site` from start to finish cleanly.

## Implementation

- **`deploy/postgres/migrations/009-incremental-cron-activation.sql`**:
  - Added `private.activate_verified_business_jobs(evidence jsonb)` requiring `database_major = 18`, `old_writers_disabled = true`, `verified_at` within `[now() - interval '2 hours', now() + interval '5 minutes']`, and a non-empty string array `verified_jobs` where every job exists in `private.business_cron_jobs`. Activates (`verified = true`, `cron.job.active = true`) strictly those matching jobs.
  - Updated `private.activate_business_jobs(evidence jsonb)` to enforce full-fleet coverage over `private.business_cron_jobs` and delegate activation to `private.activate_verified_business_jobs(evidence)`.
  - Revoked `public` execute permissions on both functions so `rss_site_app` retains zero scheduler control.
- **`server/api/src/setup/cron.ts` & `server/api/src/setup/cli.ts`**:
  - Added `createHttpCronRepository(...)` and `verifyBusinessJobs(...)` in `cron.ts`. Signal jobs reuse `setupSignalCron` + `/cron/verify/:source`, and maintenance jobs invoke `/cron/maintenance/*` with `requestWithTransientRetries` (accepting 2xx including `202` for `zhihu-cookie`). Per-job failures are isolated into `failed: [{ source, reason }]` with control characters sanitized while passing jobs accumulate in `verified`.
  - Extended `cli.ts` (`--loopback --json --sources <csv>`) for container loopback invocation via `/app/server/api/src/setup/cli.mjs` while preserving the existing `--output <path>` all-or-nothing contract.
- **`deploy/server/sync-business-cron` & `deploy/server/deploy-rss-site`**:
  - Added `--activate-unverified` mode to `sync-business-cron`: fast-exits when `private.business_cron_jobs where not verified` is empty, rejects activation if any stray `rss-site-*.timer` unit (`rss-site-postgres-backup.timer` / `rss-site-supabase-keepalive.timer` excepted) is active, probes unverified jobs via `cli.mjs --loopback --json`, commits passing jobs via `psql -v report="$report"` (`:'report'::jsonb` + `cross join lateral` calling `private.activate_verified_business_jobs`), and returns exit `1` only when at least one unverified job failed.
  - Updated `deploy-rss-site` to install `/usr/local/sbin/sync-business-cron` for operator retries and invoke `bash "$TEMP/deploy/server/sync-business-cron" --activate-unverified` **after `trap - ERR`** and **before `prewarm-lists.mjs`**, guarded so an unverified source failure never triggers rollback.
- **Tests & Docs**:
  - Extended `server/api/src/setup/cron.test.ts` (+4 tests for `createHttpCronRepository` and `verifyBusinessJobs`), `deploy/server/test-release-packaging.py` (+5 packaging/non-rollback/`sync-business-cron` behavioral tests), and `deploy/server/verify-release-runtime` (subtransaction isolation assertions, privilege revocation assertions for `rss_site_app`, and live container `cli.mjs --loopback --json --sources publication-outbox,zhihu-cookie` smoke check).
  - Updated `AGENTS.md`, `README.md`, `deploy/postgres/README.md`, and `docs/research/rsshub-route-candidates-and-workflow.md`.

## Diff Review

- **Findings**: `0` blocking or high/medium issues found after inspecting full `git diff` across SQL migration, TypeScript setup helpers/CLI/tests, bash deploy scripts, Python packaging harness, and workflow documentation (`ponytail` zero-duplication helper sharing verified; `systemctl` old-writer check + SQL `-v` parameter binding verified; ShellCheck-clean bash conventions verified manually pending CI Linux runner; no credential/secret leakage).
- **Roadmap**: none (no accepted follow-ups remaining).

## Verification

- `pnpm exec biome check server/api/src/setup/cron.ts server/api/src/setup/cli.ts server/api/src/setup/cron.test.ts`: `Checked 3 files` (0 errors, 0 warnings).
- `pnpm check-types`: `3/3` packages passed (`@rss-site/signals`, `@rss-site/api`, `@rss-site/web`).
- `pnpm build`: `2/2` packages passed (`@rss-site/api` + `@rss-site/web` 61 routes, early-hints, `sw.js`).
- `bun build server/api/src/setup/cli.ts --target=bun` (temp outfile removed after check): bundled `3` modules (`33.38 KB`).
- `node apps/web/scripts/render-cron-sql.mjs` (dummy non-production `CRON_SECRET`): rendered `336` SQL lines including `private.activate_verified_business_jobs`.
- `pnpm test`: `318 passed | 22 skipped` (`@rss-site/signals` `8/8`, `@rss-site/api` `118/118` including `22/22` in `cron.test.ts`, `@rss-site/web` `192 passed | 22 skipped` for DB/Redis integration suites requiring local Docker PostgreSQL/Redis).
- `python3 -B deploy/server/test-release-packaging.py -v` (under WSL): `8/8` tests passed (`OK`), covering packaging whitelist, non-rollback on both `--activate-unverified` and prewarm failures, zero-HTTP skip when no unverified jobs exist, partial-success isolation, and stray legacy timer rejection.
- `bash -n` on `deploy/server/sync-business-cron`, `deploy/server/deploy-rss-site`, `deploy/server/verify-release-runtime`, `deploy/server/rss-site-deploy-gate`, and `deploy/server/bootstrap-rss-site`: passed (all LF line endings verified).
- **CI-only checks pending GitHub Actions PR run**: `shellcheck` (not installed locally on Windows) and `deploy/server/verify-release-runtime` (Docker Desktop daemon not running locally on Windows).

## Risks

- **Upstream feed instability during deploy**: A new platform's RSS/Atom route may time out right when CI deploys; guarded after `trap - ERR` so the site deploy remains healthy while leaving that source safely disabled (`verified = false`) until fixed and retried (`bash deploy/server/sync-business-cron --activate-unverified` on ECS or next deploy).
- **`shellcheck` on Linux CI**: Host script edits must remain strictly ShellCheck-clean (no unquoted expansions or `local x=$(...)`); verified carefully against CI checks.
