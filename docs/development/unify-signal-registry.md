# 统一信号源注册中心 (Unify Signal Source Registry)

## Background

当前站点收录了 7 大专区（AI、科技、国内新闻、社交热点、财经、游戏、Skills），共 37 个信号源。
在此前的架构中，信号源与专区的元数据在前后端多个浅模块中重复声明：
- `server/api/src/technology/sources.ts` 维护服务端采集元数据
- `apps/web/lib/technology-sources.ts` 维护前端展示元数据
- `apps/web/lib/article-route.ts` 重新组合专区对象数组
- `apps/web/lib/home-articles.ts` 重新组合路径与专区数组
- `apps/web/lib/rss-feed.ts` 重新声明 6 个专区的 RSS 配置
- `apps/web/lib/outbound-link.ts` 维护专区路径联合类型
- `apps/web/lib/sitemap-service.ts` 重复声明专区列表
- `server/api/src/setup/cron.ts` 维护信号源调度任务列表

这种碎片化使得新增或修改信号源时需在 8 处手动同步，极易导致跨端漂移与漏改（例如曾遗漏 `/cron/skills/:source` 路由）。
本任务通过建立独立工作区包 `@rss-site/signals`，将信号源与专区定义合并为具备高内聚深度的单一真理源。

## Scope

1. 在 `packages/signals` 建立 `@rss-site/signals` 工作区子包，并在根目录 `pnpm-workspace.yaml` 中注册 `"packages/*"`。
2. 在 `@rss-site/signals` 中定义全字段统一的领域数据模型：
   - 基础标识：`id`, `name`, `code`, `shortName`, `description`, `section`
   - 展示特性：`isArticle`, `isRanking`
   - 采集配置：`rsshubPath`, `feedUrl`, `itemLimit`, `titleFromFirstStrong`, `urlFromFirstAnchor`, `skillMetadata`
   - 调度配置：`cronSchedule`, `cronJobName`
3. 暴露紧凑的核心查询接口：
   - `getSource(id)` / `isSourceId(id)`
   - `getSection(id)` / `isSectionId(id)`
   - `listSections()`
   - `listSources(filter?)`
   - `listCronJobs()`
   - `resolveSignalFeedUrl(source, rsshubBaseUrl)`
4. 在 `apps/web` 与 `server/api` 中接入 `@rss-site/signals`，重构现有 8 处调用方，彻底移除冗余定义。
5. 配置 Next.js `transpilePackages` 与 TypeScript 解析支持。
6. 保证全仓类型检查、单元测试与全站静态页面构建全部通过。

## Out of scope

- 方案二：后端采集管线内部重构与 SQL 事务封装（留待后续任务执行）。
- 方案三：前端热点读取器 `hot-feed.ts` 的接口泛化（留待后续任务执行）。
- 方案四：边缘缓存失效与 CDN 限流适配器（留待后续任务执行）。
- 数据库表结构迁移与外部云端 Supabase Cron 变动。
- MCP 协议接口与参数规范变更（必须 100% 保持向下兼容）。

## Acceptance criteria

1. `packages/signals` 包含自成一体的 TypeScript 定义与单元测试。
2. `server/api` 和 `apps/web` 成功安装并使用 `@rss-site/signals`，无需冗余声明各专区信号源列表。
3. `pnpm check-types` 无任何类型错误。
4. `pnpm test` 全量单元测试 100% 通过（共 260 项测试全部通过）。
5. 构建命令 `pnpm build` 在本地顺利通过（57/57 个静态页面全量生成）。

## Implementation

1. **建立工作区包 `packages/signals`**：
   - 配置 `package.json`（名称 `@rss-site/signals`，导出 `./src/index.ts` 纯源码）和 `tsconfig.json`。
   - 在 `pnpm-workspace.yaml` 中添加 `packages/*`，并通过 `pnpm install` 自动建立软链。
   - 在 `server/api/package.json` 与 `apps/web/package.json` 中声明 `"@rss-site/signals": "workspace:*"`。
   - 在 `apps/web/next.config.ts` 中配置 `transpilePackages: ['@rss-site/signals']`。

2. **单一真理源建模**：
   - 在 `packages/signals/src/index.ts` 中统一声明 7 大专区（`ai`, `technology`, `news`, `social`, `finance`, `games`, `skills`）以及 37 个信号源的完整属性。
   - 保持常量字面量类型，精确推导 `SignalSourceId`、`SignalSectionId`、`SignalCronJob` 等联合类型。
   - 保持服务端 Cron 调度次序（chronological stagger order），确保单元测试精准对齐。

3. **收拢各浅模块调用方**：
   - `server/api/src/technology/sources.ts`：改为直接 re-export `@rss-site/signals`。
   - `server/api/src/setup/cron.ts`：直接引用 `SIGNAL_CRON_JOBS`，删除 50 余行手写 Cron 映射。
   - `apps/web/lib/technology-sources.ts`：改为直接 re-export `@rss-site/signals`。
   - `apps/web/lib/article-route.ts`：专区定义与信号源直接从 `@rss-site/signals` 派生。
   - `apps/web/lib/home-articles.ts`：直接引入 `signalSources`。
   - `apps/web/lib/rss-feed.ts`：直接基于 `signalSections` 生成 6 个专区的 RSS 源配置。
   - `apps/web/lib/sitemap-service.ts`：直接遍历 `signalSections` 与 `signalSources`。
   - `apps/web/lib/outbound-link.ts`：由 `signalSections` 的 `id` 自动提取 `OutboundReturnPath`。
   - `apps/web/app/mcp/page.tsx`：由 `signalSources` 动态生成接入页面支持的平台列表。

## Verification

1. **单测套件 (`pnpm test`)**：
   - `@rss-site/signals`：1 个文件，7 项单测全部通过。
   - `@rss-site/api`：9 个文件，78 项单测全部通过（包含 MCP 11 项回归测试）。
   - `@rss-site/web`：51 个文件，175 项单测全部通过。
   - 全仓共 61 个测试文件，260 项测试 100% 通过。
2. **全仓类型检查 (`pnpm check-types`)**：
   - 3 个子包（signals, web, api）通过 TypeScript `tsc --noEmit`，零类型告警。
3. **静态页面构建 (`pnpm build`)**：
   - Turbo 执行 Next.js 生产构建，57/57 静态路由成功预渲染，Early Hints 生成正常。
4. **格式检查与修复 (`pnpm exec biome format --write ...`)**：
   - 所有变更代码均已统一格式化。

## Risks

- **Next.js 客户端组件引用**：`@rss-site/signals` 纯数据定义，未引入任何 Node.js 特有模块，在客户端与 Edge/Node 运行时均可零开销编译。
- **MCP 接口稳定性**：MCP 模块依赖的信号源 ID 和中文名映射由 `signalSources` 驱动，实测 11 项 MCP 单测全部稳定通过，接口行为零变更。
