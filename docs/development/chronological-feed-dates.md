# Feed time ordering and visible years

## Background

RSS and homepage data were assembled in source or platform-rank order. As a result, an older article could appear before a newer article when entries came from different sources, and source pages rendered dates without a year.

## Scope

- Order dated articles newest first in each source feed, homepage section, and generated section RSS feed.
- Place entries without a publication time after dated entries while retaining their existing rank or source order.
- Include the four-digit year in source-list dates.
- Keep the existing source registry, database schema, ingestion jobs, and ranking data unchanged.

## Acceptance criteria

- A newer publication time appears before an older publication time even when its platform or rank comes later.
- Entries without a publication time remain visible after dated entries.
- Equal or missing times keep deterministic existing order.
- Source-page dates include the year.
- Existing feed, page, type, and production-build checks pass.

## Feasibility and design

The stored rows already contain `published_at`, so this change needs no migration or ingestion change. A shared comparator converts valid publication dates to descending order. Source feed construction uses position as the tie-breaker; homepage and RSS arrays rely on the stable sort to retain registry order for equal or absent dates.

This changes presentation order only. Platform rank remains available on each item and remains the fallback for undated items.

## Regression loop

Tests were added before the implementation for all affected seams:

- a source feed whose second-ranked item is newer;
- a section RSS feed with cross-source dates and an undated item;
- a homepage section whose later source contains the newer article;
- a source list that must render `2026/09/04`.

All four cases failed against the previous position/source-order implementation. The correct cause was ordering during feed and page assembly, plus the missing `year` formatter option; parsing and timezone conversion were not the cause.

## Verification

- Targeted regression tests: 20 passed.
- Full Web test suite: 27 files and 70 tests passed.
- TypeScript `tsc --noEmit` passed.
- Next.js 16.3.4 production build completed and generated all 39 static pages.
- Changed TypeScript and TSX files pass Biome formatting and checks. The repository-wide lint command still reports 49 existing CRLF-only formatting diagnostics in untouched files; changing their line endings is outside this fix.
- Local `/news/xinhua` browser verification showed year-bearing dates in descending order (`2026/09/06 18:50`, `18:41`, `18:40`, and so on) with no console errors.
- Local `/feeds/news.xml` contained 60 entries: all 44 dated entries were descending, followed by all 16 undated entries, with no dated item after the first undated item.

## Review

The final standards and specification review found no blocking issue. The shared comparator is limited to the three assembly points that need chronological presentation, retains deterministic fallbacks, and is covered at the source-feed, homepage, RSS, and rendered-date boundaries. No follow-up roadmap item is required.
