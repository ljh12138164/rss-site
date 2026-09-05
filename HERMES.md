# HERMES

## Active objective

完成财经、游戏和持久化 P1 的生产来源门禁，并在不部署前端的前提下准备最终上线 roadmap。

## Current state

- PR #7 已合并到 `origin/master` 的 `1927e8e`。当前分支 `feat/production-launch-roadmap` 从该提交创建，
  只包含生产门禁可靠性修复、权限收敛迁移和上线文档；没有创建前端部署配置。
- 云端 Supabase 项目 `pnjsrihfpyvkhyidzgfq` 已应用财经、游戏、P1 持久化及公开权限收敛四条迁移。
  `hot_items` 与 `signal_articles` 均为 496 条，文章关联空值与来源键错配均为 0；AI 事件两表保持空表，
  没有假数据。
- 六张业务表均启用 RLS。公开角色对五张可读表只有 SELECT，对 P1 三张表没有写、删或 truncate 权限；
  `ingestion_runs` 继续完全不公开。
- 两次完整 `pnpm setup:cron` 都按安全顺序在调度前停止：第一次前 8 路成功后遇到掘金瞬时 503；第二次
  前 26 路成功后遇到金十首条空链接。云端仍为 24 路既有五小时任务和 1 个清理任务，未启用财经、游戏或
  2H/6H 新调度。
- 当前分支让 Feed 解析器跳过缺标题或 Web URL 的单个坏条目，但整份 Feed 无可用项仍失败；Cron 安装器
  只对网络异常及 502/503/504 做 1 秒、3 秒两次有限退避。
- Supabase Security Advisor 只报内部 `ingestion_runs` 无公开策略的预期 INFO；Performance Advisor 的
  两个既有外键索引与新索引未使用提示已记录，当前不做无关优化。
- 最终上线方案记录在 `docs/roadmaps/production-launch.md`：用户明确批准后才实现 Next standalone、容器内
  单实例 `pm2-runtime`、GitHub Actions 不可变镜像、受限 SSH、健康检查和自动回滚。首发不使用 PM2 cluster，
  也不修改 Cloudflare 优选 IP、DNS 或 Dashboard Cache Rules。
- 旧远端 `feat/ai-event-timeline` 基于过时数据模型且只读取 `hot_items`，不直接合并；在 SEO roadmap P2
  基于 `ai_events` 重新整合。

## Next action

完成全仓验证并推送 `feat/production-launch-roadmap`。用户以该分支为 head、`master` 为 base 创建并合并 PR，
只需部署 API 修复；随后从第一路重新运行 `pnpm setup:cron`，逐来源核验云端批次并一次性切换 36 路 2H/6H
错峰任务。前端服务器部署配置等待用户明确说“可以部署”后再实现。

## Delivery constraint

不提交或输出 GitHub、Supabase、数据库、Vault、Cloudflare 或 Cron 密钥。不通过网页创建或合并 PR。任何新来源
必须先通过生产 API 与云端 Supabase 数据门禁，再启用 Cron；部分成功不得绕过完整验证。
