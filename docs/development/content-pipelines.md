# GitHub Blog 与自动 AI 时间轴

## Scope and decisions
用户要求修复两个空页面，并明确时间轴自动生成。GitHub Blog 加入既有来源任务；时间轴按真实 AI 文章一对一自动发布，沿用原文标题、摘要（空摘要使用标题）及发布时间（缺失时使用首次发现时间）。不生成事实或推测跨文章事件关系，保留人工事件。

## Implementation and feasibility
通过数据库迁移添加 auto_article_id 唯一来源标识、普通调用者权限触发器及现有文章回填。采集事务更新文章时同步事件，原有采集发布逻辑可读取事件关联并刷新路径。稳定 slug 与首次发布时间不变；手动归档不会被再次采集重新发布。函数禁止 public/anon/authenticated 直接执行，未增加公开写权限。

GitHub Blog Cron 每六小时执行，加入全来源覆盖测试，避免新增页面和源配置却遗漏任务。setup:cron 仍先验证所有来源再调度。

## Production verification
- 官方 Feed 无凭据探测：HTTP 200，623962 字节，含 RSS item。
- GitHub Blog 前置来源及正文迁移已应用，现有部署 API 支持该来源，无需修改 RSSHub。
- 生产 POST /cron/signals/github-blog：HTTP 200，批次 16c67d41-bb63-4a17-8870-7a63b8321088，10 条，publication=revalidated；完成于 2026-09-08 09:37:44.191 UTC。
- 云端 source_status 与 ingestion_runs 一致、status=succeeded；10 条 hot_items 的标题、GitHub Blog HTTPS URL、technology 分区、正整数排名及发布时间均通过。发布时间范围 2026-08-19 至 2026-09-04。
- 数据验证后才启用 signal-ingest-github-blog，任务 108，active=true，30 3,9,15,21 * * *（UTC），引用 Vault。
- 云端迁移 20260908093802_auto_ai_timeline：回填 105 事件及 105 来源关联；抽查标题、摘要与源文章相同。
- 云端事务回归成功并回滚：重复更新不增加事件，标题同步，slug/首次发布时间稳定，来源关联唯一，归档保持。测试见 supabase/tests/auto_ai_timeline.sql。
- 服务器缓存刷新 HTTP 200；Blog 数据接口返回 10 条，时间轴首屏 20 条且有下一页。
- API 61 项测试通过，类型及相关 Biome 检查通过。安全检查只报告既有 ingestion_runs 开启 RLS 无公开读取策略的信息项，符合内部采集记录用途。

## Review and limits
修复已在云端生效，不依赖等待前端重新部署。自动条目按文章生成，不做多来源事件合并。沿用已有关联事件保护规则，时间轴引用的文章不会被普通保留清理删除。未产生额外路线图事项。
