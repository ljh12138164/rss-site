# 云端来源验收记录

## 2026-09-05：首批 18 路信号来源

目标项目：Supabase `rss-site`（新加坡区）。本记录仅保留非敏感结果；数据库连接串、Token、Vault 值和
`CRON_SECRET` 均未输出或提交。

### 已完成

- 生产 API `https://rss-api.ljhboard.cn` 已部署 18 路通用采集入口。
- 云端迁移 `20260905021025_expand_technology_sources` 已应用，并核对 18 个来源和 3 个分区的组合约束。
- 科技 6 路、国内新闻 6 路，以及 OpenAI、Anthropic、GLM、Google AI、Qwen 共 17 个来源，均通过生产
  `POST /cron/signals/:source` 写入云端 Supabase。
- 17 个来源的最新运行状态均为 `succeeded`，当前共保存 344 条热点；每个来源均为非零写入，链接为
  HTTP(S)，标题非空，排名从 1 连续起步，并保存最近成功时间。
- AI 样本域名分别为 `openai.com`、`anthropic.com`、`docs.bigmodel.cn`、`blog.google` 与
  `qwen.ai`；GLM 首条标题归一化为 `GLM-5.3-Flash`。
- 已启用 17 个错峰五小时来源任务和 1 个每日保留清理任务。全部来源任务通过 Supabase Vault 读取生产
  API 地址和 Cron 密钥。

### 待完成

- DeepSeek 的 RSSHub 修复已合入并推送 `rss` 仓库 `main` 提交 `7da9e2f`，但生产
  `https://rss.ljhboard.cn` 仍报告旧 Git Hash `7a622331`，且 `/deepseek/news` 仍返回指南内容。
- 因数据语义未通过验收，DeepSeek 尚未写入云端，也没有创建 Cron。生产 RSSHub 重新部署后，必须确认
  feed 只包含 `/zh-cn/news/news...`，再执行云端写入并启用该任务。

### Supabase Advisors

- 安全：无高危项。`ingestion_runs` 的“RLS 开启但没有公开策略”提示符合内部运行记录不向匿名端开放的
  设计。
- 性能：提示 `hot_items.batch_id` 与 `source_status.last_batch_id` 两个既有外键缺少覆盖索引；与本次来源
  扩展无直接关系，后续在数据规模增长前补迁移评估。
