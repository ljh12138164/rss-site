# Summary streaming

## Background

The user requested progressive article and Skill summaries, no model thinking, correct Redis caching and PR delivery across rss-site and ai-base.

## Scope

Opt-in streaming through the existing Hono summary routes and existing ArticleSummary cards. Keep JSON callers compatible and keep the current IndexedDB cache.

## Out of scope

New pages, visual redesign, UI libraries, server deployment, cache flushing and database/schema changes.

## Acceptance criteria

- Render partial overview and key points before generation finishes, without showing JSON syntax or model thinking.
- Reset draft content when ai-base falls back; show retryable failures without presenting or caching incomplete summaries as successful.
- Only a validated done event followed by clean EOF may be written to IndexedDB. Cached complete summaries restore immediately without inference.
- Propagate browser cancellation through the Web proxy and cancel generation on unmount. Bound stream parsing and handle split UTF-8/newline boundaries.
- Preserve ID-only requests, server-only credentials, HTTP validation/errors, manual generation, collapse/expand, and article/Skill isolation.

## Feasibility

Feasible against fetched master e7603f9 in a clean worktree, preserving the user's unrelated untracked documents in D:/code/rss-site. Reuse Next 16.3.4/Hono 4.13.5 native Response streams, React 19.2.8, React Aria ActionButton 1.17.0, Tailwind 4.3.3, lucide-react 1.40.0 and idb 8.0.4. Read installed Next route-handler docs. Host nginx already disables proxy buffering. No dependencies or infrastructure changes are needed.

Reuse the accepted embedded-card design in docs/development/summary-folo-ui.md and skills-detail-page.md. The user explicitly requested streaming on these surfaces; no new route, surface, design direction or responsive decision is introduced. UI Skills interface-design and baseline-ui were read completely. Working brief: RSS/Skill readers scan the overview then key points before opening full source; retain the primary accent, muted background and existing border/single-surface hierarchy, inherited 14px body/12px notes, 4px spacing and 16/20px padding. Desktop/mobile, light/dark, waiting/draft/fallback/error/completed/cached states remain in scope. No motion is added.

## Implementation

The existing summary routes opt into ai-base's NDJSON protocol through Accept: application/x-ndjson, passing the Web response body through without buffering and preserving no-store, cancellation and server-only credentials. Existing JSON consumers keep their original response shape and status mapping. Hono client init headers explicitly retain Content-Type: application/json alongside Accept; browser integration exposed that init headers replace the client's generated headers.

The card displays provisional overview/key points, resets them on fallback, clears them on failure and aborts the request on unmount. The bounded incremental UTF-8/NDJSON reader rejects malformed/truncated streams, errors after done and invalid final schemas. Only validated done plus clean EOF resolves to a result eligible for IndexedDB; current cache keys, TTL and restore/collapse behavior remain unchanged. Backend Redis likewise stores only final validated results. Cloudflare fallback currently clears the Gemma draft and returns a complete validated result, without token-level fallback progress.

## Verification

- Web suite: 329 tests pass. New tests cover split UTF-8, early progress, clean EOF, malformed/truncated/late-error streams, reader cancellation, article/Skill proxy streaming, ID-only validation, response cancellation, draft rendering, final-only browser caching, retry, cache restore and unmount cancellation. Affected component tests pass again after the request-header fix.
- Type check and Biome on all seven changed source/test files pass. Whole-repository Biome reports existing SVG title errors in public/article-cover-default.svg and public/source-icons/geekpark.svg plus existing warnings; neither SVG is modified.
- Actual browser on a temporary local Next page and streamed mock agent confirmed progress during an open request, completed IndexedDB restore after reload, collapse/expand, failure clearing/retry and light/dark 390px-wide card rendering. [QA screenshot](assets/summary-streaming-qa.png). This is an isolated fixture of the real component, not a production article/Skill route or a mobile device emulation. Temporary preview route and mock server were removed and processes stopped.
- Standards review: reuse existing layout/tokens/ActionButton, no dependencies, no unrelated cleanup or schema changes. Spec review: streaming and final-only caching work across both routes; failure/cancellation and compatibility are covered. No blocking findings or accepted follow-ups; no new roadmap is needed.

The default production build passes with all 62 pages, early hints and service worker generation. It uses separately installed frozen-lockfile dependencies in the worktree and a temporary local empty Supabase fixture; no production database/server requests are required. The fixture was removed and stopped after the build. Production inference/Redis and deployed buffering are not revalidated by this PR.

## Risks

Deploy the matching ai-base backend first; old JSON clients remain supported. Streaming does not eliminate model first-byte latency. Partial content is provisional and never persisted. Existing cache keys/TTL are preserved because the final schema and summary semantics are unchanged.
