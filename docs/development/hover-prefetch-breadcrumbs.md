# 拦截 Linux Chrome/155 隐身爬虫并替换页面面包屑自动预取

## Background

PR #128 上线（`34c09cc`）将侧边栏/顶栏导航替换为 `HoverPrefetchLink` 并恢复 6 个频道来源页按需 ISR 后，生产 ECS 负载与回源量已大幅下降（10:00–20:56 CST CPU 闲置均值 `81.48%`、磁盘 `128.75 TPS`、Cloudflare 缓存命中率升至 `38%–48%`、`0` 宕机告警）。

但全天日志复查（10:00–20:56 CST）显示仍残留两部分可控回源：

1. **已实锤的未知隐身无头爬虫（`X11; Linux x86_64 ... Chrome/155.0.0.0`）**：在 Cloudflare WAF 最近 70 分钟日志中，`/archive` 托管质询规则触发 `285` 次，其中 `Chrome/155.0.0.0` 占 `287` 次（含 `AS3257/6079` 规则命中），出口全部为美国住宅代理池（Comcast `AS7922`、Verizon `AS701`/`AS5650`、AT&T `AS7018`、Charter、Cox）与 Oracle 云机房（`AS31898`）。它绕过 `/archive` 持续用无头浏览器抓取公开来源页，11 小时内贡献 `17,707` 次回源（全站第 1），其中 `12,477` 次为 `?_rsc=`、`1,851` 次为 `/sw.js`、`1,703` 次为 `/stats/api/send`（污染 Umami 统计）。
2. **页面内面包屑与来源切换标签的剩余 `<Link>` 自动预取**：`OAI-SearchBot/1.4`（`8,859` 次中 `6,411` 次为 `?_rsc=`）与其他渲染型访问打开文章详情页或频道来源页时，[article-reader.tsx](../../apps/web/components/article-reader.tsx)、[section-layout.tsx](../../apps/web/components/section-layout.tsx)、[source-navigation.tsx](../../apps/web/components/source-navigation.tsx) 等页面内面包屑与来源导航 `<Link>` 仍在进入视口时自动发出 `?_rsc=` 预取（例如从 `/finance/stcn` 自动预取 `/` 与 `/finance`）。

## Scope

1. **Cloudflare WAF 第 5 条自定义规则（已通过 Cloudflare MCP 线上生效）**：在 Zone `ljhboard.cn` 新增 `managed_challenge` 规则（Rule ID `4a5aba77d51e45aeafb9eec167353580`），对 `news.ljhboard.cn` 上 `http.user_agent eq "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36" and not cf.client.bot` 执行托管质询，拦截住宅代理无头爬虫同时避免误伤极少数真实旧版 Linux Chrome 访客。
2. **代码侧全面切换面包屑与来源导航 `<Link>` 为 `HoverPrefetchLink`**：
   - [article-reader.tsx](../../apps/web/components/article-reader.tsx)：文章详情页顶部 3 级面包屑（`/`、`/${section}`、`/${section}/${source}`）与底部同源相关文章链接。
   - [section-layout.tsx](../../apps/web/components/section-layout.tsx)：来源页顶部 2 级面包屑（`/`、`basePath`）。
   - [source-navigation.tsx](../../apps/web/components/source-navigation.tsx)：频道/来源页顶部「全部」与全部来源切换标签链接。
   - [ai/events/[slug]/page.tsx](../../apps/web/app/ai/events/%5Bslug%5D/page.tsx)：AI 时间线详情页返回链接与相关事件链接。
   - [skills/[...skillId]/page.tsx](../../apps/web/app/skills/%5B...skillId%5D/page.tsx)：Skill 详情页面包屑与同仓库相关 Skill 链接。
   - [leaderboard/model-detail-view.tsx](../../apps/web/components/leaderboard/model-detail-view.tsx)：模型评测详情页面包屑链接。
3. 补充组件集成单测，验证 `SectionLayout` / `SourceNavigation` 与 `ModelDetailView` 挂载时不会自动触发 `router.prefetch`，仅在用户 hover / focus 非当前页链接时按需预取。

## Out of scope

- 不改动 `daily-report-view.tsx` 等低抓取量独立视图的链接结构。
- 不修改 `home-article-list.tsx` 的列表分页交互与 `HotList` 卡片结构。
- 不封禁旧版低量纯 HTTP 爬虫（合计约 400 次/11 小时，几乎全走缓存且无 JS 执行放大）。

## Acceptance criteria

1. Cloudflare WAF 自定义规则列表共 `5/5` 条生效，其中第 5 条针对 `news.ljhboard.cn` Linux `Chrome/155.0.0.0` 非认证爬虫执行 `managed_challenge`。
2. `article-reader.tsx`、`section-layout.tsx`、`source-navigation.tsx`、`ai/events/[slug]/page.tsx`、`skills/[...skillId]/page.tsx`、`model-detail-view.tsx` 中不再存在默认自动预取的 `next/link` `<Link>`，全部使用 `HoverPrefetchLink`。
3. 真实用户鼠标悬停或键盘聚焦面包屑与来源标签时，仍触发一次去重的 `router.prefetch(href)`；当前激活标签（`aria-current="page"`）不触发预取。
4. 全仓 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm --filter @rss-site/web build` 全部通过。

## Feasibility

- **可行性结论**：完全可行（Feasible）。
- **架构验证**：
  - `HoverPrefetchLink` 已在 PR #128 经生产验证，作为轻量 `'use client'` 叶子组件可直接被 Server Component（`article-reader.tsx`、`ai/events/[slug]/page.tsx`、`skills/[...skillId]/page.tsx`）和 Client Component（`section-layout.tsx`、`source-navigation.tsx`、`model-detail-view.tsx`）复用，且不影响路由的 `force-static` / ISR 静态生成能力。
  - `SourceNavigation` 已为当前选中标签设置 `aria-current="page"`，接入 `HoverPrefetchLink` 后可自动跳过当前页标签的冗余预取。

## Implementation

- **Cloudflare 边缘规则**：通过 Cloudflare MCP 在自定义规则集 `d02888efe18040dcabb2432b9bbed620` 新增第 5 条规则 `4a5aba77d51e45aeafb9eec167353580`（`managed_challenge`）。
- **前端组件与页面**：将以下 6 个文件中的 `<Link>` 统一替换为 `HoverPrefetchLink`：
  - [apps/web/components/article-reader.tsx](../../apps/web/components/article-reader.tsx)
  - [apps/web/components/section-layout.tsx](../../apps/web/components/section-layout.tsx)
  - [apps/web/components/source-navigation.tsx](../../apps/web/components/source-navigation.tsx)
  - [apps/web/app/ai/events/[slug]/page.tsx](../../apps/web/app/ai/events/%5Bslug%5D/page.tsx)
  - [apps/web/app/skills/[...skillId]/page.tsx](../../apps/web/app/skills/%5B...skillId%5D/page.tsx)
  - [apps/web/components/leaderboard/model-detail-view.tsx](../../apps/web/components/leaderboard/model-detail-view.tsx)
- **测试**：在 [hover-prefetch-link.test.tsx](../../apps/web/components/hover-prefetch-link.test.tsx) 中补充 `SourceNavigation` 渲染验证（挂载零预取、当前激活标签跳过预取、悬停其他来源标签按需预取）。

## Verification

- **Cloudflare WAF 线上实测**：规则 `4a5aba77d51e45aeafb9eec167353580` 上线 `90` 秒内（`13:02:36Z–13:04:03Z`）即命中 `22` 次 `managed_challenge`，全部来自美国住宅代理与 Oracle 云机房（`AS7922 Comcast` `10`、`AS7018 AT&T` `9`、`AS6167 Verizon` `2`、`AS31898 Oracle` `1`），精准拦截 `/ai/google-ai`、`/ai/ahead-of-ai` 等非 `/archive` 爬取。
- `pnpm lint`：`biome check .` 校验 `409` 个文件通过（`0` 错误）。
- `pnpm check-types`：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` `3/3` 包通过。
- `pnpm test`：`@rss-site/signals` `9/9`、`@rss-site/api` `131/131`、`@rss-site/web` `230 passed | 24 skipped`（含新增 `SourceNavigation` 零自动预取 + 悬停/聚焦按需预取集成单测）全部通过。
- `pnpm --filter @rss-site/web build`：无生产库环境下完成生产构建（`13/13` 静态页 + `early-hints` + `sw.js`），全部静态与按需 ISR 路由保持不变。
- Diff 自检：核对全量 `git diff` 对照仓库规范与验收标准，无阻塞项、无衍生代码 roadmap。

## Risks

- Cloudflare Free 版自定义 WAF 规则已使用 `5/5` 满配额；若未来隐身爬虫再次更换 UA 版本号，可直接在第 5 条规则表达式中扩展 UA 列表，无需额外名额。无后续阻塞项，不单独创建 roadmap。
