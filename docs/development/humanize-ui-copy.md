# 详情与功能页文案去模板化（humanizer-zh）

## Background

站点此前已在 `docs/research/2026-10-14-ui-copy-review.md` 与 `docs/development/official-homepage-copy.md` 完成首页和分区顶栏的文案收敛，但后续上线或遗漏的页面（稍后读 `/reading-list`、MCP 接入页 `/mcp`、关于页 `/about` 首段、隐私说明 `/privacy`、AI 来源描述模板 `source-page-text.ts` 以及文章/事件详情的翻译与总结提示）仍残留明显的模板化表达与开发提示词复读：

- `/reading-list` 将后端实现约束“零后端数据库开销”和宣传词“深度热点”、“沉浸研读”直接写进读者副标题与空状态，且混用“您”与全站统一的“你”。
- `/mcp` 与 `McpClientConfig` 重复堆叠“支持……支持……”、“一键命令行接入”、“掌握全网态势”，并将定时采集内容写成“全网实时热点资讯”（违反 `PRODUCT.md` 不将定期采集表述为实时更新的边界）。
- `/about` 首段保留“专注……六大维度的轻量化热点聚合与 RSS 订阅平台”宣传套话。
- `/privacy` 存在“这与浏览器中的主题设置是不同的数据处理过程”等无独立信息的解释句。
- `apps/web/lib/source-page-text.ts` 为所有 AI 来源页面机械拼接“按发布时间浏览，保留文章来源与原文链接”。
- `ArticleTranslation` 与 `EventTranslation` 在超时报错中向读者暴露“本地模型下载或翻译超时”等服务端内部细节；`ArticleSummary` 底部说明与文章页脚重复。

## Scope

按 `humanizer-zh` 规则与 `PRODUCT.md` 边界润色以下文件中的用户可见文案，保留全部事实、数字（如 `100 条`、`35+`）、条件限定与既有 DOM/组件结构：

- `apps/web/app/reading-list/page.tsx`：移除“零后端数据库开销”、“沉浸研读”及“您/系统”客服腔，直接说明收藏与最近 100 条阅读足迹保存在当前浏览器。
- `apps/web/app/mcp/page.tsx` 与 `apps/web/components/mcp-client-config.tsx`：删去“实时热点”、“掌握全网态势”及重复的“一键”修饰，准确交代客户端接入方式与默认返回最新 100 条热点的规则。
- `apps/web/app/about/page.tsx`：将首段“专注……六大维度的轻量化……平台”改为直接陈述 35+ 来源与六个分区。
- `apps/web/app/privacy/page.tsx`：顺畅首段标点与重复主语，删去“这与浏览器中的主题设置是不同的数据处理过程”冗余句。
- `apps/web/lib/source-page-text.ts`：去掉 `AI_DESCRIPTION` 与 `aiSourcePageText` 中机械重复的“按发布时间浏览，保留文章来源与原文链接”尾巴，与其余五个分区的来源描述保持一致。
- `apps/web/components/article-translation.tsx`、`apps/web/components/event-translation.tsx`、`apps/web/components/article-summary.tsx`：将超时报错统一为“翻译超时，请稍后重试”，精简总结卡片底部说明并保留 `excerpt` 与正文的区分。

## Out of scope

- 修改页面布局、样式、路由、数据结构或后端接口。
- 改动已通过 GEO 验收的官网首页（`apps/web/app/page.tsx`）正文词数与结构化数据。
- 新增信号源、调整 Cron 或直接部署生产环境。

## Acceptance criteria

- 上述 9 个文件的用户可见文案符合 `humanizer-zh` 规范：无“零后端数据库开销”、“沉浸研读”、“掌握全网态势”、“六大维度的轻量化……平台”、“本地模型下载”等模板化或内部实现措辞，不将定时采集写成“实时”。
- 保留所有事实、数字、限定条件、标题层级、锚点 ID 与测试契约。
- `@rss-site/web` 单元测试、TypeScript 类型检查、变更文件 Biome 检查与 `git diff --check` 全部通过。

## Feasibility

可行。本次改动仅涉及前端 JSX/TS 静态文案字符串，不改变任何组件状态机、DOM 层级、路由参数或 API 协议。唯一需要注意的约束是 `apps/web/app/mcp/page.test.tsx` 与 `apps/web/app/reading-list/page.test.tsx` 对关键标题和数字（如 `稍后读与阅读足迹`、`暂无稍后阅读文章`、`Cursor`、`100 条`）的断言，以及 `humanizer-zh` 文件保护规则对标题文字与锚点的保护，改写时均原样保留。

## Implementation

- 复用现有组件与页面结构，仅替换散文描述、空状态说明与错误提示字符串。
- 在 `apps/web/app/reading-list/page.test.tsx` 补充对更新后本地存储说明文案的断言，确保回归可验证。

## Verification

- `pnpm --filter @rss-site/web test`：90 个测试文件、336 项测试全部通过。
- `pnpm --filter @rss-site/web check-types`：TypeScript 类型检查通过。
- `pnpm biome check`（变更代码文件与文档）：0 错误、0 警告。
- `git diff --check`：无空白或格式错误。

## Review and delivery

- **Standards & Acceptance 审查**：逐项核对 `humanizer-zh` 交付前核对单（未新增原文外事实、未丢失数量与条件限定、未破坏标题锚点与受保护代码、符合 `PRODUCT.md` 边界）。
- **审查结论**：0 项阻塞问题（Blocking），0 项需延后的后续事项（Accepted follow-ups），因此不创建空路线图文档。

## Risks

- 无运行时或数据迁移风险；文案更新随下一次 Web 常规构建发布生效。
