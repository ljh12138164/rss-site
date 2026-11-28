# SEO/GEO 全栈优化与日报分享工具

## Background

对照外部 SEO/GEO 诊断报告、当前仓库实现与线上 `news.ljhboard.cn` 实测（含 Cloudflare Zone API 核查），排查出多处明确的技术 SEO、结构化数据、边缘缓存、站群互链与日报分享缺口，同时确认 HTTP 301、Cloudflare Bot Fight Mode（`false`）、AI Crawl Control（全部 `disabled`）、IndexNow、Umami 及暗黑模式已就绪；Cloudflare Free 套餐不支持 Markdown for Agents（`content_converter.editable: false`），按需求跳过。

## Scope

1. **Sitemap 收口与补齐**：从 Sitemap 移出 `/news/*`、`/finance/*`（频道页、来源页与文章页，不改动站内详情页与路由）；补入 `/leaderboard` 与 `/leaderboard/[slug]`，并在发布推送白名单中放行。
2. **首页导权与元数据修复**：首页「今日日报」条目改为链接 `/daily/<reportDate>#<storyId>`；移除首页未在页面渲染的隐藏 `FAQPage` JSON-LD，动态更新 `dateModified`，在 `SITE_SAME_AS` 补入 `https://software.ljhboard.cn/`。
3. **公开页边缘缓存恢复**：保留无参数动态路由的 `dynamic = 'force-dynamic'`（避免构建期访问 PostgreSQL），移除这些页面上无效的 `revalidate`，在 `next.config.ts` 为公开频道与功能页统一设置 `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`，并同步扩充 Service Worker `matchesPublicPage` 覆盖 `/daily` 与 `/leaderboard`。
4. **核心数据页 JSON-LD 与完整 Metadata**：
   - `/leaderboard`：输出 `Dataset` + `ItemList` + `FAQPage` JSON-LD，并在榜单下方渲染一致的数据驱动可见动态 FAQ；
   - `/leaderboard/[slug]`：输出 `TechArticle` + `BreadcrumbList` JSON-LD，并增加跳转 Token Paper 的上下文按钮；
   - `/daily` 与 `/daily/[date]`：走 `createPageMetadata` 补全 OpenGraph/Twitter，输出 `Article` + `BreadcrumbList` JSON-LD；
   - `/skills/[...skillId]`：输出 `SoftwareApplication` + `BreadcrumbList` JSON-LD。
5. **RSS 自动发现与日报 RSS**：新增 `/feeds/daily.xml`（最近 30 期日报全文摘要 RSS，同步支持 RSS 订阅弹窗选择）；新增 `/rss.xml` 永久重定向至 `/feeds/ai.xml`；在根布局 `<head>` 声明 `<link rel="alternate" type="application/rss+xml">`。
6. **动态 `/llms.txt` 与 `/llms-full.txt`**：改为 `force-dynamic` 并实时从 `@rss-site/signals` 汇总全量信源数、分区及核心功能页（含 `/daily`、`/leaderboard`、`/skills`、`/github`、`/mcp`、`/feeds/daily.xml`）。
7. **`robots.txt` 细化与百度主动推送 API**：`robots.ts` 补齐 `/reading-list`、`/following` 禁止规则并显式放行主流搜索与 AI 引用爬虫；`content-publication.ts` 新增可选 `BAIDU_PUSH_TOKEN` 集成，仅在配额内推送高价值路径（`/daily/YYYY-MM-DD`、`/leaderboard`、`/leaderboard/*`），同步更新 `deploy/runtime.env.example`。
8. **PWA Manifest**：新增 `apps/web/app/manifest.ts` 输出 `/manifest.webmanifest`。
9. **站群互链与日报分享工具**：侧栏页脚新增博客、OpenPick、Token Paper 与 RSS 直链；日报页新增「复制早报」（纯文本/Markdown）与「生成分享图」（前端 Canvas 2x 1080px 竖版早报卡片预览与 PNG 下载）。

## Out of scope

- 不改动 `/news/*`、`/finance/*` 站内详情页路由与渲染逻辑。
- 不开启付费 Cloudflare Markdown for Agents。
- 不改动第三方兄弟站仓库（`blog` / `software` / `token`）或执行站外运营投放。
- 不新增独立英文 URL 路由（`/en/*`）与邮件/账号同步功能。

## Acceptance criteria

- `/sitemap.xml` 与分片 XML 不再包含 `/news`、`/news/*`、`/finance`、`/finance/*`，且包含 `/leaderboard` 与单模型 `/leaderboard/[slug]`（上游异常时降级不导致 sitemap 503）。
- `publishContent` 接受 `/leaderboard` 与 `/leaderboard/[slug]`；配置 `BAIDU_PUSH_TOKEN` 时仅推送高价值路径，未配置时为 `disabled` 且不发外网请求。
- 首页「今日日报」条目链接包含 `/daily/<YYYY-MM-DD>#<storyId>`；首页 JSON-LD 不含未渲染的 `FAQPage` 且 `sameAs` 包含 `https://software.ljhboard.cn/`。
- `next.config.ts` 为 `/ai`、`/technology`、`/news`、`/social`、`/finance`、`/games`、`/daily`、`/github`、`/skills`、`/ai/events`、`/latest` 输出公开边缘缓存 `Cache-Control`。
- `/leaderboard`、`/leaderboard/[slug]`、`/daily`、`/daily/[date]`、`/skills/[...skillId]` 均输出合法 JSON-LD；`/leaderboard` 页面可见动态 FAQ 与 `FAQPage` JSON-LD 内容一致。
- `/feeds/daily.xml` 返回标准 RSS 2.0 XML，`/rss.xml` 返回 `301` 指向 `/feeds/ai.xml`，根 HTML `<head>` 包含 RSS `alternate` 标签。
- `/llms.txt` 与 `/llms-full.txt` 动态输出真实信源数量与全部核心路由。
- `/robots.txt` 禁止 `/reading-list`、`/following` 并显式放行主流搜索与 AI 引用爬虫。
- `/manifest.webmanifest` 输出有效 Web App Manifest。
- 侧栏页脚展示兄弟站点外链与 RSS 直链；单模型页提供 Token Paper 跳转；日报页支持一键复制纯文本早报与 Canvas 分享图预览下载。

## Feasibility

- **结论：可行（Feasible）**。
- **验证证据与难点**：
  1. 无参数列表页在 Docker `next build` 期无法访问 PostgreSQL，必须保留 `dynamic = 'force-dynamic'`；通过 `next.config.ts` `headers()` 下发 `Cache-Control` 即可命中已配置的 Cloudflare `News 公开页面 HTML 边缘缓存` 规则（`edge_ttl: bypass_by_default`），零构建期风险。
  2. `/leaderboard` 数据来自上游 `rss.ljhboard.cn/aihot/leaderboard?format=json`，Sitemap 合并单模型 URL 时必须捕获网络错误回退空列表，防止排行榜上游抖动拖垮全站 `sitemap.xml`。
  3. 日报分享图使用浏览器原生 `HTMLCanvasElement` 2x 绘制（`1080px` 宽），零第三方依赖，在移动端和桌面端均可离线生成并下载 PNG，且自动按文本行数动态计算画布高度避免文字截断。
  4. 未启用外部 UI Skills MCP 服务；沿用仓库已确立的 Midnight Enamel 语义 Token、React Aria `Modal`、`ActionButton` 与 Lucide 图标体系，未引入任何新 UI 依赖。

## Implementation

- 分支：`feat/seo-geo-optimization`（基于 `origin/master` `85c018f`），未触碰工作区未跟踪文件 `docs/research/hupu-hot-ranking.md`。
- Sitemap 与推送：
  - [sitemap-service.ts](../../apps/web/lib/sitemap-service.ts)：移除 `news` / `finance` 频道、来源与文章条目（保留站内详情页不改），加入 `/leaderboard` 与 `getLeaderboardEntries()`（异常降级不拖垮 sitemap），缓存键升级为 `v5`。
  - [content-publication.ts](../../apps/web/lib/content-publication.ts) 与 [runtime.env.example](../../deploy/runtime.env.example)：放行 `/leaderboard` 与 `/leaderboard/[slug]`，接入可选 `BAIDU_PUSH_TOKEN`，仅向百度普通收录 API 推送 `/daily/YYYY-MM-DD`、`/leaderboard`、`/leaderboard/*`，并在 `over quota` 时降级 `skipped`、日志不泄露密钥。
- 缓存与爬虫控制：
  - [next.config.ts](../../apps/web/next.config.ts)：为 `/latest`、`/daily`、`/ai`、`/technology`、`/news`、`/social`、`/finance`、`/games`、`/github`、`/skills`、`/ai/events` 统一配置 `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`；新增 `/rss.xml` -> `/feeds/ai.xml` 301 重定向；清理上述 `force-dynamic` 页面上无效的 `revalidate` 导出；在 [generate-service-worker.mjs](../../apps/web/scripts/generate-service-worker.mjs) 补齐 `daily|leaderboard` 缓存匹配。
  - [robots.ts](../../apps/web/app/robots.ts)：追加禁止 `/reading-list`、`/following`，并显式声明放行主流搜索与 AI 引用爬虫。
- 结构化数据、RSS、llms.txt 与 PWA：
  - [seo.ts](../../apps/web/lib/seo.ts)：移除首页隐藏 `FAQPage`、动态 `dateModified`、补全 `https://software.ljhboard.cn/` 至 `SITE_SAME_AS`；新增日报、评测榜、单模型与 Skill JSON-LD 构建函数并接入对应页面；[home-digest.tsx](../../apps/web/components/home-digest.tsx) 首页日报条目改链 `/daily/<reportDate>#<storyId>`。
  - [daily-reports.ts](../../apps/web/lib/daily-reports.ts)、[rss-feed.ts](../../apps/web/lib/rss-feed.ts)、[feeds/[feed]/route.ts](../../apps/web/app/feeds/%5Bfeed%5D/route.ts)、[rss-subscription.tsx](../../apps/web/components/rss-subscription.tsx)、[layout.tsx](../../apps/web/app/layout.tsx)：新增 `/feeds/daily.xml`、弹窗选项与 `<head>` RSS 自动发现标签。
  - [llms.txt/route.ts](../../apps/web/app/llms.txt/route.ts) 与 [llms-full.txt/route.ts](../../apps/web/app/llms-full.txt/route.ts)：改为 `force-dynamic` 动态汇总 `@rss-site/signals` 实时信源数与全部核心功能页。
  - [manifest.ts](../../apps/web/app/manifest.ts)：新增 `/manifest.webmanifest`。
- UI 增量表面：
  - [site-header.tsx](../../apps/web/components/site-header.tsx)：侧栏页脚补齐博客、OpenPick、Token Paper 与 RSS 直链。
  - [leaderboard/page.tsx](../../apps/web/app/leaderboard/page.tsx)、[leaderboard.ts](../../apps/web/lib/leaderboard.ts) 与 [model-detail-view.tsx](../../apps/web/components/leaderboard/model-detail-view.tsx)：新增与 `FAQPage` JSON-LD 同步的可见动态 FAQ、同步日期显示及 Token Paper 跳转。
  - [daily-share.ts](../../apps/web/lib/daily-share.ts)、[daily-share-actions.tsx](../../apps/web/components/daily-report/daily-share-actions.tsx) 与 [daily-report-view.tsx](../../apps/web/components/daily-report/daily-report-view.tsx)：新增「复制早报」与前端 2x Canvas「生成分享图」预览下载弹窗，同步补齐 `zh-CN.json` / `en.json` 双语词典。
- 自查评审结论：对照验收标准与仓库规范完成全量 diff 复核，无阻塞项，无拆分衍生 roadmap 需求。

## Verification

- `pnpm exec biome check apps packages server shared`：通过（`374` 文件，`0` 错误）。
- `pnpm check-types`：通过（`3/3` 包：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）。
- `pnpm test`：通过（`@rss-site/signals` `9/9`、`@rss-site/api` `131/131`、`@rss-site/web` `50` 文件 `241 passed | 24 skipped`，含新增 `seo-geo.test.ts` 及更新后的 `sitemap.test.ts`、`robots.test.ts`、`content-publication.test.ts`、`feeds/[feed]/route.test.ts`、`generate-service-worker.test.mjs`、`site-i18n.test.tsx`）。
- `pnpm --filter @rss-site/web build`：通过（`12/12` 静态页含 `/manifest.webmanifest`、`/leaderboard`、`/robots.txt`，动态 `/llms.txt` & `/llms-full.txt`，`early-hints` 与 `sw.js` 生成正常）。
- 注：本地无生产数据库连接，线上部署后需核验公网 `/sitemap.xml`、`/feeds/daily.xml`、`/llms.txt`、`/manifest.webmanifest`、`/ai` 边缘缓存 `HIT` 及日报页分享图视觉效果。

## Risks

- 公开频道页启用 `s-maxage=300` 边缘缓存后，依赖既有的 `resolveRevalidation` + Cloudflare `purge_cache` 失效链路；即便单次 purge 失败，最长滞后窗口为 5 分钟（`s-maxage=300`），处于可接受范围。
- 百度普通收录 API 每日配额有限，已将推送严格限定在 `/daily/YYYY-MM-DD`、`/leaderboard` 与 `/leaderboard/*` 高价值路径，并隔离错误不影响 IndexNow 或页面渲染。
