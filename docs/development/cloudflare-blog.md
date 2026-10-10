# Cloudflare Blog 定时采集

## Background
用户已部署 RSSHub PR https://github.com/DIYgod/RSSHub/pull/23543，仅要求接入 `/cloudflare/blog`。

## Scope
- 注册科技文章来源 `cloudflare-blog`，复用服务端通用采集、全文持久化和内容发布流程。
- 在 Supabase Cron 来源清单加入每六小时的错峰任务。
- 新增版本化迁移，更新四张表的来源约束。
- 修复统一 Feed 图片提取：读取图片 enclosure，并将正文相对图片 URL 解析为完整 URL。

## Out of scope
Cloudflare Status、RSSHub 部署、独立定时器、新页面或布局调整。

## Acceptance criteria
- Feed URL 为现有 RSSHub 实例的 `/cloudflare/blog`，仅新增一个来源。
- Cron 时间无碰撞；生产采集及云数据库核验通过后才启用任务。
- 全仓测试、类型检查通过，分支推送后由用户创建并合并 PR。

## Feasibility
可行。复用 `unify-signal-registry.md` 和 `native-high-signal-sources.md` 的已采用设计，无新界面或架构决策。
2026-10-10 无凭据探测 `https://rss.ljhboard.cn/cloudflare/blog`：HTTP 200，XML，20 items，约 550 KB；低于采集器 5 MB 限制。
来源使用现有 `RSSHUB_BASE_URL`，无需环境变量变更。采集器保留文章正文和发布时间。

## Implementation
- `technologySources` 注册来源，`cronSourceOrder` 加入调度列表。
- 来源图标复用已有 `SourceIcon`：Cloudflare 使用 react-icons 的 SiCloudflare；极客公园补本地 GP 字母图标（官网首页拒绝抓取，RSS 指定的 logo URL 返回 404，不将替代图标冒称官方标志）。
- UTC `30 4,10,16,22 * * *`，北京时间每天 00:30、06:30、12:30、18:30。
- 版本化 SQL 扩展 ingestion_runs、source_status、hot_items、signal_articles 的来源白名单。

## Verification
- 本地：Signals 7 项、API 85 项、Web 267 项测试通过；三个工作区 TypeScript 检查通过；Worker deploy dry-run 通过。
- 自检：注册表、任务来源与迁移白名单一致；224 个每日执行时间无碰撞、相邻至少五分钟；生产门禁流程保持不变。Standards/Spec 复核无阻塞项，无需新增 roadmap follow-up。
- 修改代码通过 Biome 检查（`sources.test.ts` 未改动的 gameSources 断言有已有格式差异，未清理相邻代码）。`git diff --check` 通过。
- 2026-10-10 部署 `rss-site-api`，Worker version `75b68e1a-cdff-432f-be41-93d7ca8e0b9e`。
- 通过现有云端数据库连接，在事务内应用版本化迁移 `20261010123000_add_cloudflare_blog_source.sql` 并写入 `supabase_migrations.schema_migrations`；四项约束均允许 `cloudflare-blog`。
- 手动调用生产 `POST /cron/signals/cloudflare-blog`，HTTP 200，20 条；批次 `f92652dd-8b67-4f1a-aa5c-d231e9bbc1b5`。
- `ingestion_runs` succeeded、`source_status` 对应批次/分区/20 条、`hot_items` 20 条、`signal_articles` 20 条均核验通过。最后成功时间 `2026-10-10T14:21:24.839Z`（北京时间 22:21:24）。
- 全部标题非空，URL 属于 `https://blog.cloudflare.com/`，source=`cloudflare-blog`、section=`technology`、position 连续 1–20；发布时间非空且无未来异常。正文最短 10,308 字符。
- 首条：Introducing Clef-omni with full multimodality, plus a faster Clef and a cheaper Clef-flash；`https://blog.cloudflare.com/clef-faster-cheaper-multimodal`；发布时间 `2026-10-09T18:27:34Z`。
- 以上验证通过后，单独调度新来源，没有重排其他来源任务。`signal-ingest-cloudflare-blog`：active=true，UTC `30 4,10,16,22 * * *`，命令使用 Vault 中的 URL 与 Cron 密钥。最终验证时间 `2026-10-10T14:21:35.211Z`。
- Web 来源展示随分支合并发布上线；服务端采集与定时任务已经部署并启用。
- 本地 Next.js 已启动；本机访问云 Supabase REST 出现 ECONNRESET/代理超时，使用数据库导出的真实 20 篇文章通过临时、忽略提交的 Node preload 验证来源列表，无产品代码或线上环境修改。文章详情导航被浏览器以 ERR_BLOCKED_BY_CLIENT 拦截，本轮未完成阅读页视觉核验。
- 来源图标修复：本地浏览器确认 Cloudflare 与极客公园图标可见；来源导航/科技页两项测试、Web 类型检查和图标组件 Biome 通过。
- 用户提出文章左侧封面列表，先完成[各来源图片覆盖率排查](../research/article-cover-audit.md)；图片解析修复已完成，[前端封面列表](article-cover-list.md)也已完成，等待分支合并部署。
- 图片解析修复：先运行四项回归测试，确认原逻辑均失败（仅 enclosure、封面优先/跳过音频、相对路径、跳过不安全图片）；修改后 API 89 项测试和类型检查通过。图片 enclosure 优先，description/content 的首个有效 HTTP(S) 图片回退，相对路径基于文章 URL 解析；不修改 RSSHub，不增加请求、依赖或数据库迁移。
- 修复差异复核（Standards/Spec）：仅扩展统一图片提取与相关回归测试；保持条目身份、正文、发布时间和 Cron，未发现阻塞项。
- 2026-10-10 修复已部署：Worker version `56c0c2dc-84d1-4a6c-9b26-0adca12073a2`。真实 RSS HTTP 200，20 篇解析为 20 张封面。
- 生产重新采集 HTTP 200，批次 `4c861872-5fc3-445c-a527-47a8284a8121`，20 篇；文章表图片从 1/20 增为 20/20，热点表图片 20/20，并逐条核对 RSS 的 sourceKey/图片 URL 一致。既有文章 ID 保留，无重复文章；run/status/batch 数据核验通过。
- 验证时间 `2026-10-10T14:55:11.499Z`（北京时间 22:55:11）；原 Cron 仍 active，时间未改变。修复代码 Biome 和 `git diff --check` 通过。

## Risks
RSSHub 全文提取可能受上游响应影响；保留现有超时、响应大小限制与最后成功快照。
Web 来源展示需用户合并分支后部署。后续 API 发布必须包含本次注册表变更，以免覆盖已启用来源。
