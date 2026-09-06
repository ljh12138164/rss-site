# Compact outbound page

## Background

The outbound interstitial used the full site shell, navigation, footer, large warning typography, a long disclaimer, hostname-only destination text, and two actions. The user requested a compact page based on Juejin's departure screen, containing only the brand, a short safety notice, the full destination URL, and a continue button.

## Scope

- Give `/out` a dedicated, quiet full-page layout without the global navigation and footer.
- Show the AI 热榜 mark, one safety sentence, the complete verified URL, and one continue action.
- Retain the existing URL allow-list validation, external-link attributes, and blocked-link return path.
- Make the card responsive and compatible with the existing light and dark color tokens.

## Out of scope

- No automatic countdown or redirect.
- No changes to outbound URL validation, source links, analytics, or deployment.
- No new UI dependency or image asset.

## Acceptance criteria

- A valid URL page contains exactly one link: the external destination.
- The full destination is visible and can wrap on narrow screens.
- The previous long disclaimer, target label, back action, navigation, and footer are absent.
- An invalid URL still has no external action and can return to its originating section.
- Tests, types, production build, and desktop/mobile visual checks pass.

## Implementation

`OutboundFrame` provides a restrained gray canvas, a small AI 热榜 brand mark, and a bordered card. Valid destinations render the concise warning, full URL, divider, and right-aligned primary button. Invalid destinations reuse the same layout and retain the existing safe return action.

## Verification

- The focused outbound-page regression test failed against the previous multi-section layout and passed after the redesign.
- All 27 Web test files and 68 tests passed.
- TypeScript `tsc --noEmit` and the Next.js 16.3.4 production build passed; the build generated all 39 static pages.
- The changed page and test pass Biome checks.
- Desktop browser review confirmed the reference-like gray canvas, compact brand row, bordered white card, full URL, divider, and single right-aligned action.
- A 390 × 844 mobile review showed one link, no horizontal overflow (`scrollWidth` equals the 390px viewport), a wrapping heading, and a readable target URL.
- Browser console review found no errors.

## Review

The final standards and specification review found no blocking issue. The valid state now contains only the requested content, while the invalid state preserves the minimum recovery action required after URL validation rejects a destination. No roadmap follow-up is required.
