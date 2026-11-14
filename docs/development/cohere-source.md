# Cohere 全文来源接入

## Background

自建 `ljh12138164/RSSHub`（`https://rss.ljhboard.cn`）已在 `master`（`31e6563b7`）与 `feat/cohere-blog`（`20e227784`）上线重写的 Cohere 官方博客英文全文路由 `/cohere/blog`（合并官方 Sanity Content Lake GROQ API 与 Ghost Content API，按规范 URL 去重并按发布时间倒序截取，完整保留 Portable Text 正文、行内与块级 LaTeX 公式、`blogFaqSection` 问答、`keyTakeaways`、表格、代码块及封面/正文媒体）。将 `cohere` 接入 `rss-site` 的 `ai` 分区。

## Scope

- 在 `packages/signals/src/index.ts` 的 `aiSources` 与 `cronSourceOrder` 注册 `cohere`（`Cohere`，代码 `CO`，入口 `/ai/cohere`，详情 `/ai/cohere/[slug]`），消费 `https://rss.ljhboard.cn/cohere/blog?limit=20`（`itemLimit: 20`）
- 新增官方三色品牌矢量图标 `apps/web/public/source-icons/cohere.svg` 并在 `apps/web/components/source-icon.tsx` 的 `fileIcons` 登记 `cohere`
- 新增 `deploy/postgres/migrations/007-cohere-source.sql` 扩展四张表（`ingestion_runs`、`source_status`、`hot_items`、`signal_articles`）的来源检查约束；将原 `006-arm-source.sql` 标记为已被 `007-cohere-source.sql` 取代以确保含新数据重放幂等；同步更新 `deploy/postgres/baseline.sql`（补充齐 `groq` 与 `cohere`）
- 在 `deploy/server/business-jobs.json` 注册每日四次 Cron（UTC `20 5,11,17,23 * * *`，共 `52` 项业务任务：`48` 项信号抓取 + `4` 项维护任务），同步更新 `deploy/server/verify-release-runtime` 预期计数（`52` 项 `private.business_cron_jobs` / `54` 项 `cron.job`），新来源 Cron 保持禁用直至生产数据门禁验收通过

## Out of scope

不改动采集解析逻辑、翻译与摘要链路、首页排行规则或已有来源调度；不操作 Supabase Auth；不提前启用生产 PostgreSQL Cron；不在网页 UI 中创建或合并 PR。

## Acceptance criteria

- 线上自建路由 `https://rss.ljhboard.cn/cohere/blog?limit=20` 匿名 HTTP 200，可由现有 `ingestSignal` 正常解析并输出 20 条去重全文记录
- `@rss-site/signals` 注册表、`/ai` 分区、`/ai/cohere` 与 `business-jobs.json` 正确包含 `cohere`（共 `49` 个信号源、`12` 个 AI 源）
- `007-cohere-source.sql` 与 `baseline.sql` 同时允许已有来源（含 `groq`、`arm`）与 `cohere`，重复执行 `render-cron-sql.mjs` 不包含顶层 `activate_business_jobs` 调用
- 类型检查、变更文件 Biome 检查、单元测试及生产构建通过，推送 `feat/cohere-source` 分支供审阅与发起 PR

## Feasibility

基于 `origin/master`（`32489cc`）在原 `rss-site` 目录创建 `feat/cohere-source`（未新建 worktree），顺带同步更新 [rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md) 的进展现状与 Codex 审查流程。

- **线上 Feed 与 `ingestSignal` 实测（2026-11-14 UTC `07:12`）**：匿名请求 `https://rss.ljhboard.cn/cohere/blog?limit=20` 返回 HTTP 200（`314,900` 字节，远低于 `MAX_FEED_BYTES = 5,000,000`）。经 `parseSignalFeed` 与 `ingestSignal` 处理后写入 `20` 条不重复记录（`uniqueUrls: 20`、排名 `1–20` 连续），`20/20` 均含正文全文、合法 `publishedAt`、署名作者与有效 `https://` 封面图（`badImageUrls: 0`），最大 `contentHtml` 为 `31,440` 字节（远低于 `524,288` 字节 SQL 上限），`business-jobs.json` 与 `SIGNAL_CRON_JOBS` 一致，结果记录于 [cohere-local-20261114.json](evidence/cohere-local-20261114.json)。

## Implementation

- `packages/signals/src/index.ts`：`aiSources`（置于 `groq` 后）与 `cronSourceOrder` 新增 `cohere`（`code: 'CO'`、`itemLimit: 20`、`rsshubPath: '/cohere/blog?limit=20'`、`cronSchedule: '20 5,11,17,23 * * *'`，错开 `arm` `:15` 与 `retention` `30 5`）
- `packages/signals/src/index.test.ts`：更新总源数 `49`、AI 源数 `12`、`SIGNAL_CRON_JOBS` 长度 `49` 及 `cohere` 路由解析断言
- `apps/web/public/source-icons/cohere.svg` 与 `apps/web/components/source-icon.tsx`：新增 Cohere 官方三色 SVG 图标并注册到 `fileIcons`
- `deploy/postgres/migrations/007-cohere-source.sql`、`006-arm-source.sql` 与 `deploy/postgres/baseline.sql`：扩展 `ai` 约束白名单并同步 `baseline.sql` 中的 `groq` 与 `cohere`
- `deploy/server/business-jobs.json` 与 `deploy/server/verify-release-runtime`：登记 `signal-ingest-cohere`，计数更新为 `52` / `54`，维持未激活门禁

## Verification

- **本地端到端解析与清单校验**：结果写入 [cohere-local-20261114.json](evidence/cohere-local-20261114.json)（`20` 篇、`20` 唯一 URL、`20/20` 全文与合法时间戳、最大正文 `31,440` 字节、`manifestMatchesRegistry: true`、`releaseSqlIncludesSourceMigration: true`）。
- **代码格式与规范检查**：`biome check` 检验本次改动涉及的代码/配置/JSON 文件（`packages/signals/src/index.ts`、`packages/signals/src/index.test.ts`、`apps/web/components/source-icon.tsx`、`deploy/server/business-jobs.json`、`docs/development/evidence/cohere-local-20261114.json`）5 项全部零错误零警告（Windows `core.autocrlf=true` 下全仓 `pnpm lint` 因未修改存量文件 CRLF 行尾报 `112` 个格式化差异、`2` 个既有警告）。
- **类型检查（`pnpm check-types`）**：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` 三个包全部通过（`3 successful, 3 total`）。
- **单元测试（`pnpm test`）**：`@rss-site/signals` `8 passed (8)`、`@rss-site/api` `114 passed (114)`、`@rss-site/web` `192 passed | 22 skipped (214)`（22 项跳过为需本地 Docker PostgreSQL/Redis 环境的集成测试），合计 **314 passed | 22 skipped**。
- **生产构建（`pnpm build`）**：`@rss-site/api` 与 `@rss-site/web` 构建均通过，生成 `60/60` 静态/动态页面路由、`early-hints` 与 `sw.js`。
- **迁移 SQL 渲染与脚本语法**：`CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs` 退出 `0`（输出 `21,212` 字符，包含 `'cohere'` 与 `'groq'`，不含顶层 `activate_business_jobs` 调用）；`bash -n deploy/server/verify-release-runtime`（Git Bash）退出 `0`。

## Review

- 仅在 `ai` 分区新增 `cohere` 与图标，未改动其余来源配置、抓取核心与前端布局；`007-cohere-source.sql` 与 `baseline.sql` 保持重复发布和恢复幂等；新 Cron 任务保持默认禁用。
- Blocking：`0` 项；Accepted follow-up：`0` 项（待 PR 合并并部署到 ECS 后按 `AGENTS.md` 执行 `POST /cron/signals/cohere` 与 `setup:cron` 门禁验收）。

## Risks

- Cohere 官方博客同时存在于 Sanity 与 Ghost 两套系统，虽已在上游路由实现合并去重与正文保底，若官网继续迁移 Sanity schema 仍需在自建 RSSHub 仓库同步适配后重部署；
- PR 合并部署并完成 `POST /cron/signals/cohere` 与 `pnpm setup:cron` 验收激活前，生产环境不会自动定时抓取 `cohere`。
