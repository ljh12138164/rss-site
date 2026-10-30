# AI 模型评测榜单开发记录

## Background

为了让读者在浏览 AI 动态之余，能清晰直观地横向比对各家前沿大模型的综合能力、分项强弱（编程、科研、专业办公、知识问答、真人评测）以及调用成本，本站新增 AI 模型评测排行榜体系。榜单数据源由已部署上线的自建 RSSHub（`https://rss.ljhboard.cn`）提供结构化 JSON Feed 接口，前端复用现有 `SkillLeaderboard` 架构，同时配套数据库存储与下架模型自动清理机制。

## Scope

1. **数据库层（Drizzle ORM & 迁移）**：
   - 在 `server/api/src/db/schema.ts` 中定义 `aiModels`、`aiModelPrices`、`aiLeaderboardRanks` 与 `aiModelEvidences` 表。
   - 在 `aiModels` 增加 `lastSeenAt` 字段，外键约束均配置 `onDelete: 'cascade'`。
   - 在 `server/api/src/setup/cron.ts` 的 `RETENTION_COMMAND` 中增加清理任务：自动清理 `last_seen_at < now() - interval '90 days'` 的淘汰/下架模型。
   - 生成对应的版本化 Supabase 迁移文件 `supabase/migrations/20261030113000_ai_leaderboard.sql`。
2. **数据接入层（`apps/web/lib/leaderboard.ts`）**：
   - 接入生产 RSSHub `https://rss.ljhboard.cn/aihot/leaderboard?format=json`（支持全量与分项分类）及 `/aihot/model/:slug?format=json`。
   - 配置 Next.js ISR 缓存（`revalidate: 14400`，即 4 小时），保障即时静态响应与故障降级。
3. **前端主页面与详情路由**：
   - `/leaderboard`：模型榜单主页面，包含分类切换（综合、编程、科研、专业办公、知识问答）、搜索过滤、列表/卡片双视图切换、名次样式与价格展示。
   - `/leaderboard/[slug]`：单模型详情页，包含模型概览、分项能力雷达/得分条、39 项评测证据链展开明细及测试集出处链接。
4. **上下文引流入口（2 处）**：
   - 顶部主导航（`SiteHeader`）：在 `sections` 中加入 `['/leaderboard', '模型榜']`。
   - AI 分区导航/头部（`/ai`）：在 AI 分区顶部加入醒目的模型榜单引导横幅/卡片。
5. **文案规范**：
   - 全面遵循 `/humanizer-zh`，使用自然干练的开发者口吻，剔除夸大与套话。

## Out of scope

1. 不在客户端直连第三方未经处理的未授权抓取接口，全部经由稳定部署的 RSSHub 标准格式输出。
2. 不引入除 90 天未见模型级联清理以外的其他清理逻辑。
3. 不增加未通过评审的额外第三方 UI 依赖。

## Acceptance criteria

1. **独立主页面与分类筛选**：访问 `/leaderboard` 可查看前沿大模型完整排行，可在综合、编程、科研、专业办公、知识问答等维度无缝切换，支持按模型名或开发商实时模糊检索，支持列表/卡片视图切换与状态记忆。
2. **模型详情与证据链**：点击任一模型可进入 `/leaderboard/[slug]`，完整呈现 39 项客观评测集（如 Terminal-Bench 4.0、CritPt、Humanity's Last Exam、APEX-Agents、Arena Text 等）的原始得分、折算分、推理等级与公开评测出处。
3. **两处流量入口顺畅**：
   - 全局顶部导航条直接点击“模型榜”可直达 `/leaderboard`，且具备活跃高亮。
   - 在 `/ai` 页面可看到清晰的引导卡片直达榜单。
4. **数据存储与级联淘汰**：
   - Drizzle ORM 表结构与 Supabase 迁移对齐；
   - 超过 90 天未出现在上游榜单的淘汰模型，在每日定时任务中被自动清理，关联的价格、排名和证据记录级联清除。
5. **代码质量与测试**：全仓类型检查、Biome 代码格式化及测试全部通过。

## Feasibility

- **上游数据源保障**：配套 RSSHub 路由已在生产环境（`https://rss.ljhboard.cn`）完成部署并经全部 5 项真实验收（HTTP 200、格式 JSON Feed 1.1、数据完整包含 Gemini 4 Carbon 等 30 个模型与 39 项证据链）。
- **组件复用**：`SkillLeaderboard` 已经经过验证，包含 React Aria Tabs、SearchField、自适应网格与列表切换，直接沿用成熟架构并适配模型字段。
- **UI Skills 状态**：因当前环境未挂载 UI Skills MCP 协议服务，设计直接复用既有设计系统（`PRODUCT.md`、React Aria Components、Tailwind 语义化调色盘、`rank-numeral` 字体与排版）。

## Implementation

1. **数据库表与迁移**：
   - `server/api/src/db/schema.ts`：定义 `aiModels`（含 `lastSeenAt` 字段）、`aiModelPrices`、`aiLeaderboardRanks` 与 `aiModelEvidences` 表，外键均设置 `onDelete: 'cascade'`。
   - `server/api/src/setup/cron.ts`：在 `RETENTION_COMMAND` 追加淘汰模型清理语句：`delete from public.ai_models where last_seen_at < now() - interval '90 days';`，级联清理价格、排位与实测证据。
   - `supabase/migrations/20261030113000_ai_leaderboard.sql`：实现对应表结构、索引与 RLS 公开只读策略。
2. **数据访问与解析层**：
   - `apps/web/lib/leaderboard.ts`：通过 `getModelLeaderboard(category)` 与 `getModelDetail(slug)` 接入自建生产 RSSHub（`https://rss.ljhboard.cn`），配置 4 小时 ISR 缓存与数据结构化解析。
   - `apps/web/lib/leaderboard.test.ts`：编写单测覆盖榜单列表、各维度得分、API 计价及 39 项评测证据链解析。
3. **UI 页面与复用组件**：
   - `apps/web/components/leaderboard/model-leaderboard.tsx`：复用 `SkillLeaderboard` 架构，实现 React Aria 标签页切换（综合、编程、科研、办公 Agent、知识问答）、实时搜索过滤、列表与卡片双视图切换、名次胶囊与计价展示。
   - `apps/web/components/leaderboard/model-detail-view.tsx`：呈现单模型能力画像、综合排位与得分、分项能力、证据链折叠明细卡片（原始成绩、折算能力分、评测机构与配置）及待测项徽章列表。
   - `apps/web/app/leaderboard/page.tsx`：主榜单静态路由页面。
   - `apps/web/app/leaderboard/[slug]/page.tsx`：模型详情路由页面。
4. **两处引流入口**：
   - `apps/web/components/site-header.tsx`：顶部主导航栏新增 `['/leaderboard', '模型榜']`，配置路由高亮。
   - `apps/web/app/ai/page.tsx`：AI 分区顶部新增 `LeaderboardBanner` 导流卡片。

## Verification

- **Web 单元测试**：`pnpm --filter @rss-site/web test` 93 个测试文件 343 项测试全数通过（包括新增的 `leaderboard.test.ts`、`model-leaderboard.test.tsx` 及更新的 `site-header.test.tsx`、`app/ai/page.test.tsx`）。
- **API 单元测试**：`pnpm --filter @rss-site/api test` 11 个测试文件 111 项测试全数通过。
- **TypeScript 类型检查**：`pnpm --filter @rss-site/web check-types` 与 `pnpm --filter @rss-site/api check-types` 均 0 错误通过。
- **代码规范与格式化**：`npx @biomejs/biome check` 12 个关联代码文件 0 错误 0 警告通过。
- **Git 格式检查**：`git diff --check` 通过。
- **审查与后续路线**：双轴审查无阻塞项，无需要延后的后续事项，无需创建额外路线图。

## Risks

- **上游模型短时不可达**：通过 Next.js ISR `revalidate: 14400` 与 stale-while-revalidate 机制防御，即使上游波动，前端依旧提供上一轮缓存快照，无白屏风险。
