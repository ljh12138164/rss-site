---
version: 1
slug: "apps-web-app-page-tsx"
primary_target: "apps/web/app/page.tsx"
related_targets: ["apps/web/app/latest/page.tsx","apps/web/components/site-shell.tsx","apps/web/components/site-header.tsx"]
---

## Direction contract

- **THESIS**: Ground `今日热点` in a Midnight Blue Enamel Transit Hub (`午夜搪瓷线网中枢`): an architectural station-board navigator where 49+ public feeds operate like 6 color-coded urban rail lines anchored by a vertical interchange spine and hollow/filled station nodes.
- **OWN-WORLD**: Midnight Blue Enamel dark default (`#0B1224` canvas, `#091020` rail, `#111B33` cards, `#14203B` popover, porcelain `#F8FAFC` ink, `#10B981` emerald primary) paired with Light Porcelain Tile (`#EEF2F7` canvas, `#F8FAFD` rail, `#FFFFFF` cards, `#0B1224` ink, `#1E5BFF` primary). Six line tokens govern rail dots, interchange hubs, and bottom bars (`AI #10B981/#059669`, `科技 #3B82F6/#1E5BFF`, `新闻 #FFC20E/#B45309`, `社交 #EC4899/#DB2777`, `财经 #A78BFA/#6D28D9`, `游戏 #FB7185/#E11D48`).
- **STORY**: No marketing brochure or abstract SaaS chrome. On first paint, readers land directly on live cross-source hotspots along a vertical transit spine alongside 6 section cards and slim `今日日报` / `模型评测` panels, with `⌘K` search, reading list, RSS, and theme switching in a compact top bar (no login/avatar chrome).
- **FIRST VIEWPORT**: Desktop (`1440x900`) presents a sticky `216px` left transit rail, a sticky `56px` (`h-14`) topbar, and a two-column workspace (`minmax(0,1fr)_300px`). Mobile (`390x844`) simplifies to a compact header, horizontally scrollable 6-line chips (`overflow-y-hidden`), single-column feed, fixed bottom 4-tab transit bar, and slide-out drawer.
- **FORM**: Structural hairlines over heavy drop shadows, crisp `rounded-sm` surfaces (`--radius: 0.25rem`) kept unclipped on interactive `<button>`/`<a>` elements so `:focus-visible` 2px outlines never clip, bold `2px`/`3px` bottom/left active indicator bars, tabular monospace numerals (`tabular-nums`), and conditional right thumbnails rendered only when `imageUrl` is present.
- **FINISH**: Accessible `2px` high-contrast focus outlines (`#10B981`/`#1E5BFF`), single-line `truncate` on constrained nav items, `prefers-reduced-motion` support, semantic `<main>`/`<nav>`/`<article>` landmarks without nested `<main>`, and concise `/humanizer-zh` copy with zero filler descriptions or English decorative eyebrows.
