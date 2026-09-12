# AI 事件详情加载边界修复

## Background
用户从 AI 时间轴点击事件时看到时间轴列表骨架。详情已有 ArticleLoading，但 events/loading.tsx 同时包住列表与详情，导致列表 fallback 进入详情的加载边界链。

## Scope
隔离 /ai/events 列表加载与 /ai/events/[slug] 详情加载。

## Out of scope
数据、翻译、缓存、线上配置和正常页面视觉调整。

## Acceptance criteria
详情祖先加载边界不出现时间轴列表骨架；列表仍显示既有时间轴骨架；详情保留唯一 SiteShell 与正文骨架；公开 URL 不变。

## Feasibility
可行。已阅读安装版 Next 16.3.4 loading 与 route-groups 文档：loading 包住同级 page 与子路由，括号路由组不进入 URL。把列表 page/loading 移入 (timeline) 可消除详情对列表 fallback 的继承。复用 docs/development/detail-loading.md 已接受的界面、桌面与移动布局、React/Tailwind 和 ArticleLoading；无新增视觉决策或依赖。当前工具目录无 UI Skills 获取工具，按仓库现有设计系统及 UI quality 清单执行，不声称完成 UI Skills 评审。

## Implementation
列表 page/loading 移入 (timeline)，仅调整相对导入。详情路由不变。回归测试从真实 loading 模块发现详情祖先并渲染，禁止出现时间轴加载状态；保留原有列表和详情外框测试。

## Verification
修复前执行 pnpm --filter @rss-site/web test components/article-loading.test.tsx：1 failed / 8 passed，失败输出明确包含“正在加载时间轴”。修复后 Web 全量 154/154 通过；测试模块加载改为异步后定向回归 9/9 通过。修改文件 Biome 检查与 git diff --check 通过。

生产构建首次发现测试 glob 类型问题及旧 .next/dev/types/validator.ts 对已移动文件的引用，分别修复测试类型及清除这一个生成文件。沙箱预渲染随后报 EACCES；允许只读联网后完整构建通过，类型检查和 53/53 页面生成成功，公开 /ai/events 与 /ai/events/[slug] 均保留。

标准与验收双轴自审无阻断问题：仅移动列表加载边界和修正相对导入，保留详情骨架、唯一外框与 URL。无额外 accepted follow-up，不创建空路线图。本轮未执行浏览器慢网、桌面/手机明暗主题视觉检查；现有骨架标记和样式未变，不声称浏览器验收完成。

## Risks
自动化边界回归不能代替线上慢网跳转验收；发布前不声称线上问题已消失。
