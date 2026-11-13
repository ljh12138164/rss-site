# Arm 全文来源接入

## Background

自建 `ljh12138164/RSSHub`（`https://rss.ljhboard.cn`）已在 `master`（`be81ea575`）与 `feat/arm-newsroom`（`5fe3a4e8b`）上线 Arm Newsroom 拆分后的两个英文全文路由：`/arm/news`（WordPress `wp/v2/news` 新闻稿）和 `/arm/blog`（WordPress `wp/v2/posts` 博客）。按与 NVIDIA 一致的多 Feed 合并约定，将 `arm` 作为单个来源接入 `rss-site` 的 `technology`（科技）分区。

## Scope

- 在 `packages/signals` 科技分区新增 `arm`（`Arm`，代码 `ARM`，入口 `/technology/arm`，详情 `/technology/arm/[slug]`），保留英文全文、内嵌图片、署名作者及原始发布时间
- 通过多 Feed 配置并行消费 `https://rss.ljhboard.cn/arm/news?limit=20` 与 `https://rss.ljhboard.cn/arm/blog?limit=20`，按原文 URL 去重并按发布时间倒序截取前 30 篇
- 在 `apps/web/components/source-icon.tsx` 复用 `react-icons/si` 既有的 `SiArm`（品牌蓝 `#0091bd` 与浅色底 `#e6f5fa`）呈现来源图标
- 在 `deploy/postgres/migrations/006-arm-source.sql` 扩展四张表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）的来源检查约束，将原 `002-the-decoder-source.sql` 标记为已被 `006-arm-source.sql` 取代以确保含新来源数据后重放迁移不失败，并同步 `deploy/postgres/baseline.sql`
- 在 `deploy/server/business-jobs.json` 注册每日四次 Cron（UTC `15 5,11,17,23 * * *`），并更新 `deploy/server/verify-release-runtime` 预期任务计数（`51` 项业务任务 / `53` 项 `cron.job`），维持新来源默认禁用门禁直至生产实测验收通过

## Out of scope

不修改采集解析器、页面排版布局、翻译逻辑、首页排行策略或现有旧来源调度；不操作 Supabase Auth；不提前启用生产 PostgreSQL Cron；不在网页 UI 中创建或合并 PR。

## Acceptance criteria

- 线上自建 RSSHub 两个路由（`/arm/news?limit=20`、`/arm/blog?limit=20`）匿名 HTTP 200，可由现有 `ingestSignal` 正常解析、URL 去重、时间倒序合并为 30 条全文数据
- `@rss-site/signals` 注册表、科技分区页、详情页、RSS 与 `business-jobs.json` 正确包含 `arm`
- 迁移 SQL 与 baseline 同时允许既有来源（含 `groq`、`the-decoder`）与 `arm`，且重复执行 `render-cron-sql.mjs` 在已有 `arm` 数据时可安全重放、不自动调用 `activate_business_jobs`
- 全仓类型检查、变更文件 Biome 检查、单元测试及生产构建通过，推送 `feat/arm-source` 分支供用户创建 PR

## Feasibility

可行。基于 `origin/master`（`7a9070f`）在原 `rss-site` 目录新建 `feat/arm-source`（不新建 worktree；保留工作区既有未跟踪的 `.impeccable` 草稿及研究文档不纳入提交）。

- **线上 Feed 实测（2026-11-13 UTC `03:37`）**：匿名请求 `https://rss.ljhboard.cn/arm/news?limit=20` 与 `/arm/blog?limit=20` 均返回 HTTP 200（分别为 `157,052` 字节与 `344,397` 字节，远低于 `MAX_FEED_BYTES = 5,000,000`）。经现有 `parseSignalFeed` 与 `ingestSignal` 合并去重排序后生成 `30` 篇不重复条目（其中 News `10` 篇、Blog `20` 篇），全部具有有效原始 `publishedAt` 与全文内容，最大 `contentHtml` 为 `24,162` 字节（远低于 `524,288` 字节 SQL 限制），无非法图片 URL；新闻稿匿名作者已在 RSSHub 侧清除，保留 `24/30` 实名作者。
- **迁移重放瓶颈识别与规避**：`apps/web/scripts/render-cron-sql.mjs` 每次发布按文件名顺序在单事务内重放 `deploy/postgres/migrations/*.sql`。若保留旧 `002-the-decoder-source.sql` 在 `006-arm-source.sql` 之前重建不含 `'arm'` 的约束，则生产库写入 `'arm'` 行后再次发布时重放 `002` 会立即报错。因此将最新全量来源白名单集中到 `006-arm-source.sql`（使用 `drop constraint if exists` + `add constraint`）并把 `002-the-decoder-source.sql` 改为注释占位，保证首次部署与后续含数据重放/恢复均幂等通过。
- **界面方案**：沿用 `d556228`（NVIDIA/AMD）与 `9b91561`（The Decoder）已确认的科技分区卡片与图标组件，仅在 `brandIcons` 登记 `SiArm`，不引入新页面、新组件或新 UI 库。

## Implementation

- `packages/signals/src/index.ts`：`technologySources` 与 `cronSourceOrder` 新增 `arm`（`itemLimit: 30`、`feeds: ['/arm/news?limit=20', '/arm/blog?limit=20']`、`cronSchedule: '15 5,11,17,23 * * *'`，错开 `the-decoder` 的 `:00`、`hot-ranking-log-retention` 的 `:10` 与 `retention` 的 `:30`）
- `packages/signals/src/index.test.ts`：同步总源数（`48`）、科技源数（`12` / 文章源 `11`）及 `resolveSignalFeedUrls` 双 Feed 断言
- `apps/web/components/source-icon.tsx`：引入 `SiArm`，以 `#0091bd` + `#e6f5fa` 渲染 Arm 品牌角标
- `deploy/postgres/migrations/006-arm-source.sql`、`002-the-decoder-source.sql` 与 `deploy/postgres/baseline.sql`：扩展 `technology` 约束白名单并保留 `ai` 中的 `groq`
- `deploy/server/business-jobs.json` 与 `deploy/server/verify-release-runtime`：登记 `signal-ingest-arm`（共 `51` 项业务任务 / `53` 项 `cron.job`），不启用任务

## Verification

- **本地端到端解析与清单校验**：`pnpm --filter @rss-site/api exec tsx ...` 运行真实线上的 `arm` 双路由经 `ingestSignal` 处理，结果记录于 [arm-local-20261113.json](evidence/arm-local-20261113.json)（`30` 篇、`30` 个唯一 URL、排名 `1–30` 连续、最大正文 `24,162` 字节、`business-jobs.json` 信号条目与 `SIGNAL_CRON_JOBS` 一致）。
- **代码格式与类型检查**：`biome check` 检查所有变更的代码/配置/证据 JSON 文件无错误与警告（全仓 `pnpm lint` 的 10 个错误与 1 个警告全部来自仓库既有的未跟踪 `.impeccable/mocks/*.html` 草稿文件）；`pnpm check-types` 三个 workspace（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）全部通过。
- **单元测试（`pnpm test`）**：`@rss-site/signals` `8/8` 通过、`@rss-site/api` `114/114` 通过、`@rss-site/web` `189 passed | 22 skipped`（跳过的 22 项为需本地 PostgreSQL 18 / Redis 服务容器的集成测试），合计 **311 项通过、22 项按环境跳过**。
- **生产构建（`pnpm build`）**：`@rss-site/api` 与 `@rss-site/web` 构建均通过，生成 60 个静态/动态路由及 `sw.js` 与 `early-hints`。
- **迁移 SQL 渲染与脚本语法**：`CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs` 退出 `0`（输出 `21,190` 字符，包含 `'arm'` 与 `'groq'`，不含顶层 `activate_business_jobs` 调用）；`bash -n deploy/server/verify-release-runtime` 退出 `0`。本地未启动 Docker Desktop 守护进程，且 Windows 环境不适用 Linux bash 测试脚本（`test-release-packaging.py` 未在本地作为完整通过项计入）；PostgreSQL 18 镜像运行验收将在 GitHub Actions CI 中执行。

## Review

对照仓库规范、`AGENTS.md` 门禁与本文验收标准逐项复核：

- 新增源仅作用于 `technology` 分区并复用多 Feed 合并逻辑，未改动已有来源配置与调度
- `006-arm-source.sql` 已处理重复发布与带数据重放时的约束兼容问题，`baseline.sql` 已同步
- 新 Cron 任务保持未激活状态，未绕过生产数据验收门禁
- 分类结果：Blocking `0` 项；Accepted follow-up `0` 项；Rejected `0` 项（无需新建空 roadmap 文档；待 PR 合并并部署到 ECS 后再按 `AGENTS.md` 执行 `POST /cron/signals/arm` 与 `setup:cron` 门禁验证）

## Risks

- 正文保留英文原文，未接入自动整篇翻译；Arm 官网 WordPress API 若变更文章结构，需在自建 RSSHub 仓库调整后重新部署
- 部署执行 `006-arm-source.sql` 重建四张表 CHECK 约束时需要短暂表锁
- 在 PR 合并部署并通过 ECS 生产数据门禁前，`signal-ingest-arm` 不会在生产环境自动定时抓取
