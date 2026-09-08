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

## 2026-09-05：财经、游戏与持久化 P1 扩展

目标仍为同一云端项目。本轮只记录非敏感结果，未输出连接串、Token、Vault 值或 `CRON_SECRET`。

### 已完成

- 生产 API 健康检查返回 HTTP 200；未携带密钥调用财经与游戏 Cron 路由均返回 401，证明路由已部署且鉴权生效。
- 云端已应用 `add_finance_sources`、`add_game_sources`、`persist_signal_articles_and_ai_events` 与
  `restrict_public_table_privileges` 四条版本化迁移。
- 历史回填结果为 `hot_items` 496 条、`signal_articles` 496 条；空 `article_id` 与来源、来源键、分区错配均为 0。
  `ai_events` 与 `ai_event_articles` 保持 0 条，没有为了页面效果生成假事件。
- 六张业务表均启用 RLS；`hot_items`、`source_status`、`signal_articles`、`ai_events` 和
  `ai_event_articles` 对 `anon`/`authenticated` 只有 SELECT，所有公开非 SELECT grant 数量为 0。

### 完整门禁未通过

- 第一次 `pnpm setup:cron`：前 8 路生产写入成功，掘金上游返回一次 503 后流程停止。
- 第二次 `pnpm setup:cron`：前 26 路生产写入成功，金十数据首条 RSS item 的 `<link/>` 为空，API 按旧规则
  返回 502 后流程停止。公开 Feed 中另有真实可访问文章，故选择跳过单个无 Web URL 的坏条目，而非伪造链接。
- 两次失败都发生在调度阶段之前；云端仍为 24 路既有五小时采集任务和 1 个每日清理任务，财经、游戏及
  2H/6H 新调度均未启用，Vault 未被本轮替换。
- 当前分支增加 502/503/504 与网络异常的两次有限退避，以及坏条目过滤。修复合并并部署 API 后必须从
  第一路重新运行全部 36 路，取得每路 HTTP 状态、批次 ID、条数与字段质量证据后才可更新 Cron。

### Supabase Advisors

- 安全：仅有内部表 `ingestion_runs` 开启 RLS 但没有公开策略的 INFO，符合不向公开角色暴露运行记录的设计。
  参考 [Supabase RLS advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)。
- 性能：保留两个既有外键缺少覆盖索引的 INFO；四个新索引的 unused 提示来自刚迁移且查询样本不足，不删除。
  参考 [未索引外键](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) 与
  [未使用索引](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)。

## 2026-09-08：正文 API 发布后的完整门禁复跑

- 用户确认正文版本 API 已发布；生产 `/health` 返回 HTTP 200。
- `pnpm setup:cron` 从第一路重新执行，26 个来源成功写入并通过批次、状态、条目和持久化文章核验；掘金一次失败后由既有有限重试恢复。
- 金十公开 Feed 返回 HTTP 200 和 4 个真实条目，但 4 个 `<link>` 全为空。API 三次均按规则返回失败，没有合成第三方 URL。
- 流程在调度前停止：云端仍为 25 个旧活跃任务，新 `signal-ingest-*` 任务为 0，Vault 和 Cron 未由本轮更新。
- 复跑停止后云端共有 2,914 篇文章，805 篇保存了 Feed 提供的正文 HTML，确认已发布 API 的正文写入生效。
- 当时的后续条件为恢复真实链接后从第一路重跑；后续修复与复跑见下节。

## 2026-09-08：金十链接与证券时报日期修复

- 金十改用匿名验证通过的 `/jin10/topic/343`（全球财经早餐）。生产 API 部署后手动采集 HTTP 200，批次 `7cb11a8b-383f-439d-ad7e-911a80beb301` 写入 10 条，云端确认 10 个真实 `xnews.jin10.com/details/` 链接、10 篇持久化正文。
- 后续完整门禁在证券时报停止：批次 `7c687df0-c438-489b-bf36-a429515eaed3` 的 10 条文章均缺少发布时间。改为 `/stcn/article/list/yw` 后，批次 `908a3f57-ed7f-4bb1-8248-c3e6eae4a64d` 仍缺少日期，因此没有更新 Cron。
- 真实文章页显示日期位于 `div.detail-info` 的直接子级；旧选择器最后读到嵌套的“字号”控件。RSSHub 列表、热榜和快讯统一修正选择器，完整日期格式优先，并更新条目缓存键以避开旧无效结果。
- RSSHub 工作区为 `C:/Users/PC/Desktop/front/TEST/RSSHub`，修复分支 `codex/fix-stcn-publication-date`，基线 `c697d79f71c405f9512e919355f318dea4bd4771` 与发布前生产提交一致。
- RSSHub 生产部署 `dpl_86ZgnE7927s4NMkuGiffsF2gb23z` 已 Ready 并关联 `rss.ljhboard.cn`。生产列表 Feed HTTP 200，10 条文章、10 个有效 pubDate，无 `Invalid Date`；首条北京时间 `2026-09-08 08:11` 对应 UTC `2026-09-08T00:11:00Z`。
- RSSHub 两项回归测试、全仓类型检查、修改文件的 oxlint/oxfmt 与路由构建通过；本地列表、热榜各 3 条真实文章日期有效。rss-site API 61 项、Web 108 项测试及两包类型检查通过。
- 修复发布后的完整 36 路门禁全部通过，本轮 0 个失败批次，共写入 710 条热点，时间范围为 UTC 04:39:24–04:49:44。
- 安装器成功退出后再次只读核验：37 个任务全部 active，其中 36 个 `signal-ingest-*` 来源任务均引用 `vault.decrypted_secrets`，另 1 个保留清理任务；旧任务已替换。
- 金十批次 `b9eefac8-178b-44d1-af12-0a44b523fbc9` 与证券时报批次 `71277514-cfe8-473b-b3a6-0a592618fa5d` 均为 10 条有效标题/链接、10 个发布时间、10 篇持久化正文、排名 1–10；证券时报日期范围为 UTC 2026-09-07 23:13 至 2026-09-08 00:11。
- 最终云端文章总数 3,380，其中 1,281 篇含 Feed 正文 HTML。Web 包级生产构建生成 55/55 页面；前端未部署。

### 完整复跑批次（UTC）

全部来源通过安装器的 HTTP 成功响应、非零条数、批次一致性、来源状态、排名与持久化文章关联核验。

| 来源 | 条数 | 批次 ID | 开始时间 |
|---|---:|---|---|
| openai | 20 | 8e9762ae-3ff7-4702-a261-33b9f3d8bb3c | 2026-09-08 04:39:24.2+00 |
| anthropic | 10 | 385c27c2-a475-4803-b9fd-13f63c661b4c | 2026-09-08 04:39:46.746+00 |
| deepseek | 17 | 82fcb42c-eb3d-45fb-8783-739224dea8a8 | 2026-09-08 04:39:59.916+00 |
| glm | 15 | bcdf2a2f-17ef-4faa-8d60-f37cad1089a7 | 2026-09-08 04:40:19.526+00 |
| google-ai | 20 | 67749f70-412a-4231-9e51-919d40e1fdd1 | 2026-09-08 04:40:31.414+00 |
| qwen | 20 | a29a6d52-9e90-45d1-8dc3-2ce2d6f88586 | 2026-09-08 04:40:45.053+00 |
| github | 19 | c984e06f-6fb0-4452-a605-d90b5ac365d7 | 2026-09-08 04:41:05.324+00 |
| hacker-news | 30 | c97ab686-625f-4105-a0a8-e58599782c49 | 2026-09-08 04:41:21.929+00 |
| juejin | 20 | f5b62511-9210-4c96-9b59-2c320e0311d4 | 2026-09-08 04:41:40.218+00 |
| v2ex | 10 | 9a0217a3-b208-40e0-b3aa-250ebd1210cc | 2026-09-08 04:42:03.477+00 |
| ithome | 12 | b9ec7cb6-3ab2-48a6-85ad-c539e57ba9db | 2026-09-08 04:42:12.002+00 |
| 36kr | 8 | 2d87e5ed-1a25-48c6-90d3-6e973e441776 | 2026-09-08 04:42:24.393+00 |
| xinhua | 30 | df35f654-c1c2-4b05-909d-0b0a7fa29cda | 2026-09-08 04:42:39.595+00 |
| cctv | 30 | 74669430-a585-4d01-9b06-230152249689 | 2026-09-08 04:43:04.769+00 |
| chinanews | 30 | f39b4ee9-0856-45d9-8d50-5fda12ba5871 | 2026-09-08 04:43:37.831+00 |
| thepaper | 20 | f0f715de-ff89-4842-877b-f5a5daf46679 | 2026-09-08 04:44:01.413+00 |
| jiemian | 20 | 6ec54038-7234-4677-9ffe-6eec1cb1c78a | 2026-09-08 04:44:19.931+00 |
| baidu | 30 | ba68800a-6322-4ca3-b640-56778fe10cff | 2026-09-08 04:44:39.277+00 |
| bilibili | 20 | 55e43b5d-8498-4d89-9736-23809b310628 | 2026-09-08 04:44:59.18+00 |
| zhihu | 30 | 3ec03a55-ee83-49ab-8069-32f097165198 | 2026-09-08 04:45:13.335+00 |
| coolapk | 20 | b480f7a7-eab8-4bfc-872a-e76e1d329125 | 2026-09-08 04:45:33.213+00 |
| hupu | 30 | ef7a9fec-e4b1-428c-bdf0-7f916da763c4 | 2026-09-08 04:45:49.23+00 |
| sspai | 20 | 55f924fd-aeab-4e19-8c68-79bd50146da4 | 2026-09-08 04:46:16.399+00 |
| toutiao | 14 | 4e16a888-f3c7-4b84-a53f-31b0bde25074 | 2026-09-08 04:46:36.712+00 |
| wallstreetcn | 10 | 09d77eea-b094-431f-a390-8d699e2d64ed | 2026-09-08 04:46:53.199+00 |
| cls | 13 | 5aab7981-15a5-4aa1-8c62-227e85163669 | 2026-09-08 04:47:04.419+00 |
| jin10 | 10 | b9eefac8-178b-44d1-af12-0a44b523fbc9 | 2026-09-08 04:47:18.055+00 |
| yicai | 30 | 10de328b-179f-416a-adbe-086b869c8561 | 2026-09-08 04:47:30.062+00 |
| stcn | 10 | 71277514-cfe8-473b-b3a6-0a592618fa5d | 2026-09-08 04:47:51.947+00 |
| 10jqka | 20 | de2cdef8-da0d-4ab2-b6e6-3ebf4b1bbd98 | 2026-09-08 04:48:05.223+00 |
| 3dmgame | 20 | 7da5fafa-4fc5-4ba9-ab1a-5b7f0369624f | 2026-09-08 04:48:20.145+00 |
| gcores | 20 | b232b6b9-28cf-4a01-b203-b32668999dd3 | 2026-09-08 04:48:39.933+00 |
| gamersky | 20 | c8131ed5-2ca9-41e8-bf94-53189e971f8e | 2026-09-08 04:48:56.234+00 |
| ali213 | 20 | 560b0a58-63be-4d83-855f-9fe761d9f2ab | 2026-09-08 04:49:13.723+00 |
| indienova | 12 | e5f4a76b-de15-41af-a8b7-84c715df990b | 2026-09-08 04:49:31.98+00 |
| steam | 30 | 99a57481-0700-46b2-8672-0c63e74fbaa0 | 2026-09-08 04:49:44.653+00 |
