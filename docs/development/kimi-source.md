# Kimi Source Integration (`ai`)

## Background

`Kimi`（月之暗面，`https://www.kimi.com/en/blog/`）是国内前沿大模型与智能体研究实验室之一，此前 `rss-site` 的 `ai` 分区尚未接入其官方研究博客与开源发布信源，且官网未提供原生 RSS/Atom feed。

伴随自建 `RSSHub`（`D:\code\RSSHub` `feat/kimi-blog` @ `a6c1a5100`，已同步部署至 `master` @ `c8477b403`）上线 `https://rss.ljhboard.cn/kimi/blog`，可稳定输出全量研究博文（含 Next.js Streaming Suspense 还原的评测表格、视频与数学公式）与开源发布记录（`20` 条/页），现将其接入 `rss-site` 的 `ai` 分区。

## Scope

- 在 `@rss-site/signals`（`packages/signals/src/index.ts` 与 `packages/signals/src/index.test.ts`）注册 `kimi` 来源到 `ai` 分区（全站总计 `52` 个来源、`ai` 分区 `14` 个来源；`itemLimit: 20`、`rsshubPath: '/kimi/blog'`、`cronSchedule: '40 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-kimi'`）。
- 保存官方品牌 PNG 图标 `apps/web/public/source-icons/kimi.png`（`7454` bytes），并在 `apps/web/components/source-icon.tsx` 的 `fileIcons` 注册 `'kimi'`。
- 新增 PostgreSQL 检查约束迁移 `deploy/postgres/migrations/011-kimi-source.sql`，同步更新 `deploy/postgres/baseline.sql`，并将 `deploy/postgres/migrations/010-80lv-source.sql` 标记为已被 `011-kimi-source.sql` 覆盖以保证重复发布与恢复幂等性。
- 更新 `deploy/server/business-jobs.json`（新增 `signal-ingest-kimi`，业务 Cron 任务总数更新为 `55`：51 条 signal 抓取任务 + 4 条维护任务）及 `deploy/server/verify-release-runtime` 校验计数（`private.business_cron_jobs = 55`、`cron.job = 57`）。
- 基于线上 `https://rss.ljhboard.cn/kimi/blog` 与真实 `ingestSignal` 管道生成本地验证证据 `docs/development/evidence/kimi-local-20261116.json`，并同步更新 `docs/research/rsshub-route-candidates-and-workflow.md` 与 `HERMES.md`。

## Out of scope

- 不修改现有 13 个 `ai` 分区来源配置或站内文章阅读器渲染逻辑。
- 不在本地手动修改生产数据库或提前启用 `signal-ingest-kimi`（新任务按 PR `#91` 自动激活机制随 CI 发布至 ECS 后由 `sync-business-cron --activate-unverified` 自动试抓并激活）。
- 不从工具直接向上游 `DIYgod/RSSHub` 提交 PR。

## Acceptance criteria

- `@rss-site/signals` 单元测试确认 `SIGNAL_SOURCES` 与 `SIGNAL_CRON_JOBS` 总数为 `52`、`ai` 分区为 `14`，且 `isSignalSourceId('kimi')` 与 `resolveSignalFeedUrl(getSignalSource('kimi'), 'https://rss.ljhboard.cn')` 断言通过。
- 本地针对真实 feed `https://rss.ljhboard.cn/kimi/blog` 运行 `ingestSignal` 可稳定解析并入库 `20` 条唯一文章，均含非空正文、合法时间、作者、封面图且无异常图片 URL。
- `biome check`、`check-types`、`test`、`build`、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py` 全部通过。
- 合并并发布到生产 ECS 后，CI 自动触发 `sync-business-cron --activate-unverified` 验证 `/cron/signals/kimi` 与 `/cron/verify/kimi` 并启用 `signal-ingest-kimi`。

## Feasibility

- 已于 `2026-11-16` 实测线上自建实例 `https://rss.ljhboard.cn/kimi/blog` 返回 HTTP `200`（`6606` ms、`909357` bytes、`20` items），`?limit=1` 返回 HTTP `200`（`2437` ms、`37444` bytes、`1` item），无鉴权或反爬阻塞。
- 既有 4 张业务表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）检查约束与 `008`/`010` 迁移模式一致，`011-kimi-source.sql` 可安全重放。

## Implementation

- **Registry & Web UI**：
  - `packages/signals/src/index.ts`、`packages/signals/src/index.test.ts`
  - `apps/web/public/source-icons/kimi.png`、`apps/web/components/source-icon.tsx`
- **Database & Cron Packaging**：
  - `deploy/postgres/migrations/011-kimi-source.sql`、`deploy/postgres/migrations/010-80lv-source.sql`、`deploy/postgres/baseline.sql`
  - `deploy/server/business-jobs.json`、`deploy/server/verify-release-runtime`
- **Evidence & Docs**：
  - `docs/development/evidence/kimi-local-20261116.json`、`docs/development/kimi-source.md`、`docs/research/rsshub-route-candidates-and-workflow.md`、`HERMES.md`

## Verification

- **真实 feed 与 `ingestSignal` 本地端到端校验**（证据文件 `docs/development/evidence/kimi-local-20261116.json`）：
  - `feedUrls`: `["https://rss.ljhboard.cn/kimi/blog"]`
  - `feedByteLengths`: `[910484]`
  - `parsedItems`: `20`、`fullBodyMatches`: `20`、`publicationDatesVerified`: `20`、`namedAuthors`: `20`、`coverImages`: `20`、`badImageUrls`: `0`
  - `maxContentHtmlBytes`: `93589`、`ingestedItems`: `20`、`uniqueUrls`: `20`、`consecutiveRanks`: `true`
  - `manifestMatchesRegistry`: `true`、`releaseSqlIncludesSourceMigration`: `true`、`automaticActivation`: `false`、`productionDatabaseVerified`: `false`
- **代码风格、打包与类型/测试/构建**：
  - `pnpm exec biome check packages/signals/src/index.ts packages/signals/src/index.test.ts apps/web/components/source-icon.tsx deploy/server/business-jobs.json docs/development/evidence/kimi-local-20261116.json`：`Checked 5 files in 13ms. No fixes applied.`
  - `CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs`：`chars=24245`、`hasKimi=True`、无顶层 `select private.activate_*` 调用（`hasTopLevelSelectActivate=False`）
  - `C:\Program Files\Git\bin\bash.exe -n deploy/server/verify-release-runtime`：退出码 `0`
  - `wsl python3 -B deploy/server/test-release-packaging.py -v`：`Ran 8 tests in 0.142s ... OK`
  - `pnpm check-types`：`Tasks: 3 successful, 3 total`
  - `pnpm test`：`Tasks: 3 successful, 3 total`（`@rss-site/signals` `1` 文件 `8 passed`；`@rss-site/api` `15` 文件 `118 passed`；`@rss-site/web` `42 passed | 4 skipped (46)` / `192 passed | 22 skipped (214)`，跳过项为 4 个依赖 Docker DB/Redis 的集成测试文件；合计 `318 passed | 22 skipped`）
  - `pnpm build`：`Tasks: 2 successful, 2 total`（`@rss-site/api` `tsc --noEmit`；`@rss-site/web` 生成 `63/63` 静态页面，`sw.js` `1 precached file, 1534 bytes`）

## Review

- **Blocking findings**: `0`
- **Accepted follow-ups**: `0`（不额外创建空 roadmap）
- 已核对 `render-cron-sql.mjs` 输出包含 `signal-ingest-kimi` 且不含顶层 `select private.activate_*` 语句，新源 Cron 任务保持 `verified = false` 直至部署后自动验收通过。

## Risks

- 备用 `RSSHub` fork（`ljh-project/RSSHub`）当前停留在 `be81ea575`，尚未同步主分叉 `c8477b403`；当前主站消费 `https://rss.ljhboard.cn` 不受影响，如需切换备用实例 `rss1.ljhboard.cn` 需先点击 **Sync fork**。
- `Kimi Research Blog` 页面包含 `10` 条外链开源发布（`GitHub` / `HuggingFace` / `moonshotai.github.io`）；若外链站点在抓包时偶发限流，RSSHub 侧会降级为封面+摘要且不写入长期失败缓存，确保整条 feed 稳定可用。
