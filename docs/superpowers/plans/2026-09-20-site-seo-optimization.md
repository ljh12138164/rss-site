# Site SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve crawl efficiency, search snippets, structured data, AI crawler guidance, and security headers for `https://news.ljhboard.cn/` without changing the visible UI or inventing publisher facts.

**Architecture:** Centralize page metadata and JSON-LD builders in one server-safe SEO module, then reuse them from the homepage, section/source listings, and article readers. Keep sitemap generation database-backed, but split it into smaller cached chunks and use the existing `content_updated_at` field as the modification signal. Expose a small dynamic `llms.txt` route so URLs follow `SITE_URL` in every environment.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Vitest 5, Supabase.

**Spec:** `docs/development/site-seo-optimization.md`

## Global Constraints

- Preserve all pre-existing uncommitted UI work on `feat/ui-update`.
- Do not claim or encode an operator, legal entity, author, publisher, image, or social profile that the repository cannot verify.
- Do not use a raw word-count threshold to index or exclude articles.
- Keep critical metadata and JSON-LD in server-rendered HTML.
- Keep every code change covered by a failing regression test before implementation.

---

### Task 1: Shared metadata and structured-data builders

**Files:**
- Create: `apps/web/lib/seo.ts`
- Create: `apps/web/lib/seo.test.ts`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/(home)/page.tsx`

**Interfaces:**
- Produces: `createPageMetadata`, `createHomepageStructuredData`, `createArticleStructuredData`, `serializeStructuredData`, and `toMetaDescription`.

- [ ] **Step 1: Write failing tests** for canonical/Open Graph/Twitter output, sentence-safe description truncation, the homepage WebSite/CollectionPage graph, and article/breadcrumb provenance.
- [ ] **Step 2: Run the focused test** and verify failure because the SEO module does not exist.
- [ ] **Step 3: Implement the minimal helpers** and render homepage JSON-LD from the current homepage server component.
- [ ] **Step 4: Update root metadata** with `metadataBase`, a descriptive default title/description, application name, category, and crawler directives.
- [ ] **Step 5: Run the focused tests** and verify they pass.

### Task 2: Page and article metadata coverage

**Files:**
- Modify: `apps/web/app/{ai,technology,news,social,finance,games}/page.tsx`
- Modify: `apps/web/app/{ai,technology,news,social,finance,games}/[source]/page.tsx`
- Modify: `apps/web/components/article-reader.tsx`
- Modify: `apps/web/lib/signal-article.ts`
- Modify: `apps/web/app/news/[source]/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: shared SEO helpers from Task 1.
- Produces: page-specific canonical/OG/Twitter tags and server-rendered Article/BreadcrumbList JSON-LD.

- [ ] **Step 1: Extend the article view test** to require valid Article and BreadcrumbList JSON-LD with the direct source URL and true content modification time.
- [ ] **Step 2: Run the focused article test** and verify the schema assertion fails.
- [ ] **Step 3: Map `content_updated_at`** from Supabase rows into `SignalArticle.contentUpdatedAt`.
- [ ] **Step 4: Render article JSON-LD** and use sentence-safe metadata descriptions.
- [ ] **Step 5: Replace section/source metadata literals** with `createPageMetadata` so each listing gets correct canonical, Open Graph, and Twitter values.
- [ ] **Step 6: Run focused metadata/article tests** and verify they pass.

### Task 3: Fast, complete sitemap output

**Files:**
- Modify: `apps/web/lib/sitemap-service.ts`
- Modify: `apps/web/app/sitemap.xml/route.ts`
- Modify: `apps/web/app/sitemap/[id]/route.ts`
- Modify: `apps/web/app/sitemap.test.ts`

**Interfaces:**
- Produces: 5,000-URL sitemap chunks, `/mcp` coverage, CDN caching, and `content_updated_at` lastmod values.

- [ ] **Step 1: Add failing sitemap tests** for 5,000-entry splitting, `/mcp`, `content_updated_at` lastmod, and CDN cache headers.
- [ ] **Step 2: Run sitemap tests** and verify the new expectations fail.
- [ ] **Step 3: Implement the minimal sitemap changes** without altering canonical URL generation.
- [ ] **Step 4: Run sitemap tests** and verify they pass.

### Task 4: AI crawler guidance and security headers

**Files:**
- Create: `apps/web/app/llms.txt/route.ts`
- Create: `apps/web/app/llms.txt/route.test.ts`
- Modify: `apps/web/next.config.ts`
- Create: `apps/web/next.config.test.ts`

**Interfaces:**
- Produces: `GET /llms.txt` and site-wide baseline response headers.

- [ ] **Step 1: Write failing route/header tests** for absolute section and RSS links, no-store behavior without `SITE_URL`, and `nosniff`, referrer, frame, and permissions policies.
- [ ] **Step 2: Run focused tests** and verify the route/config expectations fail.
- [ ] **Step 3: Implement `llms.txt`** using `SITE_URL` and add baseline headers without adding a brittle CSP.
- [ ] **Step 4: Run focused tests** and verify they pass.

### Task 5: Verification and audit artifacts

**Files:**
- Modify: `docs/development/site-seo-optimization.md`
- Create: `docs/roadmaps/site-seo-optimization.md`
- Create (ignored): `.seo-cache/site-meta.json`
- Create (ignored): `.seo-cache/audit-scores.json`

- [ ] **Step 1: Run modified-scope Vitest tests**, then the full Web test suite.
- [ ] **Step 2: Run Web type checking and Biome** for changed code.
- [ ] **Step 3: Run a production Web build with `SITE_URL=https://news.ljhboard.cn`**.
- [ ] **Step 4: Review the final diff** against this plan and record accepted follow-ups.
- [ ] **Step 5: Write SEO cache summaries** and update the development/roadmap documents with evidence and limitations.
