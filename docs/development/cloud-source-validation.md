# 云端来源验收记录

## 2026-09-05：首批 18 路信号来源

目标项目：Supabase `rss-site`（新加坡区）。本记录仅保留非敏感结果；数据库连接串、Token、Vault 值和
`CRON_SECRET` 均未输出或提交。

### 已完成

- 生产 API `https://rss-api.ljhboard.cn` 已部署 18 路通用采集入口。
- 生产 RSSHub 已迁移到真实 Fork `ljh12138164/RSSHub`，线上 Git Hash `4a9bfa07` 对应合并提交，
  `/deepseek/news` 返回 HTTP 200 和 17 条官方新闻。
- 云端迁移 `20260905021025_expand_technology_sources` 已应用，并核对 18 个来源和 3 个分区的组合约束。
- 科技 6 路、国内新闻 6 路，以及 OpenAI、Anthropic、DeepSeek、GLM、Google AI、Qwen 共 18 个来源，均通过生产
  `POST /cron/signals/:source` 写入云端 Supabase。
- 18 个来源的最新运行状态均为 `succeeded`，本轮共保存 361 条热点；每个来源均为非零写入，链接为
  HTTP(S)，标题非空，排名从 1 连续起步，并保存最近成功时间。
- DeepSeek 写入 17 条，URL 均为 `api-docs.deepseek.com/zh-cn/news/news...`，标题和发布时间合理；前三条分别为
  V4-Flash-Vision-Exp、V4-Pro 与 V4 预览版公告。
- AI 样本域名分别为 `openai.com`、`anthropic.com`、`api-docs.deepseek.com`、`docs.bigmodel.cn`、
  `blog.google` 与 `qwen.ai`；GLM 首条标题归一化为 `GLM-5.3-Flash`。
- 已启用 18 个错峰五小时来源任务和 1 个每日保留清理任务。全部来源任务通过 Supabase Vault 读取生产
  API 地址和 Cron 密钥。

### 回归观察

- 首轮全源验证在 36Kr 遇到一次 HTTP 502；直接路由探测随后返回 200，单源重试写入 8 条，第二轮完整
  18 源验证成功，因此判定为上游瞬时故障。
- GLM 官方 RSS 使用同一页面的不同日期 fragment 作为条目链接。当前 URL 归一化会移除 fragment，因此
  15 条数据依靠不同 GUID 保持唯一，但点击均落到发布记录页顶部；不影响本轮采集成功，后续可改善定位体验。

### Supabase Advisors

- 安全：无高危项。`ingestion_runs` 的“RLS 开启但没有公开策略”提示符合内部运行记录不向匿名端开放的
  设计。
- 性能：提示 `hot_items.batch_id` 与 `source_status.last_batch_id` 两个既有外键缺少覆盖索引；与本次来源
  扩展无直接关系，后续在数据规模增长前补迁移评估。

## 2026-09-05：六路社交热点与媒体预览

- PR #6 已合并，生产 API 健康检查返回 200，新 `/cron/social/:source` 路由保持鉴权并对无密钥请求返回 401。
- 云端迁移 `20260905070524_add_social_sources_and_previews` 已应用；远端迁移历史一致，`public` schema lint
  无错误。
- B 站、知乎、酷安、虎扑、少数派、今日头条均通过生产 `POST /cron/signals/:source` 和随后云端数据库复核。
  最终批次分别为 `5b2e6c26-4c1f-44cc-b8ee-da7a2ca6e19b`、
  `46f1b4d8-bcde-49d8-9893-5ed2befc023d`、`2749df3c-0739-4a2d-b67b-060bb2ba4351`、
  `bf0efea1-a3f3-434b-90fa-272b51aa7ead`、`7ebf8252-81d4-4ca2-b712-413ac5a52329`、
  `8f721405-3a36-4064-ade7-813e183d39e0`。
- 六路共保存 134 条，来源状态、批次、数量和分区一致；标题、URL、连续排名与发布时间通过质量检查。
  图片数为 B 站 20、酷安 17、少数派 20、头条 15；知乎与虎扑不制造占位数据。
- 全部 24 路再次通过 `pnpm setup:cron` 的 API 与数据库门禁，共写入 495 条后才进入调度。云端确认 24 个
  来源任务全部 active 且使用 Vault 中的通用 API 地址和 Cron 密钥；每日历史清理任务也 active。
- Web publishable key 可匿名读取 B 站 `image_url`；首条视频和封面域名合理，封面请求返回 200。
