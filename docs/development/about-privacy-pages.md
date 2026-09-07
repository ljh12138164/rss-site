# About, privacy, and outbound navigation

## Background

The user requested About and privacy pages and clarified that clicking “继续访问” should navigate in the current tab. The departure notice remains. Development continues on `feat/section-rss-feeds` per the user's explicit instruction and the existing Hermes delivery constraints.

## Scope

- Add `/about` and `/privacy`, accessible from the shared footer.
- Keep `/out` manual confirmation and navigate to its validated destination in the current tab.
- Reuse the site's existing visual language and responsive light/dark themes.

## Out of scope

- Global palette or typography changes, new UI dependencies, automatic redirects or countdowns.
- Ingestion, database, deployment, and changes to existing source navigation.

## Acceptance criteria

- Both information pages render with useful Chinese copy, page metadata, shared navigation and footer links.
- Privacy copy reflects current theme storage and search requests without inventing retention periods, contact details, or compliance promises.
- Continue follows the verified external URL in the current tab; invalid URLs retain the existing recovery path.
- Relevant tests, type checks, production build, changed-file formatting, and desktop/mobile light/dark checks pass.

## Feasibility

Feasible with the existing Next.js 16.3.4 App Router, React 19.2.8, Tailwind CSS 4.3.3, and React Aria Components 1.17.0. Read the installed Next.js layouts/pages guide. Static server-rendered information pages need no new data fetching. Removing `target="_blank"` from the native continue anchor is sufficient; an additional redirect endpoint or client script adds no value to the confirmed behavior.

Privacy evidence: `ThemeProvider` uses next-themes, the search panel submits keywords and pagination to `/api/search`, and the endpoint reads public articles without storing a user search-history record. No analytics integration or account UI appears in the current Web source. Hosting log retention is not established by this change, so the copy must not claim logs are absent or promise a retention period.

## Implementation

The user confirmed the two pages, existing project styling, and click-triggered same-tab navigation. Reuse the existing SiteShell, semantic theme tokens, system sans body font, mono utility font, primary-colored heading marker, and bounded content width. Preserve global palette definitions. The new pages use a title/intro followed by readable sections; their primary exit is the existing home/section navigation. Static content requires no custom loading or error state. Scope includes desktop, 390px mobile, keyboard focus, and both themes.

UI Skills `dammyjay93/interface-design` and `ibelick/baseline-ui` were loaded, alongside the requested frontend-design guidance. The existing accepted site direction is sufficient; no new design system is introduced.

## Verification

- Updated the existing outbound regression assertion before implementation: it failed on the old `_blank` attribute, then passed after its removal. All 29 Web test files / 77 tests pass.
- `pnpm check-types` passes for both workspaces (API cached; Web freshly checked).
- `pnpm --filter @rss-site/web build` passes; `/about` and `/privacy` are prerendered, with 41 static pages generated overall.
- Biome checks pass for all six changed/new TypeScript files after normalizing the three existing edited files to the required LF format.
- Browser screenshots reviewed at 1280 × 900 and 390 × 844 in light/dark themes. Information headings, paragraphs, and footer links remain readable; mobile document width is 375px within the 390px viewport (the difference is the scrollbar), with no horizontal overflow. The privacy footer link successfully loads `/privacy`; page titles are correct. No browser console errors were recorded on the information pages.
- Clicking the supplied GitHub destination's continue link navigated the same browser tab (`1`, unchanged provider tab ID) to `https://github.com/tt-a1i/archify`, with the repository title visible in the tab inventory and no additional in-app tab. The initial post-click accessibility capture timed out; a fresh tab inventory confirmed navigation succeeded. Temporary viewport overrides were reset.

## Review

Reviewed the complete changed/new source against repository conventions and the acceptance criteria. The shared information frame has two actual consumers, uses existing tokens, and adds no client state or dependencies. The native outbound anchor retains protocol validation and its existing referrer policy; only its new-tab target was removed. No blocking finding or accepted follow-up remains, so no empty roadmap is created. Changes stay on the existing branch without push, PR, merge, or deployment under the ongoing delivery constraints.

## Risks

Privacy wording must be revisited if authentication, analytics, or data handling changes. This page describes current behavior and does not assert legal certification.
