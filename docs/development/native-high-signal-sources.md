# 原生高信噪比信号源接入 (Native High-Signal Feeds)

## Background

网站已具备完善的文章阅读器与双语段落穿插对照阅读模式，但部分历史来源存在正文过短、无实质内容或依赖第三方 RSSHub 爬虫导致潜在超时/配额消耗的问题。
为提升整体内容品质与双语阅读价值，并彻底避免 Vercel RSSHub 负载顶满，本项目接入首批 4 个**100% 官方直出原生 RSS/Atom 信号源**：
1. **极客公园 (GeekPark)**：深度中文科技商业特稿，官方直出图文完整全文。
2. **Lil'Log (Lilian Weng)**：前 OpenAI 安全研究员 AI 深度博客，万字长文与公式解析，双语对照绝佳载体。
3. **Simon Willison's Weblog**：LLM、AI 工具与开发者实践独立专栏，10KB+ 全文 Atom 输出，双语精读首选。
4. **触乐网 (Chuapp)**：国内严肃游戏人文特稿与产业调查，官方直出图文完整全文。

这批信号源直接由 Cloudflare Worker / API 边缘发起原生 Fetch（`feedUrl`），0 消耗 Vercel 算力与 RSSHub 配额。

## Scope

1. **Feed 解析器升级 (Atom 1.0 + RSS 2.0 统一支持)**：
   - 升级 `server/api/src/ingestion/feed.ts`，在保持现有 RSS 2.0 兼容的同时，轻量扩展支持 Atom 1.0 标准（`<feed><entry>`、`link[@href]`、`summary/content`、`published/updated`）。
2. **信号源注册中心扩充 (`@rss-site/signals`)**：
   - 在 `technologySources` 增加 `geekpark`。
   - 在 `aiSources` 增加 `lilian-weng` 与 `simon-willison`。
   - 在 `gameSources` 增加 `chuapp`。
   - 配置专属 `code`, `shortName`, `description`, `itemLimit`, `feedUrl` 及错峰 `cronSchedule`。
3. **数据库架构迁移 (Supabase SQL Migration)**：
   - 创建新版本迁移文件，更新 `ingestion_runs`、`source_status`、`hot_items`、`signal_articles` 四大核心表的 CHECK 约束，纳入新源。
4. **测试与质量保障**：
   - 编写针对 Atom 1.0 的解析单测。
   - 更新 `@rss-site/signals` 导出与测试用例。
   - 保证全仓单测 100% 通过、类型检查 0 错误、Biome 检查通过。
5. **生产数据准入验证 (New Signal Source Gate)**：
   - 执行上游 Feed 真实连通性探测。
   - 记录无凭据验证证据。

## Out of scope

- 剔除或清理既有历史源（待后续统一清理规划）。
- 更改现有前端 UI 布局或阅读器主样式。
- 引入重量级 RSS 解析库（保持 fast-xml-parser 原生实现）。

## Acceptance criteria

1. `parseSignalFeed` 同时兼容 RSS 2.0 与 Atom 1.0，正确提取标题、规范化 URL、正文 HTML、摘要与发布时间。
2. `@rss-site/signals` 中新增 4 个原生源，并通过所有查询与派生函数的类型校验。
3. 数据库迁移 SQL 完整、可重入，且与历史约束严格对齐。
4. 4 个源的上游探测均为 HTTP 200，且能解析出高质量完整条目。
5. 全仓单测全绿，前端生产构建无异常。

## Feasibility

- **Atom 协议支持**：Atom 1.0 结构与 RSS 2.0 高度相似，只需在 fast-xml-parser 的 `isArray` 中追加 `feed.entry`，并在提取字段时对 `item.link?.['@_href']` 和 `item.published ?? item.updated` 做微量回退处理，新增代码仅约 20 行，零外部依赖，极速且健壮。
- **Cloudflare Worker 兼容性**：4 个原生源均支持标准 HTTPS GET 请求与现代 User-Agent，无需 Cookie 或复杂反爬认证，边缘网络延迟极低。

## Implementation

1. **`server/api/src/ingestion/feed.ts`**：
   - 增强支持 Atom 1.0 `<feed><entry>` 格式。
   - 补充 `server/api/src/technology/feed.test.ts` 中的 Atom 样例单测。
2. **`packages/signals/src/index.ts`**：
   - 注册 `geekpark`, `lilian-weng`, `simon-willison`, `chuapp`。
   - 配置对应的错峰 Cron 调度与描述。
3. **`supabase/migrations/20260926040000_add_native_high_signal_sources.sql`**：
   - 更新数据库 CHECK 约束。
4. **前端适配**：
   - 如有必要，微调前端展示或颜色标牌。

## Verification

1. **上游原生 Feed 连通性与内容探测 (HTTP 200, 零凭据)**：
   - `geekpark` (`http://www.geekpark.net/rss`):
     - HTTP 200, 350KB, 包含 30 篇完整图文正文（平均单篇 10KB+，发布时间规范）。
   - `lilian-weng` (`https://lilianweng.github.io/index.xml`):
     - HTTP 200, 80KB, 包含 53 篇 AI 技术深度长文（公式与丰富段落，发布时间规范）。
   - `simon-willison` (`https://simonwillison.net/atom/entries/`):
     - HTTP 200, 15 篇最新长文专栏（Atom 1.0 格式，单篇包含 10KB+ 完整分析与评测图表）。
   - `chuapp` (`http://www.chuapp.com/feed`):
     - HTTP 200, 236KB, 包含 30 篇游戏人文特稿与产业调查（平均单篇 8KB+，发布时间规范）。

2. **全仓类型检查 (`pnpm -r check-types`)**：
   - `@rss-site/signals`: 0 errors
   - `@rss-site/api`: 0 errors
   - `@rss-site/web`: 0 errors

3. **全套自动化测试 (`pnpm -r test`)**：
   - `@rss-site/signals`: 7/7 tests passed (包括 41 个信号源分布与分类校验)。
   - `@rss-site/api`: 85/85 tests passed (包括 Atom 1.0 解析、220 个无碰撞 Cron 调度槽位校验)。
   - `@rss-site/web`: 197/197 tests passed (包括 AI 专区与科技专区多源视图渲染)。
   - **全仓共计 289 项测试全部 100% 通过**。

4. **代码规范与格式检查 (`pnpm biome check`)**：
   - 校验通过，0 error, 0 warning。

5. **前端生产静态构建 (`pnpm --filter @rss-site/web build`)**：
   - 成功生成 62/62 静态页面，包括新增的 `/ai/lilian-weng`、`/ai/simon-willison`、`/technology/geekpark` 与 `/games/chuapp` 专属页面。

## Risks

- 上游 Feed 内容体量过大（如某些超长文章超过 512KB）：`cleanFeedArticleHtml` 与 `feed.ts` 已内置 512KB 截断保护，超出时置 `contentHtml` 为 null 并保留 summary，防止溢出。
