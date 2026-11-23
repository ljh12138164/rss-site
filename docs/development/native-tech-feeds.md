# 科技专区 15 路原生全文 RSS 接入

## Background

继 [候选来源原生 Feed 采集](native-feed-ingestion.md) 之后，针对 [JackyST0/awesome-rsshub-routes](https://github.com/JackyST0/awesome-rsshub-routes) 收录订阅源的实测筛选与 Codex Review 二轮复核确认：**15 路活跃更新且自带完整正文与发布时间的官方原生 RSS/Atom**（14 个海外编程/工程/周刊/安全/科技媒体源 + 阮一峰科技爱好者周刊）具备长期高质量直连接入条件；原本一并评估的 `ByteByteGo`（含 `4/20` 篇付费预览截断 `"Read more"` 条目及课程促销）与 `Dev.to`（`https://dev.to/feed` 为 6–9 分钟级未过滤全站流、含加密货币推广帖且官方无 `/top` RSS）已按质量门禁剔除。

在北京生产 ECS（`i-2ze77shgsxr3nwn6ghra`、`rss-site-web-1` 容器）通过 `alibabacloud-workbench-cli` 实地验证后，确认这 15 个源均可由 ECS 直接连通（海外 14 路两轮全数 HTTP `200`、耗时 `82ms–2,014ms`，无 DNS 污染；阮一峰周刊走 Cloudflare `172.67.200.141` 偶发首包抖动但 `30s` 超时内可正常返回 `200`），无需写入 [deploy/feed-relay](../../deploy/feed-relay/index.ts)（Cloudflare Worker）。同时更新 [RSSHub 候选与交付工作流](../research/rsshub-route-candidates-and-workflow.md)，记录本次调研出的“官方 RSS 缺正文”新候选（`Supabase`、`Deno`、`Astro`、`Nuxt`、`Chrome Developer`、`Stripe`、`Spotify`、`AIHOT 日报` 等）以及需要修复的现有上游路由（`/nextjs/blog`、`/deepmind/blog`、`/google/developers/:locale?`、`/meta/ai/blog`）。

## Scope

- 在 `packages/signals/src/index.ts` 的 `technologySources` 末尾及 `cronSourceOrder` 注册 15 个直连原生全文来源（`itemLimit: 20`，`isArticle: true`，每 12 小时在 UTC `4,16` 空闲分钟错峰调度）：
  - `rust-blog`、`go-blog`、`svelte-blog`、`typescript-blog`、`swift-blog`、`kotlin-blog`
  - `netflix-tech`、`meta-engineering`、`smashing-magazine`
  - `js-weekly`、`golang-weekly`、`this-week-in-rust`、`krebs-security`、`mit-tech-review`、`ruanyifeng`
- 在 `packages/signals/src/index.test.ts` 更新分区计数（`technologySources: 40`、`technologyArticleSources: 39`、`signalSources: 101`、`SIGNAL_CRON_JOBS: 101`）与新来源单测断言。
- 在 `apps/web/components/source-icon.tsx` 为 `react-icons/si` 已覆盖的 9 个品牌源配置图标（`SiRust`、`SiGo`、`SiSvelte`、`SiTypescript`、`SiSwift`、`SiKotlin`、`SiNetflix`、`SiMeta`、`SiSmashingmagazine`），其余 6 个源沿用 `code` 徽标回退。
- 新增 `deploy/postgres/migrations/019-native-tech-feeds.sql`（标注 `018-together-source.sql` 已被覆盖），同步更新 `deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json`（总计 `104` 项任务）与 `deploy/server/verify-release-runtime` 预期计数（`104` / `106`）。
- 留存 15 路真实 Feed 的本地 `ingestSignal` + `renderArticleContent` 校验非敏感证据 `docs/development/evidence/native-tech-feeds-local-20261123.json`。
- 更新 `docs/research/rsshub-route-candidates-and-workflow.md` 基线、已接入/淘汰清单与 RSSHub 待新建/待修复路由清单，并更新 `HERMES.md`。

## Out of scope

- 不写入 `deploy/feed-relay/index.ts`（本次 15 个源均已验证可由北京 ECS 直连，不占用 Cloudflare Worker 路由）。
- 不接入含付费截断预览的 `ByteByteGo` 与未过滤全局时间线 `Dev.to`。
- 不新增前端页面、路由或独立组件，不改变既有数据库 schema 结构或文章清洗/渲染安全策略。
- 本次不在 `RSSHub` 仓库编写或提交上述待新增/修复路由的代码或 PR。

## Acceptance criteria

- 15 个新增来源在真实原生 Feed 下通过 `ingestSignal` + `renderArticleContent`：每个来源返回非空、无尾部截断且 URL/`sourceKey` 唯一的批次、`100%` 条目含合法发布时间、单篇 `contentHtml` 不超过 `524,288` 字节、渲染 HTML 全数非空、无非法图片 URL。
- `deploy/server/business-jobs.json`（`104` 项，其中抓取 `100`、维护 `4`）与 `SIGNAL_CRON_JOBS`（`101` 项，不含 `chatgpt`）完全一致，全站 `100` 个抓取任务无分钟级时间碰撞。
- 全仓 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`deploy/server/test-release-packaging.py` 与 `verify-release-runtime` 语法检查通过，并已处理完 Codex review 全部阻塞项与 `[P2]` 意见。

## Feasibility

- **复用既有设计决策**：完全沿用 [候选来源原生 Feed 采集](native-feed-ingestion.md) 已评审确认的 `feedUrl` 直连采集、PostgreSQL CHECK 迁移覆盖与现有科技分区 UI 复用方案；无新增依赖、无新 UI 页面或样式体系变动。
- **北京 ECS 连通性实证**：2026-11-23 在生产 `rss-site-web-1` 容器内用 `bun` 以生产 `User-Agent` 发起两轮直连探测（每轮 `12s` 超时）：
  - 14 个海外活跃源两轮 `28/28` 次全部返回 HTTP `200`，响应时间 `82ms–2,014ms`，无 DNS 污染（`Meta Engineering` 走 `192.0.66.236` WP VIP IP，`Go Blog` 走 `216.239.32.21`）。
  - `阮一峰科技爱好者周刊`（`www.ruanyifeng.com`）解析到 Cloudflare `172.67.200.141` / `104.21.52.150`，首轮 `12s` 超时、随后两轮分别 `6,597ms` 与 `1,376ms` 返回 `200`；同节点基线对比 `feeds.ljhboard.cn` 同属 Cloudflare `172.67.130.237`（首轮同样 `12s` 超时、随后 `6,492ms` / `2,732ms` `200`），证明迁移到 CF Worker 并不能改善 Cloudflare 边缘节点抖动，由生产 `fetchSignalFeed` 自带的 `30,000ms` 超时窗口直连处理更合理。
- **解析与质量安全性**：15 个源按 `itemLimit: 20` 截断后全数 `truncatedTail = 0`（无 `"Read more"` / 会员截断尾注），纯文本长度跨度为合理文章/周刊区间，单篇 `contentHtml` 远低于 `524,288` B 上限，`Go Blog` 内含的 `<script src="/js/play.js">` 等标签由 `renderArticleContent` 既有 `sanitizeHtml` 剥离。

## Implementation

- [packages/signals/src/index.ts](../../packages/signals/src/index.ts)：将 `technologySources` 扩充至 `40` 路来源（新增 15 路 `isArticle: true`、`itemLimit: 20` 的直连原生全文源，调度均安排在 UTC `4,16 * *` 空闲分钟 `28–34, 37–38, 41–47`），并在 `cronSourceOrder` 末尾依次注册对应 ID。
- [packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)：更新全局计数断言（`signalSources: 101`、`SIGNAL_CRON_JOBS: 101`、`technologySources: 40`、`technologyArticleSources: 39`）并补充 `rust-blog`、`go-blog`、`netflix-tech`、`ruanyifeng` 等 ID 与 URL 解析单测。
- [apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx)：引入并配置 `SiRust`、`SiGo`、`SiSvelte`、`SiTypescript`、`SiSwift`、`SiKotlin`、`SiNetflix`、`SiMeta`、`SiSmashingmagazine`（其余 6 路沿用 `code` 徽标回退）。
- [deploy/postgres/migrations/019-native-tech-feeds.sql](../../deploy/postgres/migrations/019-native-tech-feeds.sql) 与 [deploy/postgres/migrations/018-together-source.sql](../../deploy/postgres/migrations/018-together-source.sql)：新增覆盖 `101` 路来源的 4 张表 CHECK 约束迁移，并标注 `018-together-source.sql` 已被 `019` 覆盖；同步更新 [deploy/postgres/baseline.sql](../../deploy/postgres/baseline.sql)。
- [deploy/server/business-jobs.json](../../deploy/server/business-jobs.json) 与 [deploy/server/verify-release-runtime](../../deploy/server/verify-release-runtime)：同步追加 15 个 `signal-ingest-*` 任务（总计 `104` 项业务任务，`SIGNAL_CRON_JOBS` 为 `101` 项含 `chatgpt`，维护任务 `4` 项，共 `100` 个抓取任务零分钟碰撞），并更新发布期运行时检查预期计数（`104` / `106`）。
- [docs/development/evidence/native-tech-feeds-local-20261123.json](evidence/native-tech-feeds-local-20261123.json)：留存 15 路真实原生 Feed 的 `ingestSignal` + `renderArticleContent` 全量校验快照。
- [docs/research/rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md)：同步基线为 `101` 源 / `104` 任务，收录已接入的 15 路原生全文源与淘汰说明（含 `ByteByteGo`、`Dev.to` 及其余伪可用/停更源），并整理 `Supabase`、`Deno`、`Astro`、`Nuxt`、`Chrome Developer`、`Stripe`、`Spotify`、`AIHOT 日报` 等“官方 RSS 缺正文”新候选及 `/nextjs/blog`、`/deepmind/blog`、`/google/developers/:locale?`、`/meta/ai/blog` 待修复现有上游路由。
- [HERMES.md](../../HERMES.md)：新增本次接入交接记录。
- 无遗留未完成 follow-up 事项，因此不额外创建空 roadmap 文档。

## Verification

- **Codex Review 与评审闭环**：
  - 执行单轮 `codex review --uncommitted -c 'model="gpt-6.2-sol"' -c 'model_reasoning_effort="high"'`：检出 2 条 `[P2]`（`ByteByteGo` 在全量 20 条中含 4 条付费会员 `"Read more"` 截断预览；`Dev.to` 全局 `dev.to/feed` 为 6 分钟时间窗内的未过滤全站流且混入推广帖）。按用户要求直接淘汰 `bytebytego` 与 `devto`，并对剩余 15 路逐一复核真实抓取条目（全数 `truncatedTail = 0`、无付费截断或短时广告流）。
- **北京生产 ECS 直连探测**（`rss-site-web-1` 容器，`12s` 超时两轮）：14 路海外活跃全文源 `28/28` 全部返回 HTTP `200`（`82ms–2,014ms`）；`ruanyifeng` 与同属 Cloudflare 的 `feeds.ljhboard.cn` 均表现为首轮 `12s` 超时、随后分别以 `6,597ms / 1,376ms` 与 `6,492ms / 2,732ms` 返回 `200`，由生产 `30,000ms` 超时直连即可覆盖。
- **本地全量采集证据**（[native-tech-feeds-local-20261123.json](evidence/native-tech-feeds-local-20261123.json)）：15/15 源首轮一次成功（`sourceCount: 15`、`totalIngestedItems: 156`、`allValid: true`），全量 Feed 体积 `70,737–1,990,708` B，单篇 `contentHtml` 最大 `114,059` B（低于 `524,288` B 约束），渲染 HTML 100% 非空，100% 含合法 `publishedAt`，`badImageUrls === 0`，URL/`sourceKey` 均无重复。
- **仓库检查（最终改动后实测）**：
  - `pnpm lint`（`biome check .`）：通过（`Checked 376 files in 330ms`）。
  - `pnpm check-types`：通过（`3/3` 包成功）。
  - `pnpm test`：`@rss-site/signals` `9/9` 通过；`@rss-site/api` `126/126` 通过（含 `cron.test.ts` 全量调度冲突与 `business-jobs.json` 对齐校验）；`@rss-site/web` `43` 个文件 `196` 项单元测试通过，4 个依赖数据库/Redis 的集成测试文件按环境预期跳过（`22` skipped）。
  - `pnpm build`：通过（`2/2` 包成功，`@rss-site/web` Next.js 生产构建含 `112` 个静态页面、`early-hints` 与 `sw.js` 生成成功）。
  - `render-cron-sql.mjs`：通过（输出 `356` 行，确认包含 `019-native-tech-feeds` 标注、已排除 `bytebytego`/`devto` 且包含 15 路新信号源任务）。
  - `wsl bash -n deploy/server/verify-release-runtime` 与 `wsl python3 -B deploy/server/test-release-packaging.py -v`：通过（`8/8` 测试通过）。

## Risks

- `www.ruanyifeng.com` 使用 Cloudflare CDN 边缘 IP，若北京 ECS 遭遇跨网段瞬时拥塞可能触发单次超时，但上线由 `sync-business-cron --activate-unverified` 增量验证兜底，单源失败不会回滚已健康版本。
- `deploy/postgres/migrations/019-native-tech-feeds.sql` 覆盖 `018-together-source.sql` 的 CHECK 约束，一旦库内写入新来源行，不可回放旧版约束，如需停用来源应使用前向迁移。
