# HERMES

## Active objective

在 `feat/technology-hot-sources` 上实现六来源科技信号台，并把交互组件渐进迁移到 React Aria。

## Current state

- PR #4 已合并，当前分支从 `origin/master` 的合并提交 `499dbdf` 创建，工作树初始干净。
- 首页摘要、`/technology` 总览、六个 `/technology/[source]` 详情页和 `/out` 中转页均已实现。
- 首批来源为 GitHub、Hacker News、掘金、V2EX、IT之家和 36氪；自建 RSSHub 均已验证可读取，
  GitHub Trending 在新部署并配置服务端令牌后返回 200。
- React Aria 已替换 Button、Tooltip 等交互组件；静态结构保持语义 HTML，旧 Radix、CVA 和 shadcn
  配置已移除。
- 设计、可行性、验收标准和风险记录在 `docs/development/technology-hot-sources.md`。
- 通用六来源采集、数据库约束迁移、错峰五小时 Cron、30 天运行历史清理和 RLS 测试已实现；本分支
  尚未修改生产状态。
- UI Skills MCP 注册表当前未暴露；设计使用已确认的 `frontend-design` 和仓库现有 token。
- API 27 项、Web 16 项测试、类型检查和生产构建已通过；未知来源经生产服务器验证返回真实 404。
- 本机 Docker Desktop 未运行，`supabase test db` 待 CI 或有 Docker 的环境执行。

## Next action

用户已明确跳过创建 GitHub PR；远端功能分支可供后续人工审阅或合并。合并后再由部署流程应用迁移、
部署 API/Web 并配置六来源 Cron。

## Delivery constraint

不把 GitHub、Supabase、数据库或 Cron 密钥提交到仓库。本 PR 不自动部署，也不自动修改生产数据库和 Cron。
