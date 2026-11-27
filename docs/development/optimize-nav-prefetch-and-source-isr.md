# 优化导航栏预取与恢复来源页按需 ISR 缓存

## Background

2026-11-27 生产 Nginx 访问日志（`/www/wwwlogs/news.ljhboard.cn.log`）排查发现：在 Cloudflare WAF 拦截 Meta AI 爬虫与 `/archive` 分页爬虫之后，单日 02:00–09:00 仍有约 `14.2 万` 次请求穿透缓存直打北京 ECS 源站（`OAI-SearchBot/1.4` `77,345` 次、`Chrome/155.0.0.0` `64,639` 次），将 `rss-site-web-1` 内存推高至 `551 MiB`、整机 Swap 推高至 `894 MiB`。

进一步定位出两个代码级放大根因：

1. **导航 `<Link>` 视口自动预取放大（占回源量约 80%）**：[site-header.tsx](../../apps/web/components/site-header.tsx) 中的 17 个侧栏/顶栏/底部导航链接默认开启 Next.js 视口自动预取。无头渲染爬虫（如 `OAI-SearchBot`、`Chrome/155`）每打开 1 个页面即创建新上下文，视口内 17 个导航链接同时触发 17 次不可边缘缓存的 `?_rsc=` 回源请求（合计约 `11.3 万` 次/7 小时）。
2. **6 个频道的 `/[section]/[source]` 来源页误置为 `force-dynamic`**：在 `2bbeab63`（迁移至 Docker PostgreSQL 18）时，为避免 CI `next build` 在无库环境下预渲染全部 126 个来源页，将 6 个 `[source]/page.tsx` 从 `force-static` 改为 `force-dynamic`，导致同文件中的 `revalidate`（`7200` / `21600`）失效，源站返回 `Cache-Control: private, no-cache, no-store`，Cloudflare 边缘缓存规则（`bypass_by_default`）全部 `BYPASS`，同时使 `content-update.ts` 既有的 `revalidatePath` + Cloudflare 主动 purge/prewarm 链路对来源页失去意义。

## Scope

1. 新增可复用的 [hover-prefetch-link.tsx](../../apps/web/components/hover-prefetch-link.tsx)（默认 `prefetch={false}`，仅在 `onMouseEnter` / `onFocus` 时按需调用 `router.prefetch(href)`，并对相同 `href` 去重及跳过当前激活页），并在 [site-header.tsx](../../apps/web/components/site-header.tsx) 中替换全部导航 `<Link>`。
2. 将 6 个频道的来源页（`ai`、`technology`、`news`、`social`、`finance`、`games` 的 `[source]/page.tsx`）统一恢复为与文章详情页一致的按需 ISR 模式：`export const dynamic = 'force-static'`、`export const dynamicParams = true`、`export function generateStaticParams() { return [] }`，保留各自既有的 `revalidate`（`ai` 为 `7200`，其余为 `21600`）。
3. 新增单元测试覆盖 `HoverPrefetchLink` 挂载零预取、hover/focus 触发预取与去重行为，以及 6 个来源页的按需 ISR 导出契约。

## Out of scope

- 不在 Cloudflare WAF 中拦截 `Chrome/155.0.0.0`（2026 年 11 月属正常 Chrome 版本号，避免误伤 Linux 真实用户）。
- 本次不修改固定路径频道页（`/`、`/ai`、`/latest`、`/daily` 等）的 `force-dynamic` 配置及 Cloudflare 边缘缓存规则，避免影响无数据库环境下的 `next build`。
- 不修改 `home-article-list.tsx` / `event-timeline.tsx` 的列表分页预取逻辑。

## Acceptance criteria

1. 页面初次渲染 `TransitSidebar` 与 `SiteHeader` 时，所有导航链接均传递 `prefetch={false}`，不会在挂载/进入视口时自动触发 `router.prefetch`。
2. 用户鼠标悬停（`mouseEnter`）或键盘聚焦（`focus`）非当前页导航链接时，调用一次 `router.prefetch(href)`；重复悬停/聚焦同一 `href` 不重复调用；当前激活页（`aria-current="page"`）不触发预取。
3. 6 个 `/[section]/[source]/page.tsx` 均导出 `dynamic = 'force-static'`、`dynamicParams = true`、`generateStaticParams() -> []` 与原 `revalidate` 值，在无生产数据库的环境下 `pnpm --filter @rss-site/web build` 正常通过且不再在构建期尝试预渲染 126 个来源页。
4. 生产运行时访问 `/[section]/[source]` 输出 `Cache-Control: s-maxage=..., stale-while-revalidate=...`，与现有 `content-update.ts` 的 `revalidatePath` + Cloudflare `purge_cache` 协作闭环；`/technology/github` 仍返回永久重定向至 `/github`。
5. 全仓 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm --filter @rss-site/web build` 全部通过。

## Feasibility

- **可行性结论**：完全可行（Feasible）。
- **架构验证**：
  - 文章详情页（`apps/web/app/<section>/[source]/[slug]/page.tsx`）已长期稳定运行 `force-static` + `revalidate` + `dynamicParams = true` + `generateStaticParams() { return [] }`，生产实测源站输出 `Cache-Control: s-maxage=21600, stale-while-revalidate=31514400` 且 Cloudflare 命中 `cf-cache-status: HIT`。
  - `PaginatedArticleFeed` 仅读取公开 Redis/PostgreSQL 列表缓存，不依赖 `cookies()` / `headers()`；全站登录态、收藏数、语言切换均在客户端水合处理，HTML 对所有访客一致。
  - `apps/web/lib/revalidate-paths.ts` 与 `apps/web/lib/content-publication.ts` 已在每次采集更新时调用 `revalidatePath('/<section>/<source>')` 并向 Cloudflare 发起 `purge_cache` + 预热，恢复来源页 ISR 后可无缝复用现有失效与预热闭环。
- **风险与约束**：
  - 需移除 6 个 `[source]/page.tsx` 中因 `generateStaticParams` 返回空数组后不再使用的 `*Sources` 列表导入，满足 Biome 零未使用导入检查。
  - 需确认 `HoverPrefetchLink` 不破坏外部传入的 `onMouseEnter` / `onFocus` / `onClick` 与无障碍属性（`aria-current`、`aria-label`）。

## Implementation

- 新增 [hover-prefetch-link.tsx](../../apps/web/components/hover-prefetch-link.tsx)，封装 `next/link`（固定 `prefetch={false}`），通过 `useRouter().prefetch(href)` 在 `onMouseEnter` / `onFocus` 时按需预取一次，并跳过 `aria-current="page"` 的当前页链接。
- 更新 [site-header.tsx](../../apps/web/components/site-header.tsx)，将侧边栏导航、品牌 Logo、顶栏稍后阅读入口与移动端底部导航栏的全部 `<Link>` 替换为 `HoverPrefetchLink`。
- 更新以下 6 个来源页路由文件，恢复 `dynamic = 'force-static'` 与 `generateStaticParams() { return [] }`：
  - [apps/web/app/ai/[source]/page.tsx](../../apps/web/app/ai/%5Bsource%5D/page.tsx)（`revalidate = 7200`）
  - [apps/web/app/technology/[source]/page.tsx](../../apps/web/app/technology/%5Bsource%5D/page.tsx)（`revalidate = 21600`）
  - [apps/web/app/news/[source]/page.tsx](../../apps/web/app/news/%5Bsource%5D/page.tsx)（`revalidate = 21600`）
  - [apps/web/app/social/[source]/page.tsx](../../apps/web/app/social/%5Bsource%5D/page.tsx)（`revalidate = 21600`）
  - [apps/web/app/finance/[source]/page.tsx](../../apps/web/app/finance/%5Bsource%5D/page.tsx)（`revalidate = 21600`）
  - [apps/web/app/games/[source]/page.tsx](../../apps/web/app/games/%5Bsource%5D/page.tsx)（`revalidate = 21600`）
- 新增 [hover-prefetch-link.test.tsx](../../apps/web/components/hover-prefetch-link.test.tsx) 与 [source-isr-config.test.ts](../../apps/web/app/source-isr-config.test.ts)。

## Verification

- `pnpm lint`：`biome check .` 校验 `404` 个文件通过（`0` 错误）。
- `pnpm check-types`：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` `3/3` 包通过。
- `pnpm test`：`@rss-site/signals` `9/9`、`@rss-site/api` `130/130`、`@rss-site/web` `222 passed | 22 skipped`（含新增 `components/hover-prefetch-link.test.tsx` `3` 项与 `app/source-isr-config.test.ts` `1` 项）全部通过。
- `pnpm --filter @rss-site/web build`：无生产库环境下完成生产构建（`13/13` 静态页 + `early-hints` + `sw.js`），6 个 `/[section]/[source]` 路由在构建路由表中均恢复为 `○`（按需 ISR），与 `[section]/[source]/[slug]` 详情页一致。
- Diff 自检：核对全量 `git diff` 对照仓库规范与验收标准，无阻塞项、无衍生代码 roadmap。

## Risks

- 首次访问冷来源页时会经历一次运行时按需渲染（随后命中 Next.js ISR 与 Cloudflare 边缘缓存）；由于定时采集与部署后预热都会触达来源页，用户侧体感延迟可忽略。
- 本次不包含固定路径频道页（`/`、`/ai` 等）的缓存策略调整，若后续观察到这两类入口本身成为热点，可单独评估 Cloudflare 短期边缘缓存或进一步优化。无阻塞性后续任务，不单独创建 roadmap。
