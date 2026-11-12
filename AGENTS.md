# Repository delivery rules

## Working directory

Use the existing `rss-site` directory for all work. Do not create additional Git worktrees or workspace copies unless the user explicitly requests one. Switch branches in this directory when needed, preserving existing work.

## New signal source gate

Every new platform or feed source must pass the following production-data gate before its Cron job is enabled:

1. Probe the real upstream feed without credentials and record the chosen route or official feed URL.
2. Deploy the Next service on ECS and any required changes to the separate RSSHub instance before testing ingestion.
3. Put business migrations in `deploy/postgres/migrations/` and apply them to production PostgreSQL on ECS through the release workflow. Local Docker checks supplement production validation. Supabase is used for Auth and private backup storage; `supabase/migrations/` and `supabase/cron/` are historical for business data.
4. Manually call the production `POST /cron/signals/:source` endpoint with the server-side `CRON_SECRET`.
5. Query production business PostgreSQL through the authenticated Next verification endpoint or authorized server operations and verify that the run succeeded, `source_status` was updated, at least one `hot_items` row was written, and the stored title, URL, source, section, rank, and publication time are plausible.
6. Only after all configured sources pass verification may a source's PostgreSQL Cron job be enabled. Confirm old writers and replaced ECS business timers are disabled; the job must use the server-side secret synchronized from protected runtime configuration.
7. Record non-secret evidence (HTTP status, item count, batch ID, timestamps, and data-quality checks) in the relevant development document. Never print or commit database URLs, tokens, Vault values, or Cron secrets.

`pnpm setup:cron --output <evidence-path>` validates every source configured in `deploy/server/business-jobs.json` against the deployed Next API and production business database. It emits acceptance evidence only after all sources pass and never enables jobs itself. `private.activate_business_jobs(jsonb)` additionally requires fresh complete evidence and confirmed old-writer shutdown before enabling jobs. CI/CD synchronizes SQL and job schedules on every release; new sources remain disabled pending acceptance.

## Pull requests

Do not create or merge pull requests through a website UI. When a pull request is required, prepare and push the branch, then tell the user which branch and base to use and ask them to create and merge it.
