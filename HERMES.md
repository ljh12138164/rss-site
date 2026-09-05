# HERMES

## Active objective

在 `feat/ai-event-timeline` 上把 `/ai` 改造成六路官方 AI 平台文章的合流时间线，只展示云端
Supabase 中的真实数据，没有数据时保持空状态。

## Current state

- 功能分支从 `origin/master` 的 `d502dfd` 创建，工作说明在
  `docs/development/ai-event-timeline.md`。
- 现有 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini 和 Qwen 数据查询与来源详情页可直接复用。
- 云端 Supabase 当前有 102 条 AI 文章，全部带发布日期；最近 7 天 20 条、最近 30 天 44 条。
- 已确认不使用示例或占位事件，不显示无法保证精度的小时和分钟，也不修改数据库、Cron 或抓取 API。
- UI Skills MCP 当前未暴露，因此不声明对应审查；使用现有设计 token、`frontend-design` 和 UI 质量清单验收。
- `/ai` 已改为最近 30 条真实事件的合流时间线，按 Asia/Shanghai 日期分组；无日期记录进入“日期未知”，
  加载、空和错误状态均不会生成示例事件。
- Web 12 个测试文件共 31 项通过，类型检查与生产构建通过；本次文件的 Biome 检查和 `git diff --check`
  通过。仓库级 lint 仍受未修改文件的既有 CRLF 格式差异影响。
- 云端数据页面返回 HTTP 200 和 30 个真实原文出口；1440px 与窄屏无界面截图已复核，未发现横向溢出。
- 标准审查与需求审查无阻断发现，也没有需要写入后续 roadmap 的改进项。

## Next action

提交并推送 `feat/ai-event-timeline`，然后由用户以该分支为 head、`master` 为 base 创建并合并 PR。

## Delivery constraint

不把 GitHub、Supabase、数据库或 Cron 密钥提交到仓库。本次工作不自动部署，也不自动修改生产数据库和 Cron。
