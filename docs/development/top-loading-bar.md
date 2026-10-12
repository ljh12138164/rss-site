# 顶部导航加载条

## Background

用户要求在头部增加 Next.js 加载条，提供站内页面切换反馈。

## Scope

根布局接入 `nextjs-toploader`，所有页面共享一个贴顶加载条。

## Out of scope

不改数据请求、现有骨架屏、路由、后端或部署配置。

## Acceptance criteria

- 站内链接切换时显示 2px 加载条，导航完成后自动隐藏。
- 使用 `--primary`，适配浅色和深色主题，不占据布局空间。
- 不显示旋转图标或发光阴影；尊重减少动态效果设置。
- Web 类型、现有测试、变更文件格式和生产构建通过。

## Feasibility

可行。项目使用 Next.js 16.3.4 App Router、React 19.2.8；包版本 3.9.17 的 peer dependencies 兼容该组合。按上游 README 在根布局 body 中安装。现有站内导航使用 Link，不需要替换程序式 router。加载条表示导航等待，不展示虚构百分比；详情内容流式加载仍使用原有骨架屏。

## Implementation

- 从最新 `origin/master`（955b21d）创建 `feat/top-loading-bar`。
- 用户请求已明确顶部加载条和采用现成包；复用 `docs/development/ui-ux-pro-max-polish.md` 的站点视觉体系和主题变量。
- UI Skills MCP 已加载 `dammyjay93/interface-design` 和 `ibelick/baseline-ui`。读者在分区与文章之间导航时获得轻量反馈；内容仍为视觉焦点。仅增加 2px 固定顶部细条，使用现有主色，无文字、额外表面或间距；桌面和手机共享同一表现。
- 根布局导入 NextTopLoader，关闭 spinner 与 shadow，层级 50，高于站点 sticky header；全局 CSS 对减少动态效果设置禁用进度条 transition。
- 固定依赖版本并更新 pnpm lockfile。

## Verification

- `pnpm --filter @rss-site/web check-types`：通过。
- `pnpm --filter @rss-site/web test`：75 个文件、282 项测试全部通过。
- `pnpm exec biome check apps/web/app/layout.tsx apps/web/app/globals.css apps/web/package.json` 和 `git diff --check`：通过。
- `pnpm --filter @rss-site/web build`：生产构建成功，62/62 页面生成，Early Hints 与 Service Worker 生成成功。
- 本地生产预览浏览器：从首页点击「科技」，MutationObserver 捕获加载条创建，确认 2px、fixed、top 0、z-index 50、浅色主色 rgb(15,118,110)，无 spinner；到达 `/technology` 后进度条被移除。
- 390px 手机视口、深色主题、减少动态效果：点击「新闻」，进度条为深色主色 rgb(45,212,191)，transition-duration 0s，无横向溢出；导航完成后进度条被移除。测试后恢复主题、视口与媒体模拟并关闭预览标签。
- 独立静态评审无阻塞项；无接受的后续事项，不创建空 roadmap。

## Delivery

分支 `feat/top-loading-bar`，目标 `master`。按仓库规定，由用户创建和合并 PR；本轮不部署生产。

## Risks

第三方加载条跟随路由切换完成状态，不能代表文章中后续独立请求的精确进度。刷新页面与初次文档下载使用浏览器原生加载反馈。
