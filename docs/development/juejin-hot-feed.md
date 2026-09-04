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
- Supabase 热点表、公开来源状态、内部运行记录、RLS 和约五小时一次的 Cron。
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
- 匿名前端可读取热点，但不能写入或读取内部错误详情。
- UI 使用 shadcn 语义变量实现确认的信号橙红主题，并覆盖明暗和移动端状态。
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

技术难点及约束：

- 使用唯一约束、批次 ID 和事务抵御重复/漏发 Cron。
- 完整验证 feed 后才替换榜单，避免上游失败清空页面。
- 使用 Supabase transaction pooler，并关闭 prepared statements 适配无状态函数。
- 通过 RLS、受限运行状态和独立密钥隔离匿名读与服务端写。
- UI Skills MCP 注册表未在当前会话暴露；界面回退到已确认的博客设计系统、
  `frontend-design` 指南和项目 UI 质量约束，不声称完成 UI Skills MCP 审查。

## Implementation

- 当前功能分支：`feat/juejin-hot-feed`。
- 基线清理提交：`8e31d34`。
- 前端保留 `apps/web`，后端放在 `server/api`，匹配现有 pnpm workspace。
- 数据库运行时写入使用 Drizzle；版本化 SQL 迁移保存在 Supabase migrations 中。
- shadcn 只引入 Button、Badge、Breadcrumb、Separator、Skeleton 和 Tooltip。
- 页面宽度、排版与明暗模式参考 `C:\Users\PC\Desktop\front\TEST\blog`，不使用 Nextra。

## Verification

实施计划：
[Juejin Hot Feed Implementation Plan](../superpowers/plans/2026-09-04-juejin-hot-feed.md)

计划已完成，按 TDD 在当前会话执行。

实现前仓库没有应用文件或 `test` 脚本，无法运行有意义的基线测试；首次可执行基线是工作区
脚手架完成后的 lint、类型检查与空测试套件。

## Risks

- 远程已建立；PR 仅在完整本地验证和审查结束后创建。
- 生产部署需要用户配置 Vercel 与 Supabase Vault secrets。
- RSSHub 公共实例的可用性不受本项目控制；页面必须保留最后成功数据。
