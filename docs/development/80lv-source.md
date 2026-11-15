# 80lv Source Integration (`games`)

## Background

`80 Level` (`https://80.lv/articles/`) 是聚焦海外游戏美术、VFX、实时图形技术与开发者专访的重要行业媒体。此前 `rss-site` 的 `games` 分区包含 6 个中文游戏资讯源，缺少面向英文一线游戏开发与技术美术团队的全文信源。

伴随自建 `RSSHub`（`D:\code\RSSHub` `feat/80lv` @ `01c11aa27`，已同步发布至 `master` @ `dba5a9557`）上线 `https://rss.ljhboard.cn/80lv/articles?limit=30`，可稳定输出含完整图文正文、作者与发布时间的 RSS feed，现将其接入 `rss-site` 的 `games` 分区。

## Scope

- 在 `@rss-site/signals`（`packages/signals/src/index.ts` 与 `packages/signals/src/index.test.ts`）注册 `80lv` 来源到 `games` 分区（总计 `51` 个来源、`games` 分区 `7` 个来源、`cronSchedule: '35 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-80lv'`、`rsshubPath: '/80lv/articles?limit=30'`）。
- 保存官方源图标 `apps/web/public/source-icons/80lv.png`（`6422` bytes，`192x192`），在 `apps/web/components/source-icon.tsx` 注册 `'80lv'`，并更新 `apps/web/app/games/page.tsx` 的 `metadata.description`。
- 新增 PostgreSQL 检查约束迁移 `deploy/postgres/migrations/010-80lv-source.sql`，同步更新 `deploy/postgres/baseline.sql`，并在 `deploy/postgres/migrations/008-minimax-source.sql` 添加注释声明其约束已被 `010-80lv-source.sql` 覆盖以保证重复发布幂等性。
- 更新 `deploy/server/business-jobs.json`（新增 `signal-ingest-80lv`，业务 Cron 任务总数更新为 `54`：50 条 signal 抓取任务 + 4 条维护任务）及 `deploy/server/verify-release-runtime` 校验计数（`private.business_cron_jobs = 54`、`cron.job = 56`）。
- 记录基于实时 RSS 输出与真实 `ingestSignal` 解析流程的本地证据 `docs/development/evidence/80lv-local-20261115.json`，并同步更新 `docs/research/rsshub-route-candidates-and-workflow.md` 与 `HERMES.md`。

## Out of scope

- 不修改现有 6 个 `games` 分区来源配置或抓取逻辑。
- 不在本地手动修改生产数据库或提前启用 `signal-ingest-80lv`（新源按 PR `#91` 自动激活流程随 CI 发布至 ECS 后由 `sync-business-cron --activate-unverified` 自动试抓并激活）。
- 不在本阶段直接向 `DIYgod/RSSHub` 上游提交 PR。

## Acceptance criteria

- `@rss-site/signals` 单元测试确认 `SIGNAL_SOURCES` 总数为 `51`、`games` 分区为 `7`，且 `isSignalSourceId('80lv')` 与 `resolveSignalFeedUrl(getSignalSource('80lv'), 'https://rss.ljhboard.cn')` 断言通过。
- 本地针对真实 feed `https://rss.ljhboard.cn/80lv/articles?limit=30` 运行 `ingestSignal` 可稳定入库 `30` 条唯一文章，无异常图片 URL 或空正文。
- `biome check`、`check-types`、`test`、`build`、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py` 全部通过。
- 合并并发布到生产 ECS 后，CI 自动触发 `sync-business-cron --activate-unverified` 验证 `/cron/signals/80lv` 与 `/cron/verify/80lv` 并启用 `signal-ingest-80lv`。

## Feasibility

- 已于 `2026-11-15` 实测线上自建实例 `https://rss.ljhboard.cn/80lv/articles?limit=30` 返回 HTTP `200`（`2805` ms、`276559` bytes、`30` items），无鉴权或反爬阻塞。
- 既有 4 张核心业务表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）的 `CHECK` 约束更新模式已在 `007-cohere-source.sql` 与 `008-minimax-source.sql` 验证，新增 `010-80lv-source.sql` 可安全重放。

## Implementation

- **Registry & Web UI**：
  - `packages/signals/src/index.ts`、`packages/signals/src/index.test.ts`
  - `apps/web/public/source-icons/80lv.png`、`apps/web/components/source-icon.tsx`、`apps/web/app/games/page.tsx`
- **Database & Cron Packaging**：
  - `deploy/postgres/migrations/010-80lv-source.sql`、`deploy/postgres/migrations/008-minimax-source.sql`、`deploy/postgres/baseline.sql`
  - `deploy/server/business-jobs.json`、`deploy/server/verify-release-runtime`
- **Evidence & Docs**：
  - `docs/development/evidence/80lv-local-20261115.json`、`docs/development/80lv-source.md`、`docs/research/rsshub-route-candidates-and-workflow.md`、`HERMES.md`

## Verification

- **真实 feed 与 `ingestSignal` 本地端到端校验**（证据文件 `docs/development/evidence/80lv-local-20261115.json`）：
  - `feedUrls`: `["https://rss.ljhboard.cn/80lv/articles?limit=30"]`
  - `feedByteLengths`: `[276559]`
  - `parsedItems`: `30`、`fullBodyMatches`: `30`、`publicationDatesVerified`: `30`、`namedAuthors`: `30`、`coverImages`: `30`、`badImageUrls`: `0`
  - `maxContentHtmlBytes`: `26253`、`ingestedItems`: `30`、`uniqueUrls`: `30`、`consecutiveRanks`: `true`
  - `manifestMatchesRegistry`: `true`、`releaseSqlIncludesSourceMigration`: `true`、`automaticActivation`: `false`、`productionDatabaseVerified`: `false`
- **代码风格、打包与类型/测试/构建**：
  - `pnpm exec biome check packages/signals/src/index.ts packages/signals/src/index.test.ts apps/web/components/source-icon.tsx apps/web/app/games/page.tsx deploy/server/business-jobs.json docs/development/evidence/80lv-local-20261115.json`：`Checked 6 files in 17ms. No fixes applied.`
  - `CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs`：`chars=23961`、`has80lv=True`、无顶层 `select private.activate_*` 调用（`hasTopLevelSelectActivate=False`）
  - `C:\Program Files\Git\bin\bash.exe -n deploy/server/verify-release-runtime`：退出码 `0`
  - `wsl python3 -B deploy/server/test-release-packaging.py -v`：`Ran 8 tests in 0.168s ... OK`
  - `pnpm check-types`：`Tasks: 3 successful, 3 total`
  - `pnpm test`：`Tasks: 3 successful, 3 total`（`@rss-site/signals` `8 passed`；`@rss-site/api` `118 passed`；`@rss-site/web` `192 passed | 22 skipped`，含 4 个依赖 Docker DB/Redis 的跳过集成测试文件；合计 `318 passed | 22 skipped`）
  - `pnpm build`：`Tasks: 2 successful, 2 total`（`@rss-site/api` `tsc --noEmit`；`@rss-site/web` 生成 `62/62` 静态页面，`sw.js` `1 precached file, 1534 bytes`）

## Review

- **Blocking findings**: `0`
- **Accepted follow-ups**: `0`（不额外创建空的 roadmap 文档）
- 核对 `render-cron-sql.mjs` 输出确认不包含顶层自动激活语句（`hasActivateTopLevel=False`），新任务在发布初期保持 `verified = false`，符合生产准入门禁。

## Risks

- 备用 `RSSHub` fork（`ljh-project/RSSHub`）当前停留在 `be81ea575`，尚未同步主 fork 的 `dba5a9557`；当前生产源使用 `https://rss.ljhboard.cn` 不受影响，若后续切换至备用实例需先同步 fork。
- 若合并发布时 `80.lv` 上游发生瞬时抖动导致 `sync-business-cron --activate-unverified` 未激活 `signal-ingest-80lv`，发布流程不会回滚，可在 ECS 恢复后按 `AGENTS.md` 补跑 `sudo /usr/local/sbin/sync-business-cron --activate-unverified`。
