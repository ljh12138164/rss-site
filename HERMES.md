# HERMES

## Active objective

在 `feat/technology-hot-sources` 上把六个科技来源与六个中国国内新闻来源作为同一批十二路信号交付。

## Current state

- PR #4 已合并；当前分支从 `origin/master` 的合并提交 `499dbdf` 创建，科技与国内新闻实现已在提交
  `c4e2886` 推送到 `origin/feat/technology-hot-sources`。
- 首页现在按“科技 / 国内新闻”展示十二路摘要；`/technology`、`/news` 与各自六个来源详情页已经实现。
- 新闻首批来源为新华社、央视国内、中国新闻网、澎湃热榜、界面中国和百度热搜；公开 RSSHub 路由无需
  Cookie 或 Token，每次采集最多保留前 30 条。
- API 来源模型已泛化为 `SignalSource`，支持通用 `/cron/signals/:source`、分区入口和旧掘金兼容入口；
  十二个 Supabase Cron 使用通用秘密名并在不同小时、分钟错峰。
- 数据库迁移使用来源/分区组合约束，pgTAP 计划为 21 项；公开热点与状态仍只读，内部运行记录不公开。
- React Aria 继续只承载交互组件，新闻页面复用已经确认的平面信号台视觉、语义 HTML 与响应式断点。
- API 33 项、Web 22 项测试，格式、lint、类型检查与生产构建已通过；生产服务状态码和浏览器桌面/移动、
  明暗主题、键盘焦点、404、无横向溢出及无控制台告警已经复核。
- 本机 Docker Desktop 未运行，`supabase test db` 仍需 CI 或有 Docker 的环境执行；没有修改生产数据库、
  Cron、部署或秘密。
- 国内新闻方案、证据、验收与审查记录在 `docs/development/domestic-news-sources.md`；来源调研记录在
  `docs/research/domestic-news-rsshub-sources.md`。
- UI Skills MCP 注册表未在当前环境暴露，因此不声明 UI Skills 审查；采用 `frontend-design`、现有 token
  与 UI 质量清单作为替代验收基线。

## Next action

当前实现已完成并推送。此前用户要求跳过创建 PR，因此本轮未新建 PR；下一步可由用户决定是否创建 PR，
并在有 Docker 的环境执行 pgTAP、应用迁移和配置 Cron 后再部署。

## Delivery constraint

不把 GitHub、Supabase、数据库或 Cron 密钥提交到仓库。本次工作不自动部署，也不自动修改生产数据库和 Cron。
