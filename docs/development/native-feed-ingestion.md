# 候选来源原生 Feed 采集

## 范围

接入[候选文档第三节](../research/rsshub-route-candidates-and-workflow.md#三暂不提上游-rsshub-pr-的排除项说明)中已提供可读正文的官方 RSS／Atom，包括该节另外列出的游研社原生 RSS。共 28 个来源，归入现有 AI、科技和游戏分区。

## 验收标准

- 定时和手动抓取直接请求官方地址。每个来源可生成带时间和正文的非空批次。
- 部署清单与来源注册表一致，新任务错峰运行。现有 PostgreSQL 门禁在发布后逐项试抓和启用。
- 来源页与分区入口沿用现有页面模板。Vercel Atom 的 XHTML 正文、链接和作者可正常解析。

## 可行性

复用既有原生来源的 `feedUrl`、RSS／Atom 解析器、文章写入和部署机制。Ars Technica 的科技与 AI 两条官方 Feed 用同一个来源归档，沿用现有多 Feed 合并和去重。旧迁移由同一套完整的新约束接管，保持发布和恢复重放可用。

## 实现

- AI 9 个，科技 13 个，游戏 6 个；每次最多保留 20 条。AI 和科技每 12 小时抓取一次，游戏每 6 小时一次。
- 业务任务总计 84 项，其中抓取 80 项，维护 4 项。所有新增任务由既有部署逻辑先登记为待验证，通过生产试抓和数据库验证后启用。
- Atom 的 XHTML 容器保留内部元素给现有正文清洗流程，多个作者按 Feed 顺序保留。

## 验证

当前分支基于 `origin/master` 的 `df22f26`。2026-11-18 使用生产抓取器匿名请求 29 条官方地址，全部返回成功响应。经 `ingestSignal` 走到本地替代存储，28 个批次共 507 条，各批次内 URL 和来源键唯一，所有条目均有发布时间和正文。PC Gamer 裸域复测出现连接重置，改用 `www.pcgamer.com/rss/` 后解析 20 条。

| 分区 | 来源及本地采集条数 |
| --- | --- |
| AI | METR 20、BAIR 10、Ahead of AI 20、AWS ML 20、Redwood Research 20、Interconnects 20、Import AI 20、Latent Space 20、Dwarkesh Patel 20 |
| 科技 | Where’s Your Ed At 15、ChinaTalk 20、Trail of Bits 20、Big Technology 20、The Pragmatic Engineer 15、Newcomer 20、Vercel 20、VoidZero 20、Chips and Cheese 20、Linear Now 20、Ars Technica 20、404 Media 15、Bun 20 |
| 游戏 | IGN 20、PC Gamer 20、PlayStation.Blog 繁體中文 10、Xbox Wire 10、GameLook 20、游研社 12 |

- 对齐了 80 条抓取任务的名称、计划和路径。新计划和既有抓取任务没有分钟级碰撞。
- `pnpm test` 324 项通过，22 项数据库或 Redis 集成测试本地跳过。全仓类型检查、变更文件 Biome、发布打包 8 项测试、Bash 语法、Cron SQL 渲染和 diff 检查通过。
- 对照范围与仓库标准复核，修正了 PC Gamer 的官方地址，补上包含新来源数据的迁移重放校验。无需要另立路线图的开发项。
- 生产发布后，以 CI 的自动启用日志核对新增任务，再检查分区、来源页及详情。

## 风险

GameLook 的官方 Feed 使用 HTTP。部分订阅型出版商在 Feed 中只提供公开内容。METR Feed 接近抓取器的 5 MB 上限，单篇正文按现有 512 KiB 限制处理。
