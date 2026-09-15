# 隔离首页列表加载边界

## Background

用户访问文章详情页（如 `/social/hupu/奔现失败-呜呜呜--e5653853-b55e-4639-81cc-21078b0d881c`）时，界面展示了首页“今日热点”列表骨架。详情路由原本已有专属的 `ArticleLoading`（46rem 阅读骨架），但由于 `app/loading.tsx` 直接放置在 `apps/web/app/` 根目录下并硬编码了首页列表结构，Next.js App Router 将其作为全站子路由的共同祖先 Suspense fallback。当客户端路由跨分区分块加载或挂起时，外层 fallback 被触发，导致首页列表骨架泄露至文章阅读页。

## Scope

- 将首页特有的列表骨架及页面从根目录隔离至路由组 `apps/web/app/(home)/`。
- 移除根级 `app/loading.tsx`，避免子路由继承首页列表 fallback。
- 补充文章详情路由不继承首页列表骨架的自动化回归测试。

## Out of scope

- 首页与各分类列表的数据请求逻辑、缓存时间（revalidate）及样式动效。
- 文章详情页、AI 时间轴以及其他独立页面的视觉设计与业务功能。
- 生产环境自动化部署或 Cron 任务配置。

## Acceptance criteria

1. 首页公开访问路径 `/` 保持不变，在首屏加载时仍享有“今日热点”列表骨架。
2. 所有二级栏目及文章详情页（如 `/social/[source]/[slug]`、`/ai/[source]/[slug]`、`/news/[source]/[slug]` 等）在加载时仅使用各自专属的 loading 边界，祖先加载链中绝不暴露首页列表骨架。
3. 全仓 TypeScript 类型检查、Biome 代码格式与 Web 全量测试 100% 通过。
4. 生产构建（55/55 页面）正常生成，Early Hints 正确注入。

## Feasibility

可行。已在 `docs/development/fix-event-loading.md`（AI 时间轴与事件详情隔离）中成功运用 Next.js 路由组机制（带括号的文件夹如 `(home)` 在 App Router 中仅做逻辑分组，不参与 URL 映射）。将 `page.tsx`、`loading.tsx` 和 `page.test.tsx` 移至 `(home)` 即可在不修改任何公开 URL 的前提下将列表 loading 边界严格限制在根路径 `/`，从根源消除对子路由的污染。

## Implementation

1. 新增 `apps/web/app/(home)/page.tsx`、`apps/web/app/(home)/loading.tsx` 和 `apps/web/app/(home)/page.test.tsx`，修正相对导入路径。
2. 删除根目录下 `apps/web/app/loading.tsx`、`apps/web/app/page.tsx` 和 `apps/web/app/page.test.tsx`。
3. 在 `apps/web/components/article-loading.test.tsx` 中增加回归断言：动态扫描所有 loading 边界模块，确保七类文章详情路由的祖先加载链中绝不包含首页列表文案“汇总各分区的全部文章”。
4. 使用 Biome 格式化并清理旧 `.next` 缓存中的失效类型映射。

## Verification

1. **自动化测试**：
   - 运行 `pnpm --filter @rss-site/web test`：46 个测试文件、160 项测试全部通过（包含新增的祖先边界防护断言及迁移后的首页测试）。
2. **类型检查**：
   - 清理旧构建缓存后运行 `pnpm --filter @rss-site/web check-types`：退出码 0，无任何类型错误。
3. **代码与差异检查**：
   - 运行 `pnpm --filter @rss-site/web exec biome check "app/(home)" components/article-loading.test.tsx`：4 个文件全部通过，0 error。
   - 运行 `git diff --check`：通过，无空白冲突。
4. **生产构建验证**：
   - 执行 `$env:SITE_URL="http://localhost:3000"; pnpm --filter @rss-site/web build`：成功编译并在 29.9s 内完成 55/55 页面静态生成，`/` 正确映射为预渲染静态页面，Early Hints CSS Link header 注入正常。
5. **评审收口**：
   - 确认无阻塞项；本任务属于边界隔离重构，无额外衍生需求，因此不创建独立 roadmap 文件。

## Risks

本次变更仅调整文件系统中的路由分组与加载边界归属，未改动任何业务数据层或客户端 Hydration 逻辑；公开 URL 保持不变，回归风险极低。
