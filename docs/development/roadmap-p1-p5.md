# P1–P5 completion work

## Background
Continue the approved SEO roadmap on the existing branch. Reuse the existing list UI, ISR and React Query decisions. User requests the AI timeline entry in the shared page header.

## Scope
P1 lifecycle safeguards; P2 published event timeline and detail; P3 event/news invalidation; P4 sitemap and robots; P5 event pagination and search cache.

## Out of scope
No automatic event summaries or fake events. No production deployment, push or merge. P6–P7 remain separate.

## Acceptance criteria
Stable event slugs, published-only reads, true removed-content responses before streaming, server-rendered first page, cursor pagination, source citations, canonical metadata and meaningful sitemap timestamps. Secrets remain server-only.

## Feasibility
Existing public Supabase reader and event schema support the pages. A versioned migration adds identifier-only tombstones and content update timestamps. It must be applied before deploying dependent code. P1 read-only cloud audit on 2026-09-07 found 2,208 articles, zero published events and 25 active Cron jobs. Full production ingestion gate remains incomplete; do not enable more jobs.

## Implementation
Use `/ai/events` and `/ai/events/[slug]`, with the entry in SiteShell header. Reuse SiteShell, ActionButton, semantic Tailwind tokens and React Query 5.102.8. Timeline emphasizes occurrence date, title and editorial summary with quiet borders, primary-color links and no animation. Desktop/mobile use the existing responsive shell. Empty state links back to AI news; failures preserve existing data and offer retry. UI Skills baseline-ui and interface-design were retrieved.

- Timeline orders by occurrence time and UUID, keeping the database timestamp precision in cursors. Publication snapshot excludes newly published events from an ongoing pagination session. Event edits during a session are reflected on refresh.
- Detail pages show platform labels, cited original articles and other published events sharing cited articles. JSON-LD is escaped before embedding. Archived/draft event bodies remain protected by existing RLS.
- `content-status.ts` caches the pre-stream status check with Next Data Cache, 2 hours for events and 6 for news. The installed Next 16.3.4 proxy adapter supplies the incremental cache used by `unstable_cache`; runtime behavior still needs production-mode verification. Protected notifications expire status tags and page caches together.
- Deletion statement trigger queues pg_net source notifications after commit, including existing retention jobs. Setup stores Web URL and notification secret in Vault only after the full source gate. Missing configuration or network failure keeps the database result and uses TTL fallback; asynchronous pg_net failures require operational follow-up.
- News summaries are noindex/follow because they provide only third-party metadata. Sitemap therefore contains the homepage, six sections, sources and published editorial events, not thin news detail pages. Static navigation URLs omit lastModified instead of inventing an update time; event timestamps change for actual content/source changes.
- Search now uses React Query with a separate keyword cache, 300 ms debounce, composition handling, cancellation and retained pagination. Existing article list page prefetch is allowed to complete after unmount rather than manually cancelling an inner query.

### Editorial publishing

After applying the lifecycle migration, prepare a local JSON file with `title`, a human-written `summary`, ISO `occurredAt`, and `articleIds` containing real AI article UUIDs. Run `pnpm --filter @rss-site/api publish:event <file>` using the existing server-only environment. No editor UI or automatic summarizer is introduced.

Omit `slug` for a new event; the command creates a readable slug with a stable short identifier and prints it. Include that returned slug to update an existing event; it never changes when the title changes. For archive use `{ "slug": "<existing-slug>", "status": "archived" }`. The transaction validates all cited AI articles, persists the event and links, then calls Web revalidation. If notification fails, use the returned slug when retrying or retry the protected endpoint; rerunning a new-event input without the slug would create another event.

### Production sequence still required

1. Apply pending `add_github_blog_source` and `complete_content_lifecycle` migrations to the linked cloud project before deploying dependent code. Neither migration has been applied in this task.
2. Configure `SITE_URL` to the confirmed public origin, and matching `REVALIDATE_SECRET` on Web/API plus `WEB_APP_URL` on API. No placeholders or credentials were written to real environment files.
3. Deploy API fixes, run the entire existing source gate, then install validated Cron schedules. Setup copies Web notification settings to `signal_web_url` and `signal_revalidate_secret` in Vault after source verification. GitHub Blog remains disabled until its separate production-source gate passes.
4. Deploy Web only when authorized; verify ISR/status-cache hits, post-publication invalidation, 404/410, hydration, pagination and responsive/keyboard states. Publish only genuine editorial events.
5. Submit the public sitemap once in Google Search Console and check its result. This account operation was not performed.

## Verification
User requested skipping tests; no test, type-check, build or browser verification. Cloud reads are inventory only, not ingestion acceptance. Production source validation requires deploying the API fixes first and running the full cloud gate; existing no-deploy instruction still applies.

Static review by a dedicated reviewer found and resolved uncached proxy status reads and missing retention invalidation. Follow-up review reported no remaining concrete blockers. This does not replace runtime acceptance. Biome formatting completed; no new tests were added or executed.

## Risks
Cloud has no published events; timeline remains empty until real curated events are published. SITE_URL and revalidation credentials must be configured for production. Search Console registration is an external step. Do not label P1–P5 fully accepted until deployment and runtime checks complete.
