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

## RSSHub route changes

When developing or updating routes in the companion `RSSHub` repository, always branch from `upstream/master` (`DIYgod/RSSHub`), test real routes locally, run repository checks (`build:docs`, `eslint`, `typecheck`, `format:check` / scoped `oxlint` & `oxfmt`), and strictly follow upstream `AGENTS.md` and `.github/prompts/pr_review_rules.md`:

- **No title trimming**: Do not call `.trim()` or manually truncate `title` (`RSSHub` core handles title processing in `lib/middleware/parameter.ts`). If decoding entities or stripping invisible characters, avoid `.trim()` on `title`.
- **Do not bypass empty checks**: Never add `allowEmpty: true` on normal or parameterized routes to mask empty feeds; allow RSSHub core to surface empty-route errors when an upstream returns zero items.
- **Metadata and feed hygiene**: Use an `example` starting with `/`, avoid repeating namespace name in route `name`, keep a single entry in `categories`, omit `https://` in `namespace.url` and `radar[].source`, match `radar[].target` to the route path, keep `parameters` limited to real path parameters, use `cache.tryGet()` for detail fetches in loops, use `parseDate()` without `new Date()` fallbacks, keep item `link` values unique, and use the common `limit` parameter instead of custom pagination or query filtering.
- **Upstream PR boundary**: Do not open pull requests against `DIYgod/RSSHub` directly from tools; provide verified EN/ZH PR copy so the user can review and submit upstream.

## Pull requests

Do not create or merge pull requests through a website UI, and do not auto-merge pull requests. When a pull request is required, prepare, verify, and push the branch, check for an existing open PR for that branch, and create the pull request targeting `master` via the `gh` CLI (`gh pr create`). Then share the created PR URL, branch, and base with the user so they can review CI and merge it.
