# 修复栏目全屏骨架

## Background

六个栏目在命中栏目根级 `loading.tsx` 时直接渲染裸列表骨架，站点顶栏、内容宽度和页脚均消失，视觉上成为从视口左上角铺开的全屏骨架。用户确认问题不是加载卡死，而是骨架越过页面主体边界。

## Scope

- 修复 AI、科技、新闻、社交、财经、游戏六个栏目根级加载边界。
- 排查其他路由级 loading，确认是否存在同类裸骨架。
- 增加能够捕获顶栏消失和骨架越界的回归测试。

## Out of scope

- 不改变数据请求、缓存、ISR、正常页面内容或现有骨架配色与动效。
- 不新增页面、弹窗、依赖或视觉系统。
- 不部署生产环境。

## Acceptance criteria

- 六个栏目命中根级 loading 时仍有且只有一个站点顶栏、一个 `main` 和一个页脚。
- 列表骨架位于受约束的页面主体内，不再从视口边缘铺满。
- 文章详情继续使用既有 46rem 阅读骨架；首页、GitHub 榜单和 AI 时间轴 loading 不回退。
- 全仓 loading 审计无未处理的同类裸页面边界。

## Feasibility

可行。截图形态与 `SectionLoading` 完全一致，而六个栏目根级 loading 均直接导出该裸组件。用现有 `SiteShell` 统一包裹即可恢复页面边界，无运行时、数据或依赖变化。

技术难点是 Next App Router 可能因导航、预取或流式渲染命中较上层的 loading；因此修复必须作用于边界本身，不能只依赖更深层 loading。回归测试直接渲染每个路由边界，验证外框不变量。

## Implementation

沿用 `detail-loading.md`、`home-list-navigation.md` 已接受的设计：全局顶栏保持稳定，冷蓝灰骨架仅表示主体内容加载。UI Skills registry 当前未暴露，按仓库现有视觉系统与 UI quality 清单回退。

- `SectionRouteLoading` 用现有 `SiteShell` 包裹可复用的裸 `SectionLoading`。
- 六个栏目根级 loading 统一改用 `SectionRouteLoading`；嵌入已有栏目布局的调用点继续使用裸 `SectionLoading`，避免双外框。
- 首页、GitHub 榜单、AI 时间轴和七个详情 loading 均已审计，原本已有自己的 `SiteShell`，无需修改。

## Verification

- 红灯：`pnpm --dir apps/web exec vitest run components/article-loading.test.tsx` 在修复前新增的六个栏目用例 6/6 失败，均缺少顶栏；原有详情用例继续通过。
- 绿灯：同一精准命令 14/14 通过。
- Web 全量测试：40 个文件、141 项全部通过。
- `pnpm --filter @rss-site/web check-types` 通过。
- 修改范围 Biome 与 `git diff --check` 通过。
- `SITE_URL=http://localhost:3000 pnpm --filter @rss-site/web build` 成功生成 56/56 页面。后续清理本地预览缓存时的两次重复构建分别在 `/technology/github-blog` 和 `/games/gcores` 遇到 Supabase 10 秒超时；均发生在编译和类型检查完成后，首次完整成功结果有效。
- 本地专用预览（完成后已删除）在 1440×900 和 390×844 检查：均只有一个顶栏和一个 `main`；桌面骨架左右边界 172–1268px，手机为 20–355px；无横向溢出，页脚保留。
- 完成差异按项目标准与本文件验收条件自查，无阻断发现，无接受的后续事项，因此不创建空 roadmap。

## Risks

共享外框若在已有父级外框内再次渲染会产生双顶栏；六栏目路由回归明确断言唯一顶栏，裸组件仍保留给 GitHub 页面等已有外框的调用点。
