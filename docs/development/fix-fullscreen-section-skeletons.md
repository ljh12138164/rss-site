# 修复栏目全屏骨架

## Background

六个栏目原先依赖栏目根级 `loading.tsx`。详情导航命中该上层边界时，`SectionLayout` 会为详情路径透传子内容，裸列表骨架因此越过页面主体成为全屏骨架。第一次修复给根 loading 增加 `SiteShell`，又在来源页保留的 `SectionLayout` 内形成第二个 `SiteShell`，造成双顶栏嵌套。用户确认问题不是加载卡死，而是加载边界位置错误。

## Scope

- 修复 AI、科技、新闻、社交、财经、游戏六个栏目根级加载边界。
- 排查其他路由级 loading，确认是否存在同类裸骨架。
- 增加能够捕获顶栏消失和骨架越界的回归测试。

## Out of scope

- 不改变数据请求、缓存、ISR、正常页面内容或现有骨架配色与动效。
- 不新增页面、弹窗、依赖或视觉系统。
- 不部署生产环境。

## Acceptance criteria

- 六个栏目和来源列表加载时仍有且只有一个站点顶栏、一个 `main`、一个页脚和一套来源导航。
- 列表骨架位于受约束的页面主体内，不再从视口边缘铺满。
- 文章详情继续使用既有 46rem 阅读骨架；首页、GitHub 榜单和 AI 时间轴 loading 不回退。
- 全仓 loading 审计无未处理的同类裸页面边界。

## Feasibility

可行。截图中的双顶栏来自 `SectionRouteLoading` 与来源页 `SectionLayout` 的两个 `SiteShell`。正确边界是文章查询本身：让 `PaginatedArticleFeed` 在内部 `Suspense` 中加载数据，就能始终保留外层栏目布局，同时不影响详情路由自己的独立 loading。

技术难点是 Next App Router 会根据导航、预取和流式渲染选择上层 loading。路由根边界无法同时适配“来源页保留父布局”和“详情页父布局主动透传”两种上下文，因此删除该模糊边界，把 `Suspense` 下沉到唯一会等待的文章数据组件。

## Implementation

沿用 `detail-loading.md`、`home-list-navigation.md` 已接受的设计：全局顶栏保持稳定，冷蓝灰骨架仅表示主体内容加载。UI Skills registry 当前未暴露，按仓库现有视觉系统与 UI quality 清单回退。

- 删除第一次错误修复引入的 `SectionRouteLoading`，并删除六个栏目根级 `loading.tsx`。
- `PaginatedArticleFeed` 改为同步外壳，在内部 `Suspense` 中渲染异步文章查询，fallback 只使用裸 `SectionLoading`；栏目或来源页的唯一 `SectionLayout` 始终保留。
- 首页、GitHub 榜单、AI 时间轴和七个详情 loading 均已审计，原本已有自己的 `SiteShell`，无需修改。
- 第一次回归测试只孤立渲染路由 loading，未覆盖它与真实父布局的组合，因此给出了错误安全感；最终回归改为渲染 `TechnologyLayout + PaginatedArticleFeed` 并让文章查询永久 suspend。

## Verification

- 最终红灯：`pnpm --dir apps/web exec vitest run components/section-layout.test.tsx` 在真实“来源布局 + 异步文章列表”组合中抛出未捕获 suspension，证明数据组件缺少内部边界。
- 最终绿灯：`pnpm --dir apps/web exec vitest run components/section-layout.test.tsx components/article-loading.test.tsx` 为 16/16，通过唯一顶栏、唯一 main、唯一来源导航及详情独立外框断言。
- Web 全量测试：40 个文件、136 项全部通过。
- `pnpm --filter @rss-site/web check-types` 通过。
- 修改范围 Biome 与 `git diff --check` 通过。
- `SITE_URL=http://localhost:3000 pnpm --filter @rss-site/web build` 多次完成编译与构建内类型检查，页面预渲染分别在真实 Supabase 查询 `/games/ali213`、`/news/chinanews` 等不同来源时超时；属于外部数据门禁波动。本分支在本次边界重构前已有一次 56/56 完整成功构建，最终重构的编译与类型安全已验证，但不把最终生产构建记为完整通过。
- 在真实 `/technology/juejin` 组合内临时延迟文章查询（延迟和开发缓存均已删除），1280px 深色主题实测只有一个顶栏、一个 main、一套来源导航和一组正文骨架；骨架位于来源导航之后，页面无横向溢出。
- 完成差异按项目标准与本文件验收条件自查，无阻断发现，无接受的后续事项，因此不创建空 roadmap。

## Risks

未来若再次在栏目根增加路由级 loading，会重新引入跨布局回退风险。组合回归锁定 `SectionLayout + PaginatedArticleFeed` 的唯一外框不变量；详情边界继续由独立测试覆盖。
