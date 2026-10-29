# 导航与全局滚动条样式优化开发记录

## Background

在 Windows 系统的 Chromium / Edge 浏览器上，由于横向可滚动导航未配置隐藏滚动条属性，导致顶部一级主导航与二级来源切换栏下方出现明显的粗灰块原生滚动条，严重破坏了暗色与暖色主题的视觉精致度。

## Scope

1. 在 `apps/web/app/globals.css` 中增加 `@utility no-scrollbar`，支持标准 `scrollbar-width: none`、`-ms-overflow-style: none` 以及 WebKit 伪元素隐藏。
2. 在 `apps/web/app/globals.css` 中优化全局默认滚动条样式（WebKit 细条化 6px、自适应 `var(--border)` 和 `var(--muted-foreground)`，Firefox `scrollbar-width: thin`）。
3. 在 `apps/web/components/site-header.tsx`（一级主导航）中添加 `no-scrollbar` 与 `scroll-fade-mask`。
4. 在 `apps/web/components/source-navigation.tsx`（二级来源标签导航）中添加 `no-scrollbar`。
5. 针对横向导航的滚动体验进行测试与验证。

## Out of scope

1. 不修改导航链接逻辑、数据源与路由。
2. 不引入第三方滚动条重型 JS 依赖。

## Acceptance criteria

1. **横向导航无原生粗滚动条**：顶部一级主导航与二级来源分类条在 Windows / macOS / iOS / Android 上均隐藏原生灰色滚动条槽，保留平滑横向拖拽/滑动手势。
2. **全局纵向滚动条优雅**：全站通用滚动条宽度细化为 6px，滑块颜色融合当前主题（浅色为柔和浅灰，深色为低对比度暗褐），悬浮时高亮。
3. **测试与规范通过**：全仓单元测试无破坏，TypeScript 类型与 Biome 检查 0 错误 0 警告。

## Feasibility

- 完全可行，属于纯样式与现代 CSS 规范实现，零依赖开销。

## Implementation

1. `apps/web/app/globals.css`:
   - 添加 `@utility slim-scrollbar`：4px 极细圆角胶囊滑块（`border-radius: 9999px`），背景透明（零灰槽占位），彻底剔除 Windows 三角箭头按钮；
   - 悬浮/拖拽时高亮为主题暖橙色（`var(--primary)`）；
   - 保留全站纵向 6px 微型自适应滚动条。
2. `apps/web/components/site-header.tsx`:
   - 主导航应用 `slim-scrollbar pb-1`，紧凑贴合在各分区按钮下方。
3. `apps/web/components/source-navigation.tsx`:
   - 二级分类标签应用 `slim-scrollbar pb-1`，明确提示可拖拽滑动的进度与范围。

## Verification

- `pnpm --filter @rss-site/web test`: 91 个测试文件 340 项测试全数通过。
- `pnpm --filter @rss-site/web check-types`: TypeScript 0 错误通过。
- `npx @biomejs/biome check`: 4 个变更代码文件 0 错误 0 警告通过。
- `git diff --check`: 无多余空白与格式问题。

## Risks

- 无已知风险。
