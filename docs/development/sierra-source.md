# Sierra Blog 全文来源

## 背景

[Sierra 官方 RSS](https://sierra.ai/rss.xml)（对应官网 [News & Blog](https://sierra.ai/blog) 页面）提供 `147` 篇英文文章的标题、发布时间、作者和短摘要，不含文章全文与内嵌媒体。为在站内提供完整图文、表格和音视频链接阅读体验，沿用 Modal 和 ElevenLabs 的标准接入路径：在自建 `RSSHub` 上线 `/sierra/blog` 全文路由，并在 `rss-site` 的 AI 分区完成接入与生产调度注册。

## 范围

- 自建 `RSSHub` 路由 `/sierra/blog` 读取官方 RSS 发现条目，并发抓取文章详情页右栏正文、封面图、JSON-LD 结构化作者、表格、Wistia/YouTube 嵌入、Sanity `mediaResponsiveVideo` 视频文件地址及超大内联 `iframe[srcdoc]` 交互图外链。
- `rss-site` 的 AI 分区注册 `sierra`（`itemLimit: 20`、`rsshubPath: '/sierra/blog'`、`isArticle: true`、`cronSchedule: '0 0,6,12,18 * * *'`），新增官网提取矢量图标 `apps/web/public/source-icons/sierra.svg` 并注册至 `apps/web/components/source-icon.tsx`。
- ECS PostgreSQL 新增迁移 `deploy/postgres/migrations/016-sierra-source.sql`（由其接管 `015-elevenlabs-source.sql` 的全量来源约束），同步更新 `deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json` 与 `deploy/server/verify-release-runtime`，发布后由 `sync-business-cron --activate-unverified` 自动试抓并启用 Cron 任务。

## 验收标准

- 自建 `RSSHub` 公网 `/sierra/blog?limit=1`、默认 `/sierra/blog`（`20` 条）与 `/sierra/blog?limit=100&format=json` 均返回 HTTP `200`，本地全量 `?limit=150` 覆盖全部 `147` 篇官方文章且无空正文、无未解包 `/-/cdn/image`、无遗留 `<button>`/`<script>`/`<svg>` 或无效 `<video>`。
- `ingestSignal` 对公网 Feed `https://rss.ljhboard.cn/sierra/blog` 生成 `20` 条有唯一 URL、发布时间、作者、封面与正文的记录，全部通过 `renderArticleContent` 清洗且字节大小在数据库 `524,288` 字节限制之内。
- 全仓 `biome check .`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs` 与 `deploy/server/test-release-packaging.py` 全部通过。

## 可行性

复用已通过评审与线上验收的 Modal（`PR #102`）及 ElevenLabs（`PR #104`）单源 AI 博客接入方案，不新增前端页面，无 UI 交互变更或未决架构分歧；经实证排查结论为**可行**，关键技术瓶颈及对策如下：

- **官网并发 TLS 握手超时风险**：实测冷连接偶发前置 TLS 断开，且原定 route 级 `10s` 总超时可能在重试过程中打断整批请求；已在 `RSSHub` 路由去掉局部 `timeout`/`retry` 覆盖，交给全局 `ofetch` 重试与实例缓存处理，`DETAIL_CONCURRENCY = 5` 且 `rss-site` 单次 `itemLimit = 20`。
- **`iframe[srcdoc]` 超大载荷触发数据库/阅读器 512 KiB 拦截**：例如 `mossy` 等交互可视化文章含 `1.25 MB` 与 `1.85 MB` `srcdoc` 文档，若直接入库将触发 `signal_articles_content_html_check`（`<= 524,288` B）及 `renderArticleContent` 清空正文；已在 `RSSHub` 端将无 `src` 的 `srcdoc` 嵌入替换为带标题的原文交互图外链，实测全部 `147` 篇正文在 `994`–`17,166` 字节之间。
- **缺省封面与隐式视频资产**：个别文章（如 `ai-agents-in-action-chime`）缺少 `og:image` 与 JSON-LD `image`，已按 `og:image -> JSON-LD image -> 正文首图` 兜底；部分文章（`sierra-speaks`、`shipping-and-scaling-ai-agents`）在 SSR `<video>` 不含 `src`，已由 `__next_f` RSC 负载提取 Sanity 文件 CDN `.mp4`/`.webm` 地址并附播放外链。
- **品牌图标缺失**：`react-icons/si` 与 `simple-icons` 均未收录 Sierra，已从官网矢量标志提取纯松果路径生成单色 `#006838` SVG `apps/web/public/source-icons/sierra.svg`。

## 实现

- `RSSHub` 分支 `feat/sierra-blog` 提交 `f07a8fd4ae`（新增 `lib/routes/sierra/{namespace.ts,blog.ts,templates/description.tsx}`）已 cherry-pick 至自建主分支 `master` @ `8e0c31ccb2` 并由 Vercel 自动发布上线：[公网 Feed](https://rss.ljhboard.cn/sierra/blog)。
- `rss-site` 在 `packages/signals/src/index.ts` 的 `aiSources` 注册 `sierra`（`code: 'SR'`、`itemLimit: 20`、`rsshubPath: '/sierra/blog'`、`cronSchedule: '0 0,6,12,18 * * *'`、`cronJobName: 'signal-ingest-sierra'`），并追加至 `cronSourceOrder`；同步更新 `packages/signals/src/index.test.ts`（`84` 个总源、`27` 个 AI 源）。
- 在 `apps/web/public/source-icons/sierra.svg` 与 `apps/web/components/source-icon.tsx` 注册 `sierra` 图标。
- 在 `deploy/postgres/migrations/016-sierra-source.sql` 重放 4 张表约束，标注 `015-elevenlabs-source.sql` 已被覆盖；同步 `deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json`（`87` 项任务，含 `signal-ingest-sierra`）及 `deploy/server/verify-release-runtime` 预期计数（`87` / `89`）。

## 验证

- **RSSHub 本地与公网验证**：
  - 本地 `RSSHub` `oxfmt`、`oxlint --type-aware --config=.oxlintrc.ci.json --deny-warnings`（`0` 警告 `0` 错误）、`eslint`、`lizard -C 10`、`tsc --noEmit`、`build:docs`、`RSSHub-docs` 浏览器可视化检查与 `codex review`（`No actionable defects found`）均通过；本地 `?limit=1`、`20`、`?limit=100`、`?limit=150`（全部 `147` 篇）均为 HTTP `200` 且 `0` 异常。
  - 自建公网 `https://rss.ljhboard.cn/sierra/blog?limit=1`（`6,722` B / `1` 条）、默认（`115,995` B / `20` 条）与 `?limit=100&format=json`（`627,829` B / `100` 条）全部返回 HTTP `200`。
- **`rss-site` 采集与仓库门禁验证**：
  - 基于公网 Feed 调用 `ingestSignal` 写入内存存储（证据见 [sierra-local-20261120.json](evidence/sierra-local-20261120.json)）：入库 `20/20` 唯一文章、`fullBodyMatches: 20`、`renderedNonEmpty: 20`（全部通过 `renderArticleContent`）、`publicationDatesVerified: 20`、`namedAuthors: 20`、`coverImages: 20`、`badImageUrls: 0`、`maxContentHtmlBytes: 11,580`。
  - 全仓验证：`pnpm lint`（`374` 文件通过）、`pnpm check-types`（`3/3` 包通过）、`pnpm test`（`@rss-site/signals` `9 passed`，`@rss-site/api` `123 passed`，`@rss-site/web` `192 passed | 22 skipped`，共 `324 passed | 22 skipped`）、`pnpm build`（生成 `95/95` 静态页 + `early-hints` + `sw.js`）、`CRON_SECRET=ci-cron-only bun apps/web/scripts/render-cron-sql.mjs`（`350` 行含 `016-sierra-source.sql` 与 `signal-ingest-sierra`）、`wsl python3 -B deploy/server/test-release-packaging.py -v`（`8/8 OK`）与 `wsl bash -n deploy/server/verify-release-runtime` 均通过。
  - 无未闭环的后续跟进事项，因此不单建 roadmap 文档。生产库迁移与自动试抓启用随 PR 合并发布后由 `sync-business-cron --activate-unverified` 执行并做线上回归验收。

## 风险

- 若 Sierra 后续改版官网 `<article>` 分栏 DOM 或 Sanity 视频 RSC 字段结构，需同步复核 `RSSHub` `/sierra/blog` 选择器。
- `sierra.ai` 偶发国际链路冷连接 TLS 握手抖动；已依赖 `RSSHub` 全局重试、并发限流（`5`）及公网缓存缓解，生产首次试抓若遇上游瞬时错误，`sync-business-cron --activate-unverified` 会保留禁用而不回滚版本，可事后重跑验证激活。
