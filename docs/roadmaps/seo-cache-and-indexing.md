# SEO、缓存与索引发布 roadmap

Status: P1 schema and historical backfill verified in cloud; full 36-source Cron gate pending

Batch gate: 财经、游戏与 P1 数据模型已合并，四条云端迁移、496 条历史文章回填和权限审计已完成。完整来源
门禁先后被掘金瞬时 503 与金十无链接条目中断，且安全顺序保证 Cron 未被更改。当前解析与有限重试修复部署后，
必须从第一路重新验证 36 路并启用错峰 Cron，P2 才开始。最终前端部署顺序见
[生产上线 roadmap](production-launch.md)；体育、影视文化、科学研究和生活消费等 Later 分类不阻塞本 roadmap。

## 目标

在不伪造内容、不镜像第三方全文的前提下，为持续刷新的热点站建立稳定的内容 URL、可控的数据保留周期、适合搜索引擎的服务端 HTML，以及从抓取成功到缓存失效、sitemap 更新和搜索引擎通知的完整发布流程。

目标链路：

```text
来源抓取成功
→ 写入云端 Supabase
→ 计算真正变化的本站 URL
→ 清除 Next.js 数据缓存和 ISR 页面缓存
→ 更新 sitemap
→ 清除 Cloudflare 对应 URL 的边缘缓存
→ 小批量预热公开页面
→ 异步提交 IndexNow
```

Google 普通文章不调用 Indexing API。Google Indexing API 只用于符合官方要求的 `JobPosting` 或嵌套在 `VideoObject` 中的 `BroadcastEvent` 页面；本站使用 sitemap、内部链接和 Search Console 完成普通页面发现。

## P1：持久化文章与 AI 事件模型

Status: cloud schema, backfill and access boundary verified; complete real-ingestion/Cron verification pending

### 数据职责

- `hot_items`：只表示当前榜单，继续允许新批次替换旧批次。
- `signal_articles`：保存抓取文章的稳定元数据，不保存第三方全文和图片二进制。
- `ai_events`：保存 AI 时间线中的长期事件摘要。
- `ai_event_articles`：关联一个 AI 事件与一篇或多篇来源文章。

### 数据保留

- 普通文章默认保留 90 天。
- AI 文章默认保留 180 天。
- 被 AI 事件引用、人工保留或仍在当前榜单中的文章不得清理。
- AI 事件长期保留；来源文章过期后，事件自身仍保留稳定摘要和仍然有效的来源。
- 清理任务每天低峰分批执行，不使用大事务，不频繁执行会锁表的 `VACUUM FULL`。

### 完成信号

- 版本化迁移已部署到云端 Supabase，并通过真实写入与读取验证。
- 同一来源文章重复抓取不会创建重复记录。
- 保留策略有自动化测试，清理不会删除当前热点、置顶内容或事件依赖。
- 记录表和关联表索引、约束、RLS 与 Data API 暴露范围通过安全检查。

## P2：稳定详情路由与内容质量

### 路由

- 事件详情主路由使用 `/ai/events/[slug]`。
- slug 使用可读文本加稳定短标识，标题变化不得改变已有 URL。
- 普通第三方文章暂不建立只有标题和摘要的镜像详情页；确需建立时必须提供本站独有价值，否则设置 `noindex` 或继续直接跳转原文。

### 页面内容

- 展示事件摘要、发生时间、涉及平台、相关来源、关联事件和原文链接。
- 设置唯一 title、description、canonical 和适合内容类型的结构化数据。
- 已清理且不再保留的详情页返回 `410 Gone`；同时从 sitemap 移除。
- 不使用假数据、占位文章或生成式伪摘要填充页面。

### 完成信号

- 事件 URL 在标题更新后保持稳定。
- 事件下的来源增删不会破坏页面 canonical。
- 有效事件返回完整服务端 HTML；已删除事件返回正确状态码。
- 页面通过桌面端、移动端、键盘和无 JavaScript 基础内容检查。

## P3：Next.js ISR 与按需失效

### 页面缓存

- 移除公开热点页面当前不必要的 `force-dynamic`。
- AI 页面设置 2 小时兜底 revalidate；其他公开分区设置 6 小时兜底 revalidate。
- 首页、分区页、来源页和 AI 事件详情均输出可索引的服务端 HTML。
- React Query 不替代 ISR，也不承担搜索引擎首屏内容。

### 发布接口

- 新增受 `REVALIDATE_SECRET` 保护的服务端 `POST /api/revalidate` Route Handler。
- 请求只接受仓库内白名单中的 section、source 和事件路径，不接受任意 URL。
- 当前 Supabase 读取尚未绑定缓存标签时，优先用 `revalidatePath()`。
- 引入带标签的数据缓存后，使用 section/source/event 标签，并在外部发布通知中用 `revalidateTag(tag, { expire: 0 })` 保证下一次访问读取新数据。
- 抓取 API 只在数据库事务成功后调用发布接口。

### 失效范围

一次来源更新至少覆盖：

```text
/
/{section}
/{section}/{source}
/sitemap.xml
本批次新增或显著更新的 /ai/events/[slug]
```

### 完成信号

- 未到兜底周期时，相同公开页面不会重复查询 Supabase。
- 抓取成功后，下一次访问能读取新批次数据。
- 非法密钥、未知来源和任意路径注入均被拒绝。
- 缓存失效失败不会回滚或伪装成数据库抓取失败，两类状态分别记录。

## 新闻详情接入补充（Next）

- 来源：[新闻详情开发记录](../development/news-article-details.md)。`/news/[source]/[slug]` 已可读取持久化文章，现有 loading 会使未找到页在流式响应中返回 200 并附带 noindex。
- 价值：将新闻稳定 URL 纳入已有 SEO 发布流程，并让已删除文章返回准确状态。
- 依赖：确认最终 `SITE_URL`，结合 P3 缓存与保留清理方案，再接入 P4 sitemap。
- 验收：canonical 使用确认的域名；sitemap 仅包含仍保留的新闻详情；失效文章在发出响应正文前确定 404/410，保留有效详情的加载体验。

## P4：动态 sitemap、robots 与 Google 发现

### Sitemap

- 使用 Next.js Metadata Route 生成根级 `/sitemap.xml`。
- 包含首页、公开分区页、来源页、保留期内允许索引的本站详情页和 AI 事件页。
- 不包含 `/out`、API、Cron、预览页、`noindex` 页面和第三方原文 URL。
- `lastModified` 只在主内容、结构化数据或链接发生显著变化时更新，不得在每次生成 sitemap 时统一写成当前时间。
- 超过单文件容量后再拆分 sitemap index；不提前引入分片复杂度。

### Google

- `robots.txt` 声明根级 sitemap。
- 在 Google Search Console 中提交 sitemap 一次并检查解析状态。
- 不调用已废弃的 sitemap ping endpoint。
- 不将普通热点文章提交给 Google Indexing API。

### 完成信号

- 抓取成功后 `/sitemap.xml` 被按需失效，并反映真实新增、更新和删除。
- sitemap 只输出本站 canonical 绝对 URL，时间格式正确。
- 删除内容已移出 sitemap，访问原 URL 返回 `410` 或符合实际状态的 `404`。
- Search Console 能读取 sitemap，且没有 URL、canonical 或 robots 冲突。

## P5：React Query 浏览器缓存

### 使用边界

- 仅用于无刷新更新、来源切换、筛选、无限滚动和返回页面时的浏览器数据复用。
- 首屏由 Server Component 预取并输出 HTML，再通过 `HydrationBoundary` 交给客户端。
- 查询调用 Next Route Handler/API，不把 Server Action 当作 query function。
- 设置明确的 `staleTime`、`gcTime`，关闭不必要的窗口聚焦自动刷新，避免与 2 小时/6 小时抓取周期形成无意义请求。

### 完成信号

- 首次打开页面不发生 hydration 后的立即重复请求。
- 客户端导航和返回页面可复用缓存。
- 禁用 JavaScript 时仍能读取首屏热点和 AI 事件内容。
- React Query 的加入没有改变 sitemap、metadata 或爬虫获得的 HTML。

## P6：Cloudflare 边缘缓存与清除

### 应用职责

- 用户继续负责优选 IP 与 Cloudflare Dashboard 中的边缘 Cache Rules。
- 应用只实现按 URL 清除接口，不更改优选 IP、DNS 或用户现有代理配置。
- 使用限定到目标 Zone 且仅有 `Cache Purge` 权限的 API Token，不使用 Global API Key。
- `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ZONE_ID`、`SITE_URL` 和 `REVALIDATE_SECRET` 仅存在于服务端环境变量。

### 缓存边界

- 只缓存公开 GET HTML 页面。
- 排除 `/api/*`、`/cron/*`、`/out`、管理页、预览页、认证响应和带 `private`/`no-store` 的响应。
- 第一阶段不缓存 RSC 请求；不得移除 `_rsc` 查询参数或将 HTML 与 RSC 变体混用。
- `/_next/static/*` 等内容哈希静态资源继续长期缓存。
- Cloudflare 边缘 TTL 使用短兜底窗口；内容新鲜度主要由发布后的主动清除保证。

### 清除与预热

- Next.js 失效成功后，调用 `POST /zones/{zone_id}/purge_cache` 清除本次变化的本站 URL。
- 不使用 `purge_everything` 作为正常发布路径。
- 清除成功后只预热本批次受影响的小量公开 URL，禁止全站并发预热。
- Cloudflare 清除失败不影响已完成的抓取；记录失败并依靠短 TTL 兜底。

### 完成信号

- 更新前后可通过 `CF-Cache-Status` 观察 MISS/HIT 与清除结果。
- RSC 客户端导航不会收到 HTML 响应。
- Cloudflare 命中时不访问 Next/Supabase；清除后首次访问能获得新内容。
- 未配置 Cloudflare 环境变量时，应用仍可仅依靠 ISR 正常运行。

## P7：IndexNow 通知

### 提交范围

- 只提交本站新增、显著更新或删除的 canonical URL。
- 当前没有本站文章详情页时，只提交实际变化的首页、分区页和来源页；不得提交第三方原文 URL。
- AI 事件详情上线后，将本批次新增或显著更新的事件 URL 加入提交列表。
- 删除 URL 在清除缓存、移出 sitemap 并返回 `410/404` 后再通知 IndexNow。

### 实现

- 提供可访问的 UTF-8 IndexNow key 文件及明确的 `keyLocation`。
- 批量 POST 到 `https://api.indexnow.org/indexnow`。
- IndexNow 提交是异步、尽力而为的发布步骤；200/202 只表示接收，不表示保证收录。
- 对失败请求做有限重试与结构化日志，不阻塞抓取成功响应。

### 完成信号

- key 文件可由公网读取，错误 key 会被测试拒绝。
- 提交列表经过本站 host、协议、canonical、去重和数量校验。
- 日志记录批次、URL 数量、HTTP 状态和时间，不记录任何密钥。
- Bing Webmaster Tools 可观察到提交或抓取信号；不声称 IndexNow 会通知 Google。

## 发布顺序与故障边界

每次抓取后的执行顺序固定为：

1. 云端 Supabase 写入和来源状态更新成功。
2. 生成本批次实际变化的本站 URL 清单。
3. Next.js tag/path 失效。
4. `/sitemap.xml` 失效。
5. Cloudflare 精确清除受影响 URL。
6. 小批量预热页面和 sitemap。
7. 异步提交 IndexNow。

数据库写入是主任务；缓存、预热和索引通知是独立发布结果。后续步骤失败时不得回滚数据库，也不得把已有真实数据替换为空状态。API 响应和日志需要分别记录 ingestion、ISR、sitemap、Cloudflare 与 IndexNow 状态，方便单独重试。

## 总体验收

- 新分类和新来源接入时无需复制缓存、sitemap 或 IndexNow 逻辑，只需注册 section/source 元数据。
- AI 2 小时、其他分区 6 小时的抓取周期与 ISR 兜底周期一致，Cron 继续错峰。
- Cloudflare 规则未启用或第三方通知失败时，站点仍可通过 Next.js ISR 和 Supabase 正常工作。
- 搜索引擎看到稳定、可索引、有独立价值的本站页面，而不是第三方薄内容镜像。
- 所有密钥仅存于部署环境，不打印、不提交、不写入开发文档。
