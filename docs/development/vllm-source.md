# vLLM Source Integration (`ai`)

## Background

`vLLM`（`https://vllm.ai/blog`）官方仅提供摘要型 RSS/Atom feed（`https://vllm.ai/blog/rss.xml`，单条仅约百余词摘要，不含正文、代码、公式与图文），此前上游 `DIYgod/RSSHub` 尚无 `vllm` 命名空间与路由。

伴随自建 `RSSHub`（`feat/vllm-blog` @ `1d4bc5c9b`，已同步部署至 `master` @ `693346b62`）上线 `https://rss.ljhboard.cn/vllm/blog`，通过官方 `rss.xml` 发现条目并并发抓取文章正文页补全全文、保留 MathJax 公式/代码块/表格/视频与交互图表并过滤动态 `/og?` 文字卡片封面，现将其接入 `rss-site` 的 `ai` 分区。

## Scope

- 在 `@rss-site/signals`（`packages/signals/src/index.ts` 与 `packages/signals/src/index.test.ts`）注册 `vllm` 来源到 `ai` 分区（全站总计 `53` 个来源、`ai` 分区 `15` 个来源；`itemLimit: 20`、`rsshubPath: '/vllm/blog'`、`cronSchedule: '45 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-vllm'`）。
- 保存官方品牌矢量图标 `apps/web/public/source-icons/vllm.svg`（`3531` bytes），并在 `apps/web/components/source-icon.tsx` 的 `fileIcons` 注册 `'vllm'`。
- 新增 PostgreSQL 检查约束迁移 `deploy/postgres/migrations/012-vllm-source.sql`，同步更新 `deploy/postgres/baseline.sql`，并将 `deploy/postgres/migrations/011-kimi-source.sql` 标记为已被 `012-vllm-source.sql` 覆盖以保证重复发布与恢复幂等性。
- 更新 `deploy/server/business-jobs.json`（新增 `signal-ingest-vllm`，业务 Cron 任务总数更新为 `56`：52 条 signal 抓取任务 + 4 条维护任务）及 `deploy/server/verify-release-runtime` 校验计数（`private.business_cron_jobs = 56`、`cron.job = 58`）。
- 基于线上 `https://rss.ljhboard.cn/vllm/blog` 与真实 `ingestSignal` 管道生成本地验证证据 `docs/development/evidence/vllm-local-20261118.json`，并同步更新 `docs/research/rsshub-route-candidates-and-workflow.md` 与 `HERMES.md`。

## Out of scope

- 不修改现有 14 个 `ai` 分区来源配置或站内文章阅读器渲染逻辑。
- 不在本地手动修改生产数据库或提前启用 `signal-ingest-vllm`（新任务按 PR `#91` 自动激活机制随 CI 发布至 ECS 后由 `sync-business-cron --activate-unverified` 自动试抓并激活）。
- 不从工具直接向上游 `DIYgod/RSSHub` 提交 PR。

## Acceptance criteria

- `@rss-site/signals` 单元测试确认 `SIGNAL_SOURCES` 与 `SIGNAL_CRON_JOBS` 总数为 `53`、`ai` 分区为 `15`，且 `isSignalSourceId('vllm')` 与 `resolveSignalFeedUrl(getSignalSource('vllm'), 'https://rss.ljhboard.cn')` 断言通过。
- 本地针对真实 feed `https://rss.ljhboard.cn/vllm/blog` 运行 `ingestSignal` 可稳定解析并入库 `20` 条唯一文章，均含非空正文、合法时间、作者、封面图且无异常图片 URL 或 `/og?` 文字卡片封面。
- `biome check`、`check-types`、`test`、`build`、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py` 全部通过。
- 合并并发布到生产 ECS 后，CI 自动触发 `sync-business-cron --activate-unverified` 验证 `/cron/signals/vllm` 与 `/cron/verify/vllm` 并启用 `signal-ingest-vllm`。

## Feasibility

- 已于 `2026-11-18` 实测线上自建实例 `https://rss.ljhboard.cn/vllm/blog?limit=1`（HTTP `200`、`35,834` bytes、`1` item）、`https://rss.ljhboard.cn/vllm/blog`（HTTP `200`、`846,668` bytes、`20` items、`minDesc = 15,080`、`maxDesc = 85,922`）及 `https://rss.ljhboard.cn/vllm/blog?limit=100`（HTTP `200`、`3,618,791` bytes、`50` items、`minDesc = 12,649`），无鉴权或反爬阻塞。
- 既有 4 张业务表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）检查约束与 `010`/`011` 迁移模式一致，`012-vllm-source.sql` 可安全重放。

## Implementation

- **Registry & Web UI**：
  - `packages/signals/src/index.ts`、`packages/signals/src/index.test.ts`
  - `apps/web/public/source-icons/vllm.svg`、`apps/web/components/source-icon.tsx`
- **Database & Cron Packaging**：
  - `deploy/postgres/migrations/012-vllm-source.sql`、`deploy/postgres/migrations/011-kimi-source.sql`、`deploy/postgres/baseline.sql`
  - `deploy/server/business-jobs.json`、`deploy/server/verify-release-runtime`
- **Evidence & Docs**：
  - `docs/development/evidence/vllm-local-20261118.json`、`docs/development/vllm-source.md`、`docs/research/rsshub-route-candidates-and-workflow.md`、`HERMES.md`

## Verification

- **真实 feed 与 `ingestSignal` 本地端到端校验**（证据文件 `docs/development/evidence/vllm-local-20261118.json`）：
  - `feedUrls`: `["https://rss.ljhboard.cn/vllm/blog"]`
  - `feedByteLengths`: `[847644]`
  - `parsedItems`: `20`、`fullBodyMatches`: `20`、`renderedBodyMatches`: `20`、`publicationDatesVerified`: `20`、`namedAuthors`: `20`、`coverImages`: `20`、`badImageUrls`: `0`
  - `maxContentHtmlBytes`: `70090`、`ingestedItems`: `20`、`uniqueUrls`: `20`、`consecutiveRanks`: `true`
  - `manifestMatchesRegistry`: `true`、`releaseSqlIncludesSourceMigration`: `true`、`automaticActivation`: `false`、`productionDatabaseVerified`: `false`
- **代码风格、打包与类型/测试/构建**：
  - `pnpm exec biome check`（`vllm-local-20261118.json`、`packages/signals/src/index.ts`、`packages/signals/src/index.test.ts`、`apps/web/components/source-icon.tsx`、`deploy/server/business-jobs.json`）：格式化后 `0` 错误
  - `CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs`：`chars=24530`、`hasVllm=true`、无顶层 `select private.activate_*` 调用（`hasTopLevelSelectActivate=false`）
  - `bash -n deploy/server/verify-release-runtime`：退出码 `0`
  - `wsl python3 -B deploy/server/test-release-packaging.py -v`：`Ran 8 tests in 0.106s ... OK`
  - `pnpm check-types`：`Tasks: 3 successful, 3 total`
  - `pnpm test`：`Tasks: 3 successful, 3 total`（`@rss-site/signals` `1` 文件 `8 passed`；`@rss-site/api` `15` 文件 `118 passed`；`@rss-site/web` `42 passed | 4 skipped (46)` / `192 passed | 22 skipped (214)`，跳过项为 4 个依赖 Docker DB/Redis 的集成测试文件；合计 `318 passed | 22 skipped`）
  - `pnpm build`：`Tasks: 2 successful, 2 total`（`@rss-site/api` `tsc --noEmit`；`@rss-site/web` 生成 `64/64` 静态页面，`sw.js` `1 precached file, 1534 bytes`）

## Review

- **Blocking findings**: `0`
- **Accepted follow-ups**: `0`
- 已核对 `render-cron-sql.mjs` 输出包含 `signal-ingest-vllm` 且不含顶层 `select private.activate_*` 语句，新源 Cron 任务保持 `verified = false` 直至部署后自动验收通过。

## Delivery

- `rss-site` [PR #95](https://github.com/ljh12138164/rss-site/pull/95) 已合并至 `master`（`f363b8c29e2a800fb020328cb0a65c69e8cf234c`），[生产发布运行 #44219484831](https://github.com/ljh12138164/rss-site/actions/runs/44219484831) 成功完成：迁移 `012-vllm-source.sql` 生效，`sync-business-cron --activate-unverified` 自动验证并激活 `1` 项 PostgreSQL Cron 任务，`listPrewarm` `58/58` 成功，`Deployment healthy: sha-f363b8c29e2a800fb020328cb0a65c69e8cf234c` 与 `Verify public site` 通过。
- 自建 `ljh12138164/RSSHub` 已提前上线 `master @ 693346b621`（同步自 `feat/vllm-blog @ 1d4bc5c9b`），`https://rss.ljhboard.cn/vllm/blog` 生产稳定响应。

## Production regression

- **ECS 运行态与只读数据库验收**：通过 `alibabacloud-workbench-cli`（`--output json`，命令末尾已清理会话与 daemon；全程仅使用容器内环境变量，未输出任何密钥）确认 `rss-site-web-1`（`sha-f363b8c29e2a800fb020328cb0a65c69e8cf234c`）、`rss-site-postgres-1`（`18.7`、`rss-site-postgres:18-cron-v1`）与 `rss-site-redis-1` 均为 `running` / `healthy`，宿主机仅运行 `rss-site-supabase-keepalive.service` 与 `rss-site-postgres-backup.service`，无任何遗留抓源 timer。
- **调度与权限边界**：`private.business_cron_jobs = 56/56` `verified = true`、`cron.job = 58/58` `active = true`；`rss-site-vllm`（job id `1260`、UTC `45 5,11,17,23 * * *`）已激活，近 24 小时失败调度为 `0`；`rss_site_app` 对 `private.business_cron_settings` 读权限与 `private.dispatch_business_job` 执行权限均为 `false`。
- **vLLM 生产入库核验**：`ingestion_runs` 批次 `31357ca8-05af-4e89-9a05-758f7a60fc9f` 状态为 `succeeded`（`itemCount = 20`，`2026-11-18T02:04:20.134+00:00`），`source_status`（`ai` / `itemCount = 20`）对齐同一批次；`hot_items` 写入 `20` 条（排名 `1–20` 连续）；`signal_articles` `20/20` `is_indexable = true`，发布时间跨度 `2026-10-16T00:00:00+00:00` 至 `2026-11-12T00:00:00+00:00`，`content_html` 字节数 `11,691–70,090`。
- **线上公开路由与浏览器可视化回归（`https://news.ljhboard.cn`）**：
  - `/healthz`（`200`、`15 B`、`{"status":"ok"}`）、`/source-icons/vllm.svg`（`200`、`image/svg+xml`、`3,531 B`）、`/ai`（`200`、`205,464 B`、含 `vLLM` 标签/链接/图标）、`/ai/vllm`（`200`、`160,438 B`、`20` 篇唯一文章链接）、3 篇抽样详情页均返回 `200` 与 `robots: index, follow`。
  - `/feeds/vllm.xml`（`200`、`9,602 B`、`10` 条）、`/feeds/ai.xml`（`200`、`138,575 B`、`140` 条且含 `20` 条 `vllm`）、`/sitemap.xml`（`200`、`32` 个子站点地图）、`/sitemap/0.xml`（`200`、`2,000` 条且包含 `/ai/vllm/...`）。
  - 内置浏览器实测 `/ai`、`/ai/vllm`（渲染 `20` 篇文章，`/source-icons/vllm.svg` HTTP `200` / `cf-cache-status: HIT`）及详情页 `inkling-2-small-on-vllm-day-0-support--66dda7cd-2128-4a11-b7e1-5c2d6fdb3319`（`1` 个 `<pre>` 代码块、`2` 个对比 `<table>`、`8,081` 字符正文及 `https://vllm.ai/blog/2026-11-12-inkling2-small` 原文外链，`renderArticleContent` 按预期过滤交互式 `<iframe>` 图表标签并保留图注与表格），全程 `0` 报错；非敏感回归证据记录于 [vllm-production-20261118.json](evidence/vllm-production-20261118.json)。

## Risks

- 已完成 `56/56` 业务来源自动验证并激活 `rss-site-vllm`（job id `1260`，UTC `45 5,11,17,23 * * *`），后续常规抓取由 PostgreSQL `pg_cron` 定时调度持续维护。
- 备用 `RSSHub` fork（`ljh-project/RSSHub`）尚未同步主分叉 `693346b621`；当前主站消费 `https://rss.ljhboard.cn` 不受影响，如需切换备用实例 `rss1.ljhboard.cn` 需先点击 **Sync fork**。
- `vLLM` 官网历史文章中个别含大量 MathJax SVG 路径的文章正文会超过 `524,288` 字节单行上限（如 `?limit=100` 中最大条目 `987,545` bytes）；当前 `rss-site` 默认消费前 `20` 篇（最大 `70,090` bytes），且 `parseSignalFeed` 对超过 `512 KiB` 的 `contentHtml` 自动回退为 `null` 并保留文本 `summary`，不会触发数据库约束异常。
