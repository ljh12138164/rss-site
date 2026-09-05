# 信号文章与 AI 事件持久化

## Background

当前 `hot_items` 只保留每个来源的最新批次，无法支撑稳定详情 URL、历史 AI 时间线或 sitemap。该阶段实现
[SEO、缓存与索引发布 roadmap](../roadmaps/seo-cache-and-indexing.md) 的 P1，仅建立真实数据的持久化与保留
边界，不自动生成 AI 事件内容。

## Scope

- 新增 `signal_articles`，在每次成功抓取事务内幂等保存文章元数据。
- 新增 `ai_events` 与 `ai_event_articles`，为后续人工或受控聚合的 AI 时间线事件提供关系模型。
- 普通文章保留 90 天，AI 文章保留 180 天；当前热点、置顶文章和事件引用不得被清理。
- 扩展每日低峰清理任务、Drizzle schema、存储测试、迁移和 RLS/GRANT 验证。

## Out of scope

- 自动判断哪些文章属于同一事件、调用大模型生成摘要或自动发布 AI 事件。
- `/ai/events/[slug]` 详情页面、ISR、React Query、Cloudflare、sitemap 与 IndexNow；这些按 roadmap 后续阶段实现。
- 保存第三方全文、图片二进制或不可验证的生成字段。

## Acceptance criteria

- 同一 `source + source_key` 重复抓取只更新一条文章，保留首次与最近发现时间。
- `hot_items` 新批次替换后，文章元数据仍存在；清理只删除超过对应保留期且未被保护的文章。
- AI 事件 slug 唯一且稳定，事件可以关联多篇文章；删除被引用文章受到数据库约束保护。
- `anon`/`authenticated` 只能读取已发布 AI 事件及其关联，不能读取内部草稿或修改任何持久化表。
- 新表显式配置 grants 与 RLS，不依赖 Supabase 新表的默认 Data API 暴露行为。

## Feasibility

结论：可行。

- 当前抓取事务已经拥有规范化后的标题、URL、来源键、摘要、作者、图片和发布时间，可在替换排行榜前完成
  文章 upsert，不需要二次抓取。
- 数据库容量通过有限元数据、分区保留周期和批量清理控制；不存全文与图片可避免主要空间增长来源。
- 事件自动聚合缺少可靠判定与审核机制，因此本阶段只提供模型，避免把多个相似标题错误合并成事实事件。
- Supabase 2026 年的新项目可能不再自动向 Data API 授权新表；迁移将使用显式 grants、RLS 和发布状态策略。

## Implementation

- 新增 `signal_articles`，以 `(source, source_key)` 幂等 upsert；抓取事务先保存文章，再通过 `article_id`
  关联当前 `hot_items`，更新时保留 `first_seen_at` 并刷新元数据与 `last_seen_at`。
- 新增 `ai_events` 与 `ai_event_articles`；slug、状态、发布时间、关联位置和外键由数据库约束，暂不自动创建
  或发布任何事件。
- 新表显式启用 RLS 和 grants。公开角色只看到 `published` 事件、其关联和关联文章，草稿及未关联文章不可见。
- 每日清理每次最多删除 1000 条过期文章；普通文章 90 天、AI 文章 180 天，当前热点、置顶与事件引用受保护。
- `setup:cron` 的云端核验同时检查每个当前热点存在字段合理的持久化文章，缺失时不会替换任何 Cron。

## Verification

- Drizzle schema、事务写入和清理 SQL 通过类型检查与生产构建；Cron 单测验证 90/180 天窗口、1000 条批次
  和先验证后调度顺序。
- 持久化迁移已于 2026-09-05 应用到云端并完成历史回填：`hot_items` 与 `signal_articles` 均为 496 条，
  `hot_items.article_id` 空值为 0，来源、来源键或分区错配为 0；`ai_events` 与 `ai_event_articles` 均为 0，
  符合“不用假数据填充时间线”的要求。
- 云端检查发现数据库默认权限使 `anon`/`authenticated` 仍继承了写权限，因此追加
  `restrict_public_table_privileges` 版本化迁移：撤销 P1 三张表的全部公开权限后仅授予 SELECT。六张业务表
  均启用 RLS，所有公开非 SELECT grant 数量为 0。
- pgTAP 计划扩展为 53 项，新增三张 P1 表无公开写权限及恰好六个公开 SELECT grant 的回归断言。
- Supabase Security Advisor 只保留 `ingestion_runs` 开启 RLS 但无公开策略的 INFO，符合内部运行记录设计；
  Performance Advisor 的两个既有外键缺少索引提示另行评估，新表 unused-index 提示因刚上线尚无查询样本，
  不据此删除为保留清理和 P2 查询准备的索引。

## Review

- Standards：数据库变更使用版本化迁移；新表显式 grants/RLS；文章 upsert 使用受信任列名与参数化值，
  不保存全文或秘密。清理是有上限的小批次，不执行阻塞性的 `VACUUM FULL`。
- Spec：重复来源键更新元数据但保留首次发现时间；当前热点、置顶和事件引用受清理保护；草稿事件不公开。
- Review fix：最初 upsert 会把冲突行标题误写为批次首条标题，现已改为逐列使用对应 `excluded` 值；同时把
  扩展和 Vault 写入移动到 36 路真实数据验证全部成功之后。
- Rejected：没有自动聚合或自动发布 AI 事件，也没有提前实现详情页、ISR、Cloudflare、sitemap 或 IndexNow。
- Accepted follow-up：解析修复部署后完成 36 路真实抓取与 Cron 验收；P2 之后再构建事件详情和缓存发布链路。

## Risks

- 删除大量 Postgres 行后空间不会立即下降，依靠 autovacuum 回收复用；不在日常 Cron 中运行 `VACUUM FULL`。
- 事件发布策略配置错误可能暴露草稿；公开读取策略必须同时检查事件状态。
- 保留任务必须分批，避免单次删除形成长事务或争用抓取写入。
