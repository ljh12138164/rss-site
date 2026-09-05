# 辅助热点分区 roadmap

## Context

AI 是站点的主要信息面，科技、国内新闻、社交与后续分类作为辅助信号。候选来源和匿名探测证据见
[后续热点分类与 RSSHub 来源调研](../research/additional-hot-categories.md)。每个阶段独立开发、验证和交付，
不得用空页面或假数据提前占位。

全站调度基线：AI 每 2 小时一次；其余分区每 6 小时一次；同一时刻最多启动一个来源，来源之间至少错开
5 分钟。新来源只有完整通过仓库规定的生产数据门禁后，才允许启用 Vault 支持的 Supabase Cron。

## Now

### 财经与游戏发布门禁

- Value：一次发布六路财经与六路游戏辅助信号，同时保持 AI 为首页主位。
- Evidence：本地实现、52 项 API 测试、42 项 Web 测试、lint、类型和生产构建已通过；2026-09-05 上线前
  匿名复探的十二路 Feed 均为 HTTP 200 与非空 RSS。
- Dependencies：用户创建并合并 PR、Vercel 部署、三个云端 Supabase 迁移、逐来源真实写入验证。
- Completion signal：`/finance`、`/games` 与详情页读取真实云端数据；36 路来源按 AI 2 小时、其余 6 小时
  无冲突错峰；全部来源通过生产门禁并确认 Cron active。
- Development documents：[财经热点来源](../development/finance-hot-sources.md)、
  [游戏热点来源](../development/game-hot-sources.md)。

## Next

### 体育

- Value：补充赛事与体育新闻。
- Evidence：懂球帝和直播吧数据完整，但目前只有两个稳定综合平台。
- Dependencies：找到至少两个不同平台的匿名稳定来源，或明确接受两路 MVP；且当前生产门禁与 SEO P2
  不得被打断。
- Completion signal：来源多样性和生产数据门禁均达标。

## Later

### 影视文化

- Value：提供电影、图书与动画榜单快照。
- Evidence：豆瓣、Bangumi、猫眼共五路有封面，但都缺少发布时间。
- Dependencies：先建立“采集时点”而非“发布时间”的榜单模型与文案。
- Completion signal：页面不生成虚假时间，榜单排序和更新时间语义清晰，来源通过生产门禁。

### 科学与研究

- Value：补充趋势论文、期刊、科研进展与科普信息。
- Evidence：PubMed、Cell、果壳与中科院四路匿名可用且带发布时间。
- Dependencies：区分“趋势”“当期内容”“最新发布”，避免统一宣称为热榜。
- Completion signal：各来源类型标签明确，真实数据与 6 小时 Cron 通过生产门禁。

### 生活消费

- Value：在不稀释 AI 主线的前提下提供少量生活决策信息。
- Evidence：存在匿名可用来源，但菜谱、同城活动和消费报道混杂。
- Dependencies：先收窄为“吃喝玩乐”或“消费决策”之一，并补足同类来源。
- Completion signal：定位单一、来源语义一致、生产门禁通过。

## Deferred

### 汽车

- Evidence：中国汽车工业协会一路可用，其余候选失败，尚不足以组成独立分区。
- Revisit when：至少四个不同平台可以匿名稳定抓取。
