# About page content-flow summary

## Background

The user requested a small explanation of the site's operating principle using Archify on `/about`. Continue on `feat/section-rss-feeds` with the already accepted site design and local-only delivery.

## Scope

- Add a compact four-step summary to About: public content, periodic collection, saved articles, reading/subscription.
- Link to a self-contained Archify workflow diagram at `/diagrams/content-flow.html`.

## Out of scope

No ingestion changes, new dependencies, automatic animation, global styling changes, or deployment.

## Acceptance criteria

The summary stays short, uses the site's semantic color tokens, stacks on mobile, and links to a diagram grounded in existing code. Both reading and RSS branch from saved content.

## Feasibility

Existing `server/api/src/technology/sources.ts` resolves official feeds or RSSHub routes; `ingest.ts` parses and saves items. Web pages, search, and RSS read saved content. A static HTML artifact is sufficient. Its approximately 704KB viewer is loaded only when the reader follows the link, rather than embedded into About or the app bundle.

## Implementation

The page uses a semantic ordered list with four steps and decorative Lucide arrows: horizontal at `sm` and above, vertical below. No extra client state. The Archify specification lives in `docs/diagrams/content-flow.workflow.json`; the generated HTML is an immutable deliver output. Reused the existing SiteShell, InformationPage, typography, and theme tokens.

Biome excludes only this exact generated HTML path. Its bundled viewer triggers vendor-code lint diagnostics and autoformatting would invalidate the artifact receipt. The staged original artifact was restored after the initial hook attempt; page source and JSON specification remain checked. No hooks are bypassed.

## Verification

- Web production build and its TypeScript check passed, with 41 static pages generated.
- Biome check passes for the edited page and final specification.
- About inspected at desktop and 390px mobile: readable steps, no horizontal overflow (375px document inside 390px viewport).
- Clicked “查看原理图” in the local browser and reached the generated HTML with the expected diagram title.
- Archify structural validation and atomic delivery passed 9/9 showcase checks, with zero errors and warnings.
- Correction round 1 removed a redundant lane to fix desktop vertical overflow. Round 2 replaced misleading renderer-owned generic legend wording with the actual roles (collection, storage, reading, public sources).
- The packaged automated browser check passed before the legend-only correction. The final artifact's automated check failed twice with `Page.loadEventFired` timeout; this remains `browser_evidence: failed`, not a pass inferred from earlier output.
- Supplementary manual inspection of the final served artifact passed at 1440×900, 1600×1000, 1920×1080, and 2048×1320: document width/height equal each viewport. Inspected both themes at the endpoint sizes; labels and relationships remain readable. This supports `visual_review: passed` independently of the automated runtime failure. Temporary viewport override was reset.

## Artifact receipt

- diagram_type: workflow
- output: `apps/web/public/diagrams/content-flow.html`
- specification_sha256: `3534c19cc99450cb30fcace05b985a38c6a44030d760c2c60db5a605934b68b6`
- specification_bytes: 2040
- artifact_sha256: `fd1c63a1055de9d7f54c26f4fce3f6305c85786ac5bceafd8283e33479b35516`
- artifact_bytes: 704567
- validation: 9/9 showcase, 0 errors, 0 warnings
- browser_evidence: failed (packaged Chrome load-event timeout)
- visual_review: passed (supplementary browser inspection)
- correction_rounds: 2

## Review and risks

No blocking source or content finding remains. The diagram describes existing behavior, not an AI content-analysis pipeline. Generated viewer features are provided by Archify; no site dependency was added. Its bundled viewer is not certified against the site's source lint or accessibility rules; the semantic text summary on About remains the primary explanation. Automated screenshot capture remains an environment limitation, recorded separately from the completed visual inspection. No product follow-up roadmap is required.
