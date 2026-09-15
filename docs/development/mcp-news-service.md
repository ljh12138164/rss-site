# MCP 新闻服务与 Web 接入页面

## Background

为了让 Cursor、Claude Desktop、Windsurf 等现代 AI 客户端直接消费本站热点资讯，需要在 Cloudflare Worker API (`server/api`) 中提供标准 Model Context Protocol (MCP) 服务。通过工具调用获取全网最新新闻，支持按平台或分类筛选；若未传参数，默认返回最新的 100 条热点。同时在前端 (`apps/web`) 提供 `/mcp` 专属接入指南页面。

## Scope

1. **Cloudflare Worker API (`server/api`)**:
   - 实现符合 MCP 规范 (JSON-RPC 2.0 / Streamable HTTP) 的服务端点与调度器。
   - 提供 `get_news` 工具，支持 `platform` 与 `limit`（默认 100，上限 100）参数。
   - 不传 `platform` 时，默认返回全平台最新 100 条热点新闻（按发布时间与发现时间倒序）。
   - 提供 `GET /api/news` REST 辅助接口，支持完整 CORS 标头。
   - 编写 API 自动化单元测试。
2. **前端 Web 应用 (`apps/web`)**:
   - 新增 `/mcp` 接入指南页面，复用 `SiteShell` 与既有设计系统。
   - 提供服务端点一键复制、主流客户端（Cursor、Claude Desktop、Windsurf、cURL）配置一键复制。
   - 完整展示工具参数说明、默认 100 条说明、36 个平台 ID 清单及常用 AI 对话 Prompt 范例。
   - 在主导航 `SiteHeader` 与页脚中添加 MCP 入口。
   - 编写 Web 自动化测试并确保 56/56 页面静态构建通过。

## Out of scope

- 写入/变更操作（仅提供只读新闻查询）。
- 创建及合并 GitHub Pull Request。

## Acceptance criteria

1. MCP 接口支持标准的 `initialize`、`tools/list`、`ping`、`tools/call` JSON-RPC 请求。
2. `get_news` 工具调用在无任何参数时，从 `signal_articles` 表查询并返回最新的 100 条新闻；传入 `platform` 时按对应平台或分类准确筛选。
3. `/mcp` 路由在前端正常渲染，无任何客户端 Hydration 错误，支持配置一键复制。
4. 全仓 TypeScript 类型检查 (`check-types`) 与 Biome 代码规范检查 100% 通过。
5. 所有自动化测试通过，Web 生产静态构建成功。

## Feasibility

- **MCP 协议实现**：标准 MCP Streamable HTTP 协议为基于 HTTP POST 的 JSON-RPC 2.0 规范，在轻量 Edge Worker 环境下使用原生 TypeScript 处理协议握手与工具调度，无复杂 Node 运行时依赖，冷启动极快。
- **数据查询**：`server/api` 已配置 Hyperdrive 与 Drizzle ORM，`signal_articles` 存储全量文章，单次查询倒序及 LIMIT 100 耗时通常在 20ms 以内。
- **前端页面**：Next.js App Router 静态生成，结合 Tailwind 与 React Aria 组件库构建无缝响应式配置面板。

## Implementation

1. **服务端数据层与调度器**：
   - 在 `server/api/src/mcp/service.ts` 实现 `fetchMcpNews` 与 `formatMcpNewsResponse`：从 `signal_articles` 表中倒序查询最新新闻；针对 `platform` 参数智能支持平台 ID（如 `juejin`, `github`, `openai` 等）与一级分类（如 `technology`, `ai` 等）两种粒度；若不传参数，默认检索全平台最新的 100 条热点。
   - 在 `server/api/src/mcp/handler.ts` 实现 JSON-RPC 2.0 调度协议：支持 `initialize`（握手与版本声明）、`notifications/initialized`、`ping`、`tools/list`（暴露 `get_news` 工具）以及 `tools/call`（执行数据查询并生成标准 Markdown 格式）。
   - 在 `server/api/src/http-app.ts` 和 `src/index.ts` 注册 `/mcp`（POST 处理 JSON-RPC，GET 提供 SSE 发现握手）、`/sse` 别名端点，以及 `/api/news` REST 辅助调试接口，全量开放 CORS 标头。
   - 编写 `server/api/src/mcp/mcp.test.ts` 单元测试，覆盖 11 种核心交互协议。

2. **前端 Web 接入页面与全局导航**：
   - 在 `apps/web/components/mcp-client-config.tsx` 创建客户端接入交互卡片：包含服务地址一键复制、Cursor / Claude Desktop / Windsurf / cURL 配置 Tab 切换与代码一键复制功能。
   - 在 `apps/web/app/mcp/page.tsx` 创建全新接入指南：展示端点、工具规范、无参默认 100 条特性说明、7 大分区 36 个平台字典清单、AI 对话 Prompt 范例以及 REST 调试端点。
   - 在 `apps/web/components/site-header.tsx` 主导航添加 `MCP` 入口，并在 `apps/web/components/site-shell.tsx` 页脚中添加 `MCP 服务` 链接。
   - 编写 `apps/web/app/mcp/page.test.tsx` 与更新 `site-header.test.tsx` 确保渲染与导航链路通过。

## Verification

1. **自动化测试**：
   - 运行 `pnpm --filter @rss-site/api test`：9 个测试文件、78 项测试全部通过（包含新增的 11 项 MCP 协议与工具测试）。
   - 运行 `pnpm --filter @rss-site/web test`：47 个测试文件、162 项测试全部通过（包含新增的 `/mcp` 页面与导航测试）。
   - 运行 `pnpm turbo run test`：双包 240 项测试全部绿灯通过。
2. **类型检查**：
   - 运行 `pnpm turbo run check-types`：双包 TypeScript 检查均以代码 0 退出，无任何类型错误。
3. **代码规范与格式检查**：
   - 运行 `pnpm exec biome check` 检查全部新增与修改的 11 个代码文件：0 error，0 warning。
4. **生产构建验证**：
   - 运行 `$env:SITE_URL="http://localhost:3000"; pnpm --filter @rss-site/web build`：成功编译并在 14.4s 内完成全部 56/56 个页面的静态预渲染，`/mcp` 作为独立 SSG 页面正常生成，Early Hints Link header 正确注入。
5. **评审收口**：
   - 确认无阻塞项；本任务功能自包含完整，无遗留缺陷，不建立额外 roadmap。

## Risks

- AI 客户端频繁调用：只读查询限制最大 100 条，Hyperdrive 连接池复用，风险极低。
