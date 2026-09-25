# 收拢信号采集管线 (Signal Ingestion Pipeline)

## Background

在完成单一真理源 `@rss-site/signals` 之后，服务端的信号采集逻辑仍然存在明显的架构割裂：
1. **历史命名偏颇**：目前所有的抓取、解析、存储和失效逻辑均位于 `server/api/src/technology/` 目录下，类型与函数命名为 `parseTechnologyFeed`、`TechnologyFeedItem` 等。而实际上该模块处理全站 7 个专区（AI、科技、新闻、社交、财经、游戏、Skills）共 37 个信号源。
2. **浅模块碎片化编排**：`server/api/src/index.ts` 中为了实现一次采集，直接将网络流截断读取 (`readBoundedText`/`fetchSignalFeed`)、URL 解析 (`resolveSignalFeedUrl`)、数据解析 (`parseTechnologyFeed`)、数据库存储器 (`DrizzleSignalStore`)、状态机流转 (`ingestSignal`) 与边缘失效广播 (`publishSourceUpdate`) 手工胶合在一起，暴露了过多内部实现细节。
3. **副作用与职责边界**：网络流安全限制（5MB 保护）、事务写入与重试失败记录、Web 端 ISR 缓存清除应当内聚在一个高内聚的管道协调器 (Deep Pipeline Coordinator) 中。

## Scope

1. 建立 `server/api/src/ingestion/` 核心目录，将采集领域的子能力系统化重构：
   - `feed.ts`: 泛化命名为 `parseSignalFeed`，输出 `SignalFeedItem`，保留兼容别名。
   - `fetch.ts`: 封装带 5MB 流量防御、30s 超时和 User-Agent 的流式抓取器 `fetchSignalFeed`。
   - `content-change.ts`: 负责前后快照比对 `changedSourceKeys`。
   - `store.ts`: `DrizzleSignalStore`，处理 `signal_articles`、`hot_items`、`source_status` 事务以及 AI 事件关联。
   - `publish.ts`: 处理 `/api/revalidate` 的 Web 缓存失效通知。
   - `pipeline.ts`: 提供高层管道协调器 `runIngestionPipeline(source, options)`，端到端编排完整生命周期。
2. 保持 `server/api/src/technology/` 目录的向后兼容 shim（向后重新导出对应模块），确保任何遗留路径或 CLI 脚本零中断。
3. 更新 `server/api/src/index.ts`，彻底消除冗余网络及存储粘合代码，直接接入 `runIngestionPipeline`。
4. 更新 `server/api/src/http-app.ts`、`server/api/src/mcp/service.ts` 和 `server/api/src/setup/cron.ts` 中对 `@rss-site/signals` 的直接引用。
5. 编写针对 `pipeline.ts` 的单元测试，验证正常抓取、解析、事务入库、失效通知以及异常时写入 `ingestion_runs` 失败记录的完整链路。
6. 保证全仓 260+ 测试、类型检查与全站生产构建 100% 通过。

## Out of scope

- 变更 PostgreSQL 数据库表结构或 Drizzle Schema。
- 变更云端 Supabase Cron 任务或 Vault 密钥。
- 修改 `/mcp` 接口与工具定义（严格保证协议向下兼容）。
- 前端页面呈现逻辑变更。

## Acceptance criteria

1. `server/api/src/ingestion/pipeline.ts` 对外暴露统一的高阶接口 `runIngestionPipeline`。
2. `server/api/src/index.ts` 不再包含裸写的数据流截断循环、DrizzleStore 构造或 Revalidate 粘合代码。
3. `server/api/src/technology/` 提供的兼容导出完整支持既有引用与单测。
4. `pnpm check-types` 零错误。
5. `pnpm test` 全量单测通过（包含新增的 pipeline 单测）。
6. `pnpm build` 顺利完成。

## Feasibility

- **纯服务端架构重构**：本次改动仅涉及 `server/api` 内部组织结构，将分散的浅模块合并为深模块。
- **运行时环境**：Cloudflare Workers 运行时已原生支持 `fetch`、`AbortSignal.timeout` 及 Web Streams (`ReadableStreamDefaultReader`)，原流式防御逻辑在迁移后表现完全一致。
- **结论**：Feasible（可行）。

## Implementation

1. 创建 `server/api/src/ingestion/fetch.ts`，将 `server/api/src/index.ts` 中的流式流量截断与抓取逻辑抽取为可独立测试的模块。
2. 将 `server/api/src/technology/` 中的 `feed.ts`、`content-change.ts`、`store.ts`、`publish.ts`、`ingest.ts` 迁移至 `server/api/src/ingestion/`，并进行命名泛化（保留向后兼容别名）。
3. 实现 `server/api/src/ingestion/pipeline.ts`，协调 Fetch -> Parse -> Ingest/Store -> Publish 阶段，记录日志与异常处理。
4. 在 `server/api/src/technology/` 保留轻量 re-export shim。
5. 重构 `server/api/src/index.ts` 使用 `runIngestionPipeline`。
6. 新增 `server/api/src/ingestion/pipeline.test.ts`。
7. 执行全仓检查与验证。

## Verification

1. **单测套件 (`pnpm test`)**：
   - `@rss-site/signals`: 7 项全部通过。
   - `@rss-site/api`: 10 个测试套件，83 项全部通过（新增 5 项 pipeline 协调器与流量防护单测）。
   - `@rss-site/web`: 51 个测试套件，175 项全部通过。
   - 全仓共 62 个测试套件，265 项测试 100% 通过。
2. **全仓类型检查 (`pnpm check-types`)**：
   - `@rss-site/signals`, `@rss-site/api`, `@rss-site/web` 零类型错误。
3. **生产构建 (`pnpm build`)**：
   - Next.js Turbopack 生产构建通过，57/57 静态路由全量生成，Early hints 注入正常。
4. **格式与静态检查 (`pnpm exec biome check`)**：
   - 所有新增与变更文件均通过 Biome 检查，0 错误，0 警告。

## Risks

- **异常处理分支丢失**：经 `pipeline.test.ts` 明确断言，当抓取或解析抛出异常时，均正常调用 `store.recordFailure` 记录到 `ingestion_runs` 中，并向上传播异常以便监控感知。
- **重验证超时不阻断批次**：`publishSourceUpdate` 具备超时防护与 status 状态容错，重验证失败不会导致采集批次回滚。

