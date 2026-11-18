# OpenAI Developers Blog 合并接入（`openai`）

## Background

`OpenAI Developers Blog`（`https://developers.openai.com/blog`）此前未接入 `rss-site`，且上游 `DIYgod/RSSHub` 的 `lib/routes/openai` 仅涵盖 `news`、`research`、`cookbook` 与 `chatgpt`。

伴随自建 `RSSHub`（`feat/openai-developers-blog` @ `0f560af02`，已 cherry-pick 至 `ljh12138164/RSSHub` `master` @ `41e91be7e`，Vercel Production 部署 `7875810449` 于 `2026-11-18T06:17:07Z` 完成）上线 `/openai/developers/blog/:lang?` 全文路由：基于 Astro SSR HTML 列表页与正文页解析全量 35 篇工程文章（默认英文，支持 `zh-Hans` 等语言变体），过滤动态 OG 卡片封面并通过 JSX 模板保留代码块、表格与文章图片；现按**方案 A**将该子源合并入 `rss-site` `ai` 分区既有的 `openai` 来源中。

## Scope

- 更新 `@rss-site/signals`（`packages/signals/src/index.ts` 与 `packages/signals/src/index.test.ts`）中既有的 `openai` 来源配置：
  - `description` 更新为 `'官方新闻与开发者工程博客，英文全文'`
  - `itemLimit` 从 `20` 提升至 `30`（与同分区的 `minimax` 等多 Feed 来源一致；实测 `/openai/news?limit=20` 高频发布期间，若维持 `20` 会导致 `developers.openai.com/blog` 在合并排序截断后被完全挤出，调整为 `30` 后可稳定保留前 `10–20` 篇开发者工程文章）
  - 将单源 `rsshubPath: '/openai/news?limit=20'` 替换为 `feeds: [{ rsshubPath: '/openai/news?limit=20' }, { rsshubPath: '/openai/developers/blog?limit=20' }]`
  - 保留 `id: 'openai'`、`section: 'ai'`、`cronSchedule: '0 */2 * * *'` 与 `cronJobName: 'signal-ingest-openai'`
- 生成本地真实 `ingestSignal` 合并入库验证证据 [openai-developers-local-20261118.json](evidence/openai-developers-local-20261118.json)。
- 更新 [rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md) 与 [HERMES.md](../../HERMES.md)。

## Out of scope

- 不新增独立 source ID，不改动 `deploy/postgres/migrations/`、`deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json` 与 `deploy/server/verify-release-runtime`（全站仍为 `53` 个信号源、`56` 项业务 Cron 任务；数据库 `hot_items_position_check` 仅约束 `"position" > 0`，无 `<= 20` 上限）。
- 不修改 `apps/web/lib/source-page-text.ts`（`openai` 既定页头 `'OpenAI 最新动态与官方文章'` 已准确覆盖新闻与开发者工程博客）。
- 不修改 `shared/openai-content.ts` 针对 `openai.com` 的专属清洗规则（`developers.openai.com` 文章自然走通用安全 HTML 清洗）。
- 不提前操作生产数据库，不从工具向上游 `DIYgod/RSSHub` 提交 PR。

## Acceptance criteria

- `@rss-site/signals` 单元测试确认 `getSignalSource('openai').itemLimit === 30`、`resolveSignalFeedUrl(openai, base)` 返回 `/openai/news?limit=20`、`resolveSignalFeedUrls(openai, base)` 返回 `/openai/news?limit=20` 与 `/openai/developers/blog?limit=20`。
- 本地针对线上真实双 Feed 运行 `ingestSignal` 可成功去重合并、按时间倒序截断并输出 `30` 条唯一文章（`openai.com` `20` 条 + `developers.openai.com` `10` 条），`renderArticleContent` 渲染非空且无异常图片 URL 或动态 OG 文字卡片。
- `pnpm format:check`、`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py` 全部通过。

## Feasibility

- 已于 `2026-11-18` 实测线上自建 `RSSHub`（`41e91be7e`）：
  - `https://rss.ljhboard.cn/openai/developers/blog?limit=1`：HTTP `200`、`28,169` bytes、`1` item
  - `https://rss.ljhboard.cn/openai/developers/blog`：HTTP `200`、`555,239` bytes（后续全量合并验证时 `555,248` bytes）、`20` items
  - `https://rss.ljhboard.cn/openai/developers/blog?limit=100`：HTTP `200`、`957,971` bytes、`35` items
  - `https://rss.ljhboard.cn/openai/developers/blog/zh-Hans?limit=5`：HTTP `200`、`206,092` bytes、`5` items
  - `https://rss.ljhboard.cn/openai/news?limit=20`：HTTP `200`、`1,002,973` bytes、`20` items
- 已核对 `server/api/src/ingestion/ingest.ts` 的 `feeds` 并发抓取与基于 URL 的 `Map` 去重排序逻辑，以及 `apps/web/lib/article-content.ts` + `shared/openai-content.ts`（按 `hostname === 'openai.com'` 分支），`developers.openai.com` 正文渲染兼容。

## Implementation

- **Registry & Tests**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)
  - [packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)
- **Evidence & Docs**：
  - [openai-developers-local-20261118.json](evidence/openai-developers-local-20261118.json)
  - [openai-developers-source.md](openai-developers-source.md)
  - [rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md)
  - [HERMES.md](../../HERMES.md)

## Verification

- **真实双 Feed 与 `ingestSignal` 本地端到端校验**（[openai-developers-local-20261118.json](evidence/openai-developers-local-20261118.json)）：
  - `feedUrls`：`["https://rss.ljhboard.cn/openai/news?limit=20", "https://rss.ljhboard.cn/openai/developers/blog?limit=20"]`
  - `feedByteLengths`：`[1002973, 555248]`
  - `parsedAndIngestedItems`：`30`（`hostBreakdown`：`openai.com: 20`、`developers.openai.com: 10`）
  - `fullBodyMatches`：`30`、`renderedBodyMatches`：`30`、`publicationDatesVerified`：`30`
  - `namedAuthors`：`12`（其中 `devBlogMetrics.namedAuthors`：`10/10`）、`coverImages`：`18`（其中 `devBlogMetrics.coverImages`：`10/10`）、`badImageUrls`：`0`
  - `maxContentHtmlBytes`：`101046`、`uniqueUrls`：`30`、`consecutiveRanks`：`true`、`manifestMatchesRegistry`：`true`
- **代码格式、类型、测试、构建与发布校验**：
  - `pnpm format:check`：通过（Checked 355 files）
  - `pnpm lint`（`biome check .`）：通过（Checked 369 files）
  - `pnpm check-types`：`Tasks: 3 successful, 3 total`（`14.725s`）
  - `pnpm test`：`Tasks: 3 successful, 3 total`（`@rss-site/signals` `1` 文件 `9 passed`；`@rss-site/api` `15` 文件 `118 passed`；`@rss-site/web` `42 passed | 4 skipped (46)` / `192 passed | 22 skipped (214)`，跳过项为 4 个依赖本地 Docker DB/Redis 的集成测试文件；合计 `319 passed | 22 skipped`）
  - `pnpm build`：`Tasks: 2 successful, 2 total`（`@rss-site/api` `tsc --noEmit`；`@rss-site/web` 生成 `64/64` 静态页面，`sw.js` `1 precached file, 1534 bytes`）
  - `CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs`：`chars=24872`、`hasOpenai=True`、`hasTopLevelSelectActivate=False`
  - `bash -n deploy/server/verify-release-runtime`：退出码 `0`
  - `wsl python3 -B deploy/server/test-release-packaging.py -v`：`Ran 8 tests in 0.149s ... OK`

## Review

- **Blocking findings**：`0`
- **Accepted follow-ups**：`0`
- 复用既有的 `'openai'` source ID 与 `'signal-ingest-openai'` Cron 任务名及调度周期（`0 */2 * * *`），无需数据库 `CHECK` 约束迁移或生产 Cron 重验，上线后既有调度自动拉取双 Feed 合并结果。

## Delivery

- 待评审与合并分支：`feat/openai-developers-source` -> `master`（通过 `gh pr create` 创建 PR）。

## Risks

- **备用 `RSSHub` 实例同步**：自建主分叉 `ljh12138164/RSSHub`（`rss.ljhboard.cn`）已包含 `41e91be7e`，但备用分叉 `ljh-project/RSSHub`（`rss1.ljhboard.cn`）需在 GitHub 上手动点击 **Sync fork** 后才会同步 `/openai/developers/blog`。
- **高频公告期截断权重**：在 `openai.com/news` 集中发布期间，Top 30 为 `20` 篇 news + `10` 篇开发者博客；因 `openai/news` 上游固定 `?limit=20`，即使主站单日连续发新公告，仍保底至少 `10` 篇 `developers.openai.com/blog` 工程文章展示在 `/ai/openai` 中。
