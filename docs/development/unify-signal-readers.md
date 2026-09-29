# 统一热点与文章读取器 (Unify Hot Items & Article Readers)

## Background

在完成单一真理源 `@rss-site/signals` 与服务端管道收拢之后，Web 前端的数据读取层（`apps/web/lib/hot-feed.ts`、`apps/web/lib/home-articles.ts`、`apps/web/lib/signal-article.ts`）仍存在大量重复样板代码：
1. **Section Feeds 重复模板代码**：`hot-feed.ts` 中针对 7 大专区（technology, skills, news, ai, social, finance, games）重复编写了 7 组完全相同的 `queryXFeeds`、`getXFeeds` 和 `getXFeed` 函数（超过 150 行机械重复）。
2. **硬编码专区与信号源列表**：`home-articles.ts` 手动组装 `sections` 与 `sources` 映射表，未充分复用 `@rss-site/signals` 提供的 `listSignalSections` 和 `listSignalSources`。
3. **文章读取器命名特异性**：`signal-article.ts` 的函数名为 `getNewsArticle`，但底层查的是通用的 `signal_articles` 表，可读取任意专区文章。

## Scope

1. **泛化重构 `apps/web/lib/hot-feed.ts`**：
   - 提取通用的 `getSectionFeeds<T>(section, limitPerSource?, query?)` 与 `getSourceFeed(sourceId, limit?, query?)`。
   - 将原有的 13 个具体专区函数重构为基于通用函数的单行类型特化，100% 保持所有原有导出函数、参数签名及类型不变。
   - 使用 `@rss-site/signals` 的 `SignalSectionId` 与 `listSignalSources` 替代手写的硬编码联合类型与列表。
2. **重构 `apps/web/lib/home-articles.ts`**：
   - 使用 `@rss-site/signals` 动态派生 `sections` 与 `sources` 映射关系，消除硬编码。
3. **通用化 `apps/web/lib/signal-article.ts`**：
   - 增加通用的 `getSignalArticle` 函数，并保持 `getNewsArticle` 作为完全兼容别名。
   - 使用 `getSignalSource(source).section` 获取分区标识，消除多余查询。
4. **验证与回归**：
   - 确保 `apps/web` 下所有单测（包括各栏目路由页面与 Feed 测试）100% 通过。
   - 确保全仓类型检查与 Next.js 生产构建通过。

## Out of scope

- 变更数据库 Schema。
- 变更 API 服务端或 Worker 端逻辑。
- 改变页面端 UI 组件的交互与渲染样式。

## Acceptance criteria

1. `hot-feed.ts` 提供泛型 `getSectionFeeds` 与 `getSourceFeed`，7 大专区的获取函数大幅精简。
2. 保持所有既有调用方（包括 7 个专区路由 page、RSS 路由、Sitemap 等）零改动正常运行。
3. `pnpm check-types` 零错误。
4. `pnpm test` 全量单测通过。
5. `pnpm build` 生产构建成功。

## Feasibility

- **纯前端库层重构**：所有函数保持相同的返回类型和运行时行为，零外部依赖变化。
- **结论**：Feasible（可行）。

## Implementation

1. 重构 `apps/web/lib/hot-feed.ts`，实现泛型 `getSectionFeeds` 与 `getSourceFeed`。
2. 重构 `apps/web/lib/signal-article.ts`，实现通用 `getSignalArticle`。
3. 重构 `apps/web/lib/home-articles.ts`，由 `@rss-site/signals` 动态派生专区。
4. 运行单测、类型检查和构建验证。

## Verification

1. **单测套件 (`pnpm test`)**：
   - `@rss-site/signals`: 7 项全部通过。
   - `@rss-site/api`: 10 个测试套件，83 项全部通过。
   - `@rss-site/web`: 51 个测试套件，176 项全部通过（新增针对泛型 `getSectionFeeds` 与 `getSourceFeed` 的回归测试）。
   - 全仓共 62 个测试套件，266 项测试 100% 通过。
2. **全仓类型检查 (`pnpm check-types`)**：
   - `@rss-site/signals`, `@rss-site/api`, `@rss-site/web` 3 个包全部零类型错误。
3. **生产构建 (`pnpm build`)**：
   - Next.js Turbopack 生产构建成功，57/57 静态页面全量生成。
4. **格式检查 (`pnpm exec biome check`)**：
   - 全部变更代码通过 Biome 检查，0 错误，0 警告。

## Risks

- **参数传递与单测 Mock 兼容性**：`getSectionFeeds` 与 `getSourceFeed` 优先使用调用方注入的 `query` 参数，原有的单测 mock 完全兼容，实测 100% 绿色。

