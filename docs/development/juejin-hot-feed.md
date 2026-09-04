# 掘金热点采集与展示

## Background

建立“热点更新”门户的第一条完整数据链路。首页展示科技区摘要，掘金子页展示完整榜单；
Hono 定时采集 RSSHub，并通过 Supabase 与前端解耦。

设计依据：
[热点更新：掘金热点采集与展示设计](../superpowers/specs/2026-09-03-juejin-hot-feed-design.md)

## Scope

- Next.js 首页和 `/technology/juejin`。
- Hono/Vercel 掘金采集服务。
- Drizzle ORM 数据访问。
- Supabase 热点表、公开来源状态、内部运行记录、RLS、约五小时一次的采集 Cron，
  以及每日执行的 30 天运行历史清理 Cron。
- shadcn/ui 信号橙红主题及明暗模式。

## Out of scope

- 其他热点来源、登录、收藏、搜索、管理后台和历史趋势。
- 创建远程仓库、生产域名和付费基础设施。

## Acceptance criteria

- 首页显示科技区、掘金前五条和最近成功采集信息。
- `/technology/juejin` 按 RSS 顺序显示完整当前榜单。
- 受保护的 Hono 端点读取 RSSHub，并通过 Drizzle 幂等同步当前榜单。
- 失败或空 feed 不清除最后一次成功数据。
- Supabase Cron 约每五小时触发采集。
- `ingestion_runs` 只保留最近 30 天；仍被当前热点或来源状态引用的批次不会被删除。
- 匿名前端可读取热点，但不能写入或读取内部错误详情。
- UI 使用 shadcn 语义变量实现确认的信号橙红主题，并覆盖明暗和移动端状态。
- 首页主标题为“热点跟踪”，页面在桌面端充分利用横向空间，同时保持正文阅读宽度。
- 格式、lint、类型检查、测试和生产构建通过。

## Feasibility

结论：可行。

- 用户确认本地 `main` 是当前基线；设计阶段没有远程，开发开始时 `origin` 已建立并跟踪功能分支。
- 2026-09-04 执行 `git fetch origin` 时 GitHub 443 连接超时；已有远程引用显示默认分支为
  `origin/master`，继续使用用户此前确认的本地基线。
- Supabase 项目 `rss-site`（`pnjsrihfpyvkhyidzgfq`）为健康状态，PostgreSQL 17.6。
- `public` schema 当前无表，迁移历史为空。
- RSSHub 提供 `/juejin/trending/:category/:type`，本期使用 `all/weekly`。
- Vercel Hobby 自带 Cron 只能每天一次，因此采用 Supabase Cron 调用普通 Vercel Function。
- Hono、Drizzle、Next.js、Tailwind CSS 4、React 19 和 shadcn/ui 均支持目标运行时。
- 2026-09-04 已复核 Supabase Cron 文档与近期平台变更；继续使用 `cron.schedule`，未发现影响本实现的
  新 breaking change。

技术难点及约束：

- 使用唯一约束、批次 ID 和事务抵御重复/漏发 Cron。
- 完整验证 feed 后才替换榜单，避免上游失败清空页面。
- 使用 Supabase transaction pooler，并关闭 prepared statements 适配无状态函数。
- 通过 RLS、受限运行状态和独立密钥隔离匿名读与服务端写。
- 界面调整使用 `frontend-design`、UI Skills 的 Interface Design 与 Baseline UI 指南复核，
  保持现有信号橙红设计语言，不引入新组件或装饰噪音。
- 清理任务通过 `cron.schedule` 执行单条 SQL，不需要新增表或迁移；删除时排除被
  `hot_items.batch_id`、`source_status.last_batch_id` 引用的记录，以符合现有外键约束。

## Implementation

- 当前功能分支：`feat/juejin-hot-feed`。
- 基线清理提交：`8e31d34`。
- 前端保留 `apps/web`，后端放在 `server/api`，匹配现有 pnpm workspace。
- 数据库运行时写入使用 Drizzle；版本化 SQL 迁移保存在 Supabase migrations 中。
- shadcn 只引入 Button、Badge、Breadcrumb、Separator、Skeleton 和 Tooltip。
- 页面宽度、排版与明暗模式参考 `C:\Users\PC\Desktop\front\TEST\blog`，不使用 Nextra；
  公共页面外框使用 Tailwind `max-w-5xl`，正文仍由现有 `max-w-lg` 约束阅读长度。

## Verification

实施计划：
[Juejin Hot Feed Implementation Plan](../superpowers/plans/2026-09-04-juejin-hot-feed.md)

计划已完成，按 TDD 在当前会话执行。

实现前仓库没有应用文件或 `test` 脚本，无法运行有意义的基线测试；首次可执行基线是工作区
脚手架完成后的 lint、类型检查与空测试套件。

数据库资产验证：当前会话未暴露此前可用的 Supabase MCP 工具，Supabase CLI 没有登录令牌，
且本机 Docker daemon 未运行。迁移和 pgTAP 测试已保留在仓库，线上应用与数据库测试须在
工具恢复或凭据可用后完成。

## Progress update: frontend

- 已实现 Supabase 匿名读取层，按排名排序并区分 ready、empty、error 三种稳定状态。
- 已实现首页科技区预览与 `/technology/juejin` 完整榜单；两个路由均为动态服务端渲染，浏览端不调用 Hono。
- 已实现纸张式布局、信号橙红主题、明暗模式、加载态与错误态，并复用 shadcn 的基础组件；
  首页主标题更新为“热点跟踪”，桌面容器加宽以减少两侧空白。
- 前端验证：Biome 通过，TypeScript 通过，Vitest 7 项测试通过，Next.js 生产构建通过。

## Online verification

- Supabase CLI 已链接到项目 `pnjsrihfpyvkhyidzgfq`，dry-run 仅发现预期迁移，随后成功应用
  `20260904013727_create_hot_feed_tables.sql`。
- 远程表统计确认 `hot_items`、`source_status`、`ingestion_runs` 均已建立且当前为空。
- 使用项目 publishable key 经 REST 验证：两个公开表返回 `200 []`，内部运行记录表返回 `401`。
- `supabase test db --linked` 因本机 Docker daemon 未运行而无法启动 pgTAP runner；SQL 测试仍以事务和
  `rollback` 保留在仓库中。
- 浏览器验收覆盖桌面、390px 移动视口、明暗主题和掘金子路由；接入线上 Supabase 后显示预期空态。
- Supabase Vault 与五小时 Cron 已配置；Hono 入口和 RSSHub Node.js ESM 部署问题均已修复，
  生产采集链路可用。

## Review

- Standards：检查了鉴权、密钥边界、RSS 清洗、事务替换、RLS、外链安全、可访问性与构建配置；无阻断项。
- Spec：对照已批准设计检查了首页前五条、完整掘金榜、Supabase 中转、Drizzle 写入、约五小时调度、
  信号橙红主题和响应式状态；无阻断项。
- 审查时补充了无 limit 的完整榜单回归测试、44px 导航触控区、首页五段采集节奏线，并把 Hono
  零配置入口对齐官方 Vercel 模板的 `src/index.ts`。
- 本轮 Standards 复核了 Cron 重复配置、外键约束、密钥边界和清理 SQL 范围；Spec 复核了 30 天保留、
  首页标题、桌面留白及明暗/移动端表现，均无阻断项。
- 没有接受的非阻断后续事项，因此不创建 roadmap。

## Risks

- 远程已建立；本轮改动在完整本地验证和审查结束后创建新 PR。
- 生产环境变量和 Supabase Vault secrets 已由用户配置；30 天清理任务已注册并验证为 active。
- RSSHub 公共实例的可用性不受本项目控制；页面必须保留最后成功数据。

## Production deployment fix

- Vercel 的 Hono 预设优先把 `src/app.ts` 识别为服务入口，但该文件原本只导出应用工厂，导致线上报错
  `Invalid export found in module`。
- 内部应用工厂已重命名为 `src/http-app.ts`，确保 Vercel 选择默认导出 Hono 实例的 `src/index.ts`。
- `src/index.ts` 直接创建 Hono 实例；后端 TypeScript 使用 `NodeNext`，本地相对导入显式携带 `.js`
  后缀，确保 Vercel 生成的原生 ESM 能被 Node.js 24 加载。
- 新增入口选择回归测试，防止后续再次添加优先级更高的保留文件名。
- `vercel build --prod` 成功，直接加载生成的函数入口并调用 `/health` 返回 `200 {"status":"ok"}`。
- 修复提交已推送到功能分支；Vercel Production 跟踪 `master`，生产域名需要在合并或明确发布后复验。

## Retention and homepage refinement

- 新增 `ingestion-runs-retention-daily`，每日 UTC 03:30（北京时间 11:30）删除 30 天前的运行记录。
- 清理语句保留仍被 `hot_items` 或 `source_status` 引用的批次，保证外键安全与最后可用热点快照。
- 配置脚本已在线执行，生产测试采集成功写入 20 条热点；数据库查询确认采集与清理两个 Cron 均为 active。
- 首页 H1 更新为“热点跟踪”，公共页面容器从 45rem 加宽为 Tailwind `max-w-5xl`，正文阅读宽度不变。
- 浏览器验收覆盖 1440px 桌面、390px 移动端及浅色/深色主题；无横向溢出或主题回归。
- 本轮 Biome format/check、TypeScript、29 项 Vitest 与生产构建均通过。
