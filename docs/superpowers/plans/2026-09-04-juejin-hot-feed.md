# Juejin Hot Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the “热点更新” homepage and Juejin technology feed backed by an idempotent Hono/Drizzle ingestion service and Supabase.

**Architecture:** A Hono Vercel function fetches and normalizes RSSHub, then replaces the current Juejin ranking in Supabase through Drizzle and a transaction-pooled postgres.js connection. Supabase Cron invokes that protected endpoint; the Next.js frontend reads only public RLS-protected tables through supabase-js.

**Tech Stack:** pnpm workspace, Node 24, Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Hono 4, Drizzle ORM 0.45, postgres.js 3, Supabase PostgreSQL 17, Vitest 5, Biome 2.

**Spec:** `docs/superpowers/specs/2026-09-03-juejin-hot-feed-design.md`

## Global Constraints

- Routes are `/` and `/technology/juejin`; do not add `/technology` yet.
- Use RSSHub `/juejin/trending/all/weekly` and treat its order as rank.
- Frontend never calls Hono; Hono never serves frontend read queries.
- Backend database access uses Drizzle ORM with postgres.js `prepare: false`.
- Browser receives only Supabase URL and publishable key; secrets stay server-side.
- Every exposed table has RLS; anonymous users can only select `hot_items` and `source_status`.
- Empty or invalid feeds never replace the last successful ranking.
- UI uses shadcn components with the confirmed signal-orange theme, not shadcn defaults.
- Dependencies are pinned exactly and the pnpm lockfile is committed.

---

### Task 1: Workspace and application shells

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.mjs`, `apps/web/biome.json`, `apps/web/vitest.config.ts`
- Create: `apps/web/components.json`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`
- Create: `apps/web/lib/utils.ts`, `apps/web/.env.example`
- Create: `server/api/package.json`, `server/api/tsconfig.json`, `server/api/biome.json`
- Create: `server/api/vitest.config.ts`, `server/api/vercel.json`, `server/api/.env.example`
- Modify: `package.json`, `turbo.json`

**Interfaces:**
- Produces `@/*` imports in both workspaces and root `test`, `lint`, `check-types`, and `build` commands.
- Produces Tailwind/shadcn semantic tokens shared by every web component.

- [ ] Add pinned workspace dependencies with `pnpm --filter` and `--save-exact`; generated shadcn code is the user-requested generated-code TDD exception.
- [ ] Configure Next App Router, Hono Vercel zero-config entry expectations, Biome, and Vitest.
- [ ] Define light/dark shadcn tokens: `#F7F9FC/#111827` backgrounds and `#E4572E/#FF785A` primary colors with `0.375rem` radius.
- [ ] Add only Button, Badge, Breadcrumb, Separator, Skeleton, and Tooltip from shadcn.
- [ ] Run `pnpm install`, `pnpm lint`, and `pnpm check-types`; expect exit 0 before application behavior is added.
- [ ] Commit as `chore: 初始化前后端工作区`.

### Task 2: Database schema, RLS, and scheduling assets

**Files:**
- Create: `server/api/src/db/schema.ts`
- Create: `supabase/migrations/<generated>_create_hot_feed_tables.sql`
- Create: `supabase/tests/hot_feed_rls.test.sql`
- Create: `supabase/cron/setup.sql`
- Create: `supabase/README.md`

**Interfaces:**
- Produces Drizzle tables `hotItems`, `sourceStatus`, and `ingestionRuns`.
- `hotItems` has unique `(source, sourceKey)` and index `(section, source, position)`.
- `sourceStatus.source` is the primary key; only `hotItems` and `sourceStatus` are publicly selectable.

- [ ] Use `pnpm dlx supabase --help` and `pnpm dlx supabase migration new create_hot_feed_tables` to create the migration rather than inventing a filename.
- [ ] Write pgTAP assertions first: anon/authenticated can select the two public tables, cannot insert/update/delete them, and cannot select `ingestion_runs`.
- [ ] Add the minimum SQL tables, constraints, indexes, grants, RLS, and `TO anon, authenticated` SELECT policies that satisfy those assertions.
- [ ] Mirror the migration in Drizzle `pgTable` declarations with inferred `HotItemInsert` and `SourceStatusInsert` types.
- [ ] Add an idempotent Cron setup script using `cron.schedule('juejin-hot-feed-every-five-hours', '0 */5 * * *', ...)`, `net.http_post`, and Vault secrets named `juejin_ingest_url` and `juejin_cron_secret`.
- [ ] Verify the migration with Supabase MCP SQL on project `pnjsrihfpyvkhyidzgfq`, list resulting tables, and run database advisors; do not activate Cron until its two Vault secrets exist.
- [ ] Commit as `feat(db): 添加热点数据模型与访问策略`.

### Task 3: RSSHub feed normalization

**Files:**
- Create: `server/api/src/juejin/feed.test.ts`
- Create: `server/api/src/juejin/feed.ts`
- Create: `server/api/src/juejin/fixtures/trending.xml`

**Interfaces:**
- Produces `parseJuejinFeed(xml: string): JuejinFeedItem[]`.
- `JuejinFeedItem` contains `sourceKey`, `title`, `url`, `summary`, `author`, `publishedAt`, and one-based `position`.

- [ ] RED: test a representative RSS fixture and assert literal normalized values, ordering, HTML-stripped summary, and nullable optional fields.
- [ ] Run `pnpm --filter @rss-site/api test src/juejin/feed.test.ts`; expect failure because `parseJuejinFeed` does not exist.
- [ ] GREEN: parse XML with fast-xml-parser, validate channel items, normalize the Juejin URL/guid, strip markup, and reject an empty feed.
- [ ] Add RED cases for malformed XML and missing title/link, then implement only the validation needed to pass.
- [ ] Run the focused tests and full API suite; expect all pass with no warnings.
- [ ] Commit as `feat(api): 解析并规范化掘金 rss`.

### Task 4: Drizzle persistence and ingestion workflow

**Files:**
- Create: `server/api/src/db/client.ts`
- Create: `server/api/src/juejin/store.ts`
- Create: `server/api/src/juejin/ingest.test.ts`
- Create: `server/api/src/juejin/ingest.ts`

**Interfaces:**
- Produces `createDatabase(databaseUrl: string)` using postgres.js with `prepare: false` and `max: 1`.
- Produces `ingestJuejin(deps, now): Promise<{ batchId: string; itemCount: number }>`.
- `deps` supplies `fetchFeed` and a `JuejinStore`; the production store uses Drizzle transactions.

- [ ] RED: use a stateful in-memory store to prove duplicate source keys converge, ranks update, and stale rows disappear only after a valid non-empty feed.
- [ ] Run the focused test and confirm the missing ingestion workflow is the failure cause.
- [ ] GREEN: implement the orchestration and Drizzle transaction with run creation, batched upsert, stale deletion, source status update, and success marking.
- [ ] RED: prove fetch/parse failures write a failed run without changing current items; add the minimum failure path.
- [ ] Run focused and full API tests; expect all pass.
- [ ] Commit as `feat(api): 使用 drizzle 同步当前热点榜单`.

### Task 5: Protected Hono endpoints

**Files:**
- Create: `server/api/src/app.test.ts`
- Create: `server/api/src/app.ts`
- Create: `server/api/index.ts`

**Interfaces:**
- Produces `createApp(deps)` for tests and a default production Hono export for Vercel.
- `GET /health` returns `{ status: 'ok' }`.
- `POST /cron/juejin` requires `Authorization: Bearer ${CRON_SECRET}` and returns the batch count.

- [ ] RED: verify health response, 401 for missing/wrong credentials, 200 for a successful ingest, and 502 for upstream failure.
- [ ] Run focused tests and confirm route behavior is absent.
- [ ] GREEN: implement constant-time-equivalent exact bearer comparison, timeout-controlled RSSHub fetch, injected dependencies, and JSON responses.
- [ ] Run focused tests, full API suite, typecheck, and API build.
- [ ] Commit as `feat(api): 提供受保护的掘金采集端点`.

### Task 6: Supabase read model and shared feed UI

**Files:**
- Create: `apps/web/lib/supabase.ts`
- Create: `apps/web/lib/hot-feed.ts`, `apps/web/lib/hot-feed.test.ts`
- Create: `apps/web/components/theme-provider.tsx`, `apps/web/components/theme-toggle.tsx`
- Create: `apps/web/components/site-shell.tsx`
- Create: `apps/web/components/hot-list.tsx`, `apps/web/components/hot-list.test.tsx`
- Create: `apps/web/components/feed-state.tsx`

**Interfaces:**
- Produces `getJuejinFeed(limit?: number): Promise<FeedResult>` ordered by position.
- `FeedResult` is `{ state: 'ready'; items; status } | { state: 'empty' } | { state: 'error' }`.
- Produces reusable `HotList`, `FeedEmpty`, and `FeedError` server components.

- [ ] RED: test mapping of Supabase rows to feed results, the five-item limit, and explicit empty/error outcomes with injected query functions.
- [ ] GREEN: add the public Supabase client and read model without service credentials.
- [ ] RED: render `HotList` with React DOM server rendering and assert ranks, safe external links, readable summaries, and truncation only on short metadata.
- [ ] GREEN: implement the editorial list, shell, theme provider/toggle, and state components using the selected shadcn primitives.
- [ ] Run focused and full web tests; expect all pass.
- [ ] Commit as `feat(web): 添加热点列表与主题基础组件`.

### Task 7: Homepage and Juejin route

**Files:**
- Create: `apps/web/app/page.tsx`, `apps/web/app/page.test.tsx`, `apps/web/app/loading.tsx`
- Create: `apps/web/app/technology/juejin/page.tsx`
- Create: `apps/web/app/technology/juejin/page.test.tsx`
- Create: `apps/web/app/technology/juejin/loading.tsx`
- Create: `apps/web/app/error.tsx`, `apps/web/app/not-found.tsx`

**Interfaces:**
- `/` requests five items and renders the technology/Juejin preview.
- `/technology/juejin` requests the complete current feed and renders breadcrumb plus full ranking.

- [ ] RED: render each page with injected feed results and prove the homepage caps at five while the child route exposes the complete ordered set and breadcrumb.
- [ ] GREEN: implement both routes, metadata, acquisition rhythm, source status, and navigation using the confirmed Chinese copy.
- [ ] Add layout-faithful Skeleton loading routes and clear empty/error states.
- [ ] Run web tests, lint, typecheck, and production build.
- [ ] Inspect light/dark screenshots at 390px and 1440px; fix overflow, hierarchy, focus, wrapping, and contrast defects.
- [ ] Commit as `feat(web): 实现热点首页与掘金榜单页`.

### Task 8: End-to-end verification, review, and delivery

**Files:**
- Modify: `README.md`
- Modify: `docs/development/juejin-hot-feed.md`
- Modify: `HERMES.md`
- Create only if reviews produce accepted non-blockers: `docs/roadmaps/juejin-hot-feed.md`

**Interfaces:**
- Documents local setup, Supabase/Vercel variables, migration, Vault secrets, Cron activation, and deployment roots.

- [ ] Document exact commands and required variables without recording secret values.
- [ ] Run `pnpm lint`, `pnpm check-types`, `pnpm test`, and `pnpm build`; record fresh outputs in the development document.
- [ ] Query Supabase tables/policies, run advisors, and exercise one protected ingestion request when deployment/environment credentials permit.
- [ ] Review the diff against repository standards and the design spec; resolve every blocking finding and rerun affected checks.
- [ ] Record accepted follow-ups in a roadmap only if reviews produce any; otherwise state that no roadmap is required.
- [ ] Commit final documentation, push `feat/juejin-hot-feed`, open a GitHub PR, inspect CI, and update HERMES with the PR state.

