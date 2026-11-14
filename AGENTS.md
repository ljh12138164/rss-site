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

`pnpm setup:cron --output <evidence-path>` validates every source configured in `deploy/server/business-jobs.json` against the deployed Next API and production business database. It emits acceptance evidence only after all sources pass and never enables jobs itself. `private.activate_business_jobs(jsonb)` additionally requires fresh complete evidence and confirmed old-writer shutdown before enabling jobs. CI/CD synchronizes SQL and job schedules on every release; new sources remain disabled pending acceptance. When operating ECS through `alibabacloud-workbench-cli` on Windows, always pass `--output json` (avoid interactive pipe errors), pass remote bash scripts via Base64 with `</dev/null` on `docker compose exec -T`, and always finish with `workbench session close --all` and `workbench daemon stop` so leaked idle sessions do not hit `Forbidden.SessionLimit`.

## RSSHub route changes

When developing or updating routes in the companion `RSSHub` repository, always branch from `upstream/master` (`DIYgod/RSSHub`), test real routes locally, run repository and CI checks (`build:docs`, `eslint`, `typecheck`, `pnpm exec oxfmt --check lib/routes/<namespace>`, `pnpm exec oxlint --type-aware --config=.oxlintrc.ci.json --deny-warnings lib/routes/<namespace>`, and `uvx --from lizard lizard -l typescript -C 10 -w lib/routes/<namespace>`), and strictly follow upstream `AGENTS.md` and `.github/prompts/pr_review_rules.md`:

- **CI `anti-slop/*` type rules (`.oxlintrc.ci.json`)**: CI runs stricter rules with `respectEslintDisableDirectives: false`. Do not widen lookup tables or return shapes with `Record<string, ...>` or explicit anonymous object return types (keep inference or use `as const` / `as const satisfies`), and do not declare `unknown` / `Record<string, unknown>` parameters (use typed API contracts or narrow boundary type guards).
- **JSX description templates & minimal file layout**: Render custom/complex HTML, media wrappers, or fallback descriptions with `lib/routes/<namespace>/templates/description.tsx` and `renderToString` from `hono/jsx/dom/server` instead of template-string HTML assembly, Cheerio HTML construction, or hand-written `escapeHtml`. Do not re-implement `lib/middleware/parameter.ts` features (such as relative URL completion or `referrerpolicy`). Do not add `types.ts` or unnecessary file splits for a single route (only keep a small `utils.ts` when shared with JSX templates), and never commit test files under `lib/routes/`.
- **CodeFactor complexity & CodeQL URL safety**: Keep every function and lambda at cyclomatic complexity `<= 10` (`lizard -C 10 -w`) by extracting top-level helpers and dispatch tables. When checking allowed embed/asset hosts, parse with `new URL()`, allow only safe protocols (`http:` / `https:` / `mailto:`), and match `hostname === domain || hostname.endsWith('.' + domain)` instead of `.includes()` substring matching.
- **No title trimming**: Do not call `.trim()` or manually truncate `title` (`RSSHub` core handles title processing in `lib/middleware/parameter.ts`). If decoding entities or stripping invisible characters, avoid `.trim()` on `title`.
- **Do not bypass empty checks**: Never add `allowEmpty: true` on normal or parameterized routes to mask empty feeds; allow RSSHub core to surface empty-route errors when an upstream returns zero items.
- **Metadata, multi-CMS & full live content audit**: Use an `example` starting with `/`, avoid repeating namespace name in route `name`, keep a single entry in `categories`, omit `https://` in `namespace.url` and `radar[].source`, match `radar[].target` to the route path, keep `parameters` limited to real path parameters (e.g., optional `:lang?` defaulting to English), use `cache.tryGet()` for detail fetches in loops, use `parseDate()` without `new Date()` fallbacks, keep item `link` values unique, and use the common `limit` parameter instead of custom pagination or query filtering. Always inspect `?limit=100` against live upstream pages across all CMS backends and language variants to ensure no silent loss of math (`LaTeX`/`MathML`), FAQs, tables, code blocks, `<audio>`/`<video>` embeds, or duplicated `title`/`H1`/metadata in `description`, and clean Windows CRLF noise (`git diff --ignore-all-space`) before committing.
- **Upstream PR boundary**: Do not open pull requests against `DIYgod/RSSHub` directly from tools; provide verified EN/ZH PR copy so the user can review and submit upstream.

## Pull requests

Do not create or merge pull requests through a website UI, and do not auto-merge pull requests. When a pull request is required, prepare, verify, and push the branch, check for an existing open PR for that branch, and create the pull request targeting `master` via the `gh` CLI (`gh pr create`). Then share the created PR URL, branch, and base with the user so they can review CI and merge it.
