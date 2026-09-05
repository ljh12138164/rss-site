# HERMES

## Active objective

在 `feat/section-rss-feeds` 继续未上线开发：保留六个专区 RSS 输出，并完成公开页面的来源导航与口语化文案重构。

## Current state

- 当前开发分支为 `feat/section-rss-feeds`，从已合并的 `origin/master` 创建。本期只增加 Web 端只读 RSS
  Route Handler、测试与文档，不修改 Supabase schema、权限或 Cron。
- 订阅源复用 `hot_items` 与 `source_status` 公共只读查询；每个专区按来源注册表顺序输出，每个来源最多十条，
  不生成跨来源虚假排名或缺失的发布时间。
- 原 `feat/refine-content-navigation` 的 UI 提交已接入当前分支。用户已确认不显示图片、抓取时间、2H/6H
  或内部实现文案；实施记录见
  `docs/development/refine-content-navigation.md`。
- 站名采用与主分区一致的“AI 热榜”；根据最新参考图，来源选择将统一改为标题下方的水平平台导航，
  桌面可换行、移动端可横向滚动。
- 本轮只改 Web 呈现，不修改数据、Cron 或部署配置。UI Skills registry 未暴露指定指南，按
  `frontend-design`、React Aria 现状与仓库 UI quality 清单回退验收。
- 共享 `SectionOverview`、`SectionLoading` 和来源导航已接入；六个分区与 36 个来源详情使用完整平台名，
  文章图片与旧频段组件已删除。站名为“AI 热榜”，加载使用中性灰，交互强调为冷蓝。
- 最新 UI 调整用 `SourceNavigation` 取代桌面侧栏：标题下方直接显示“内容来源”和平台常用名称，AI 区为
  OpenAI、Anthropic、DeepSeek、GLM、Gemini 与 Qwen；首页和分区说明已改为日常中文。
- 全仓格式、lint、类型、API 54 项测试、Web 52 项测试与生产构建通过；首页、六个分区和 `/ai/glm` 的
  本地 HTTP 回归均为 200，未操作可见浏览器。
- 骨架屏已从低对比 `bg-muted animate-pulse` 改为亮/暗独立灰蓝底色与轻扫光，并同步水平来源页面结构；
  新增两项回归测试后 Web 为 52 项，全仓格式、lint、类型、测试和构建继续通过。

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

在 `feat/section-rss-feeds` 继续后续未上线开发；RSS 与水平来源导航均已实现和验证，暂不发起合并或上线。

## Delivery constraint

不提交或输出 GitHub、Supabase、数据库、Vault、Cloudflare 或 Cron 密钥。不通过网页创建或合并 PR。任何新来源
必须先通过生产 API 与云端 Supabase 数据门禁，再启用 Cron；部分成功不得绕过完整验证。
