# MiniMax 全文来源接入

## Background

自建 `ljh12138164/RSSHub`（`https://rss.ljhboard.cn`）已在 `master`（`0a301d5f8`）与 `feat/minimax`（`5dfcaaa94`）上线 MiniMax 官方博客与新闻双语全文路由 `/minimax/blog/:lang?` 与 `/minimax/news/:lang?`（默认英文 `minimax.io`，可选传入 `zh-CN`/`zh` 切换至 `minimax.cn`；支持 `.prose` / 双排版正文、KaTeX 公式、图片 `/_next/image` 解包与 Next.js RSC 内嵌 `<video>` 提取）。参照 `arm` 与 `nvidia` 的多 Feed 合并模式，将 `minimax` 作为单一合并源接入 `rss-site` 的 `ai` 分区。

## Scope

- 在 `packages/signals/src/index.ts` 的 `aiSources` 与 `cronSourceOrder` 注册 `minimax`（`MiniMax`，代码 `MM`，入口 `/ai/minimax`，详情 `/ai/minimax/[slug]`），通过 `feeds` 并行消费 `https://rss.ljhboard.cn/minimax/blog?limit=20` 与 `https://rss.ljhboard.cn/minimax/news?limit=20`（`itemLimit: 30`）
- 在 `apps/web/components/source-icon.tsx` 的 `brandIcons` 复用 `react-icons/si` 已内置的 `SiMinimax`（`#e21f64` / `#fdebf1`），无需新增图片资源
- 新增 `deploy/postgres/migrations/008-minimax-source.sql` 扩展四张表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）的来源检查约束；将原 `007-cohere-source.sql` 标记为已被 `008-minimax-source.sql` 取代以确保含新数据重放幂等；同步更新 `deploy/postgres/baseline.sql`
- 在 `deploy/server/business-jobs.json` 注册每日四次 Cron（UTC `25 5,11,17,23 * * *`，共 `53` 项业务任务：`49` 项信号抓取 + `4` 项维护任务），同步更新 `deploy/server/verify-release-runtime` 预期计数（`53` 项 `private.business_cron_jobs` / `55` 项 `cron.job`），新来源 Cron 保持禁用直至生产数据门禁验收通过

## Out of scope

不改动采集解析逻辑、翻译与摘要链路、首页排行规则或已有来源调度；不操作 Supabase Auth；不提前启用生产 PostgreSQL Cron；不在网页 UI 中创建或合并 PR。

## Acceptance criteria

- 线上自建路由 `https://rss.ljhboard.cn/minimax/blog?limit=20` 与 `https://rss.ljhboard.cn/minimax/news?limit=20` 匿名 HTTP 200，可由现有 `ingestSignal` 合并去重解析并输出完整全文记录
- `@rss-site/signals` 注册表、`/ai` 分区、`/ai/minimax` 与 `business-jobs.json` 正确包含 `minimax`（共 `50` 个信号源、`13` 个 AI 源）
- `008-minimax-source.sql` 与 `baseline.sql` 同时允许既有来源（含 `cohere`、`arm`、`groq`）与 `minimax`，重复执行 `render-cron-sql.mjs` 不包含顶层 `activate_business_jobs` 调用
- 类型检查、变更文件 Biome 检查、单元测试及生产构建通过，推送 `feat/minimax-source` 分支并发起目标为 `master` 的 PR

## Feasibility

基于 `origin/master`（`ae35a85`）在原 `rss-site` 目录创建 `feat/minimax-source`（未新建 worktree），同步更新 [rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md) 基线与进展状态。

- **线上 Feed 与 `ingestSignal` 实测（2026-11-14 UTC `17:50`）**：匿名请求 `https://rss.ljhboard.cn/minimax/blog?limit=20` 与 `/minimax/news?limit=20` 均返回 HTTP 200（分别为 `431,276` 字节与 `275,802` 字节，远低于 `MAX_FEED_BYTES = 5,000,000`）。经 `parseSignalFeed` 与 `ingestSignal` 合并去重并按发布时间倒序处理后输出 `24` 条不重复记录（Blog `15` 篇 + News `9` 篇，排名 `1–24` 连续），`24/24` 均含正文全文、合法 `publishedAt`、署名作者（`MiniMax`）与有效 `https://` 封面图（`badImageUrls: 0`），最大 `contentHtml` 为 `101,792` 字节（远低于 `524,288` 字节 SQL 上限），`business-jobs.json` 与 `SIGNAL_CRON_JOBS` 一致，结果记录于 [minimax-local-20261115.json](evidence/minimax-local-20261115.json)。

## Implementation

- `packages/signals/src/index.ts`：`aiSources`（置于 `cohere` 后）与 `cronSourceOrder` 新增 `minimax`（`code: 'MM'`、`itemLimit: 30`、`feeds: ['/minimax/blog?limit=20', '/minimax/news?limit=20']`、`cronSchedule: '25 5,11,17,23 * * *'`，错开 `cohere` `:20` 与 `retention` `30 5`）
- `packages/signals/src/index.test.ts`：更新总源数 `50`、AI 源数 `13`、`SIGNAL_CRON_JOBS` 长度 `50` 及 `minimax` 双 Feed 解析断言
- `apps/web/components/source-icon.tsx`：引入 `SiMinimax` 并注册到 `brandIcons`（`#e21f64` / `#fdebf1`）
- `deploy/postgres/migrations/008-minimax-source.sql`、`007-cohere-source.sql` 与 `deploy/postgres/baseline.sql`：扩展 `ai` 约束白名单并保留 `cohere` 等既有来源
- `deploy/server/business-jobs.json` 与 `deploy/server/verify-release-runtime`：登记 `signal-ingest-minimax`，计数更新为 `53` / `55`，维持未激活门禁

## Verification

- **本地端到端解析与清单校验**：结果写入 [minimax-local-20261115.json](evidence/minimax-local-20261115.json)（`24` 篇、`24` 唯一 URL、`24/24` 全文与合法时间戳、最大正文 `101,792` 字节、`manifestMatchesRegistry: true`、`releaseSqlIncludesSourceMigration: true`）。
- **代码格式与规范检查**：`biome check` 检验本次改动涉及的 5 项代码/配置/证据 JSON 文件全部 0 错误 0 警告。
- **类型检查（`pnpm check-types`）**：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` 三个包全部通过（`3 successful, 3 total`）。
- **单元测试（`pnpm test`）**：`@rss-site/signals` `8 passed (8)`、`@rss-site/api` `114 passed (114)`、`@rss-site/web` `192 passed | 22 skipped (214)`（22 项跳过为需本地 Docker PostgreSQL/Redis 环境的集成测试），合计 **314 passed | 22 skipped**。
- **生产构建（`pnpm build`）**：`@rss-site/api` 与 `@rss-site/web` 构建均通过，生成 `61` 个静态/动态页面（其中 `/leaderboard/[slug]` 与 `/skills/[...skillId]` 为 SSG，其余静态/动态路由按 Next 路由清单构建）、`early-hints` 与 `sw.js`。
- **迁移 SQL 渲染与脚本语法**：`CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs` 退出 `0`（输出 `21,521` 字符，包含 `'minimax'`，不含顶层 `activate_business_jobs` 调用）；Git Bash `bash -n deploy/server/verify-release-runtime` 退出 `0`。

## Review

- 仅在 `ai` 分区新增 `minimax` 与 `SiMinimax` 品牌图标，未改动其余来源配置、抓取核心与前端布局；`008-minimax-source.sql` 与 `baseline.sql` 保持重复发布和恢复幂等；新 Cron 任务保持默认禁用。
- Blocking：`0` 项；Accepted follow-up：`0` 项（待 PR 合并并部署到 ECS 后按 `AGENTS.md` 执行 `POST /cron/signals/minimax` 与 `setup:cron` 门禁验收）。

## Risks

- MiniMax 新闻列表部分条目为外链新闻稿（如第三方媒体链接），RSSHub 侧在外链条目无本站 `.prose` 正文时回退列表摘要；若官网日后调整 Next.js RSC Flight 数据结构或 `/api/news` 字段，需在自建 RSSHub 仓库同步适配后重部署；
- PR 合并部署并完成 `POST /cron/signals/minimax` 与 `pnpm setup:cron` 验收激活前，生产环境不会自动定时抓取 `minimax`。
