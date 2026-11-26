# 禁止合规爬虫抓取历史分页路由

## Background

2026-11-26 生产诊断显示，ECS（`i-2ze77shgsxr3nwn6ghra`，`ecs.e-c1m1.large`）在 15:55–17:20 CST 因持续高并发抓取 `/archive/<section>/<source>?cursor=...` 与 `/ai/events/archive?cursor=...` 触发 Swap 抖动（1,000+ pages/s）并打满 40G 云盘 IOPS 上限（2,120 TPS），导致整机 `iowait` 达 80.97%、Load 达 31.73，Uptime Kuma 持续超时告警。Cloudflare AI Crawl Control 7 天统计亦显示 `/ai/events/archive` 为全站被抓取次数最多的路径（28.51k 次）。

两类历史分页页均为 `force-dynamic`，且每次生成带唯一 `snapshot` 时间戳的 `cursor` 链接并输出独立 `canonical`，对合规爬虫形成了无限分页陷阱（spider trap），持续穿透缓存直打 PostgreSQL 并浪费抓取预算；而真正需要搜索引擎收录的首页、频道首页、文章详情页、AI 事件详情页与 `/sitemap.xml` 并不依赖历史分页路径。

## Scope

- 在 [`apps/web/app/robots.ts`](../../apps/web/app/robots.ts) 中新增 `disallow`：`/archive` 与 `/ai/events/archive`，保持 `/` 及所有文章详情、频道首页与 `sitemap.xml` 可正常抓取。
- 在 [`apps/web/app/archive/[section]/[[...source]]/page.tsx`](../../apps/web/app/archive/%5Bsection%5D/%5B%5B...source%5D%5D/page.tsx) 与 [`apps/web/app/ai/events/archive/page.tsx`](../../apps/web/app/ai/events/archive/page.tsx) 的 `generateMetadata` 中返回 `robots: { index: false, follow: false }`。
- 在 [`apps/web/next.config.ts`](../../apps/web/next.config.ts) 中为 `/archive/:path*` 与 `/ai/events/archive` 补充响应头 `X-Robots-Tag: noindex, nofollow`，覆盖 RSC/非 HTML 请求与已入队抓取。
- 在指向历史分页的入口链接（[`apps/web/components/home-article-list.tsx`](../../apps/web/components/home-article-list.tsx)、[`apps/web/components/event-timeline.tsx`](../../apps/web/components/event-timeline.tsx) 与 [`apps/web/app/archive/[section]/[[...source]]/page.tsx`](../../apps/web/app/archive/%5Bsection%5D/%5B%5B...source%5D%5D/page.tsx) 的“下一页”）添加 `rel="nofollow"`，保留用户端可见文本与交互完全不变。
- 新增单元测试 [`apps/web/app/robots.test.ts`](../../apps/web/app/robots.test.ts) 覆盖 `robots.txt`、两类分页元数据与响应头规则。

## Out of scope

- 不修改页面视觉布局、导航文案或普通用户的“查看更早内容”/“更早事件”/“下一页”分页体验。
- 不拦截合规搜索引擎对首页、频道首页、文章详情页、AI 事件详情页和 `/sitemap.xml` 的抓取。
- 不在本次 PR 内调整 Cloudflare WAF、Nginx 限流规则或 ECS 规格（作为独立运维侧配合项）。
- 不调整 `cursor.snapshot` 有效期或双重编码 slug 的 `ENAMETOOLONG` 处理。

## Acceptance criteria

1. `/robots.txt` 包含 `Disallow: /archive` 与 `Disallow: /ai/events/archive`，同时保留 `Allow: /`、既有后台/接口拦截项及 `Sitemap`。
2. `/archive/[section]/[[...source]]` 与 `/ai/events/archive` 的页面元数据返回 `robots: { index: false, follow: false }`，且 HTTP 响应头包含 `X-Robots-Tag: noindex, nofollow`。
3. 站内指向两类历史分页的 `<Link>` 均带 `rel="nofollow"`。
4. 全仓 `lint`、`check-types`、单元测试与 Next.js 生产构建全部通过。

## Feasibility

- 结论：**Feasible**。
- 约束与瓶颈分析：
  - `apps/web/scripts/generate-early-hints.mjs` 仅查找并替换 `key === 'Link'` 的 header 条目，新增 `X-Robots-Tag` 规则与既有 Early Hints 构建脚本完全兼容。
  - `robots.txt` 为前缀匹配（RFC 9309），全站不存在其他以 `/archive` 开头的路由，使用 `/archive` 与 `/ai/events/archive` 无误杀风险。
  - 需要注意：`robots.txt` / `noindex` / `nofollow` 仅约束遵守协议的合规搜索引擎与官方爬虫；不遵守 `robots.txt` 的隐身/伪装 UA 抓取器仍需在 Cloudflare WAF 或 Nginx 层通过质询/限流拦截。

## Implementation

- [`apps/web/app/robots.ts`](../../apps/web/app/robots.ts)：将 `disallow` 扩展为 `['/api/', '/cron/', '/out', '/admin', '/archive', '/ai/events/archive']`。
- [`apps/web/app/archive/[section]/[[...source]]/page.tsx`](../../apps/web/app/archive/%5Bsection%5D/%5B%5B...source%5D%5D/page.tsx)：`generateMetadata` 增加 `robots: { index: false, follow: false }`，“下一页”链接增加 `rel="nofollow"`。
- [`apps/web/app/ai/events/archive/page.tsx`](../../apps/web/app/ai/events/archive/page.tsx)：`generateMetadata` 增加 `robots: { index: false, follow: false }`。
- [`apps/web/components/home-article-list.tsx`](../../apps/web/components/home-article-list.tsx) 与 [`apps/web/components/event-timeline.tsx`](../../apps/web/components/event-timeline.tsx)：历史分页入口 `<Link>` 增加 `rel="nofollow"`。
- [`apps/web/next.config.ts`](../../apps/web/next.config.ts)：为 `/archive/:path*` 与 `/ai/events/archive` 增加 `X-Robots-Tag: noindex, nofollow` 响应头。
- [`apps/web/app/robots.test.ts`](../../apps/web/app/robots.test.ts)：覆盖 `robots()`、两个 `generateMetadata` 与 `nextConfig.headers()`。

## Verification

- `pnpm lint`（`biome check .`）：`393` 文件通过，0 错误。
- `pnpm check-types`：`3/3` 包（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）全部通过。
- `pnpm test`：
  - `@rss-site/signals`：`9 passed`
  - `@rss-site/api`：`130 passed`
  - `@rss-site/web`：`203 passed | 22 skipped`（含 `app/robots.test.ts` `4/4` 通过；`22` 项为需本地数据库/Redis 的集成测试）
- `SITE_URL=https://news.ljhboard.cn pnpm --filter @rss-site/web build`：编译、类型检查与 `137/137` 静态页生成、`generate-early-hints.mjs` 及 `sw.js` 全部通过。
- 无接受的后续研发 roadmap 项（非合规隐身爬虫的边缘拦截属于 Cloudflare/Nginx 运维配置，不建空 roadmap）。

## Risks

- 对于此前已被搜索引擎索引的历史 `/archive?...` URL，在被 `robots.txt` 禁止重抓后，搜索控制台短期内可能出现“已编入索引但被 robots.txt 屏蔽”的提示，随后随抓取淘汰自动消失；同时已通过 `noindex, nofollow` 与 `X-Robots-Tag` 兜底处理尚未从队列清空的请求。
- 本次变更仅针对遵守协议的合规爬虫，无法阻止无视 `robots.txt` 的伪装浏览器爬虫；如该类流量持续冲高，仍需在 Cloudflare WAF 对 `/archive` + `cursor=` 启用托管质询或限流。
