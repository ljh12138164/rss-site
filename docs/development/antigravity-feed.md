# Google Antigravity 官方 RSS 接入

## Background

用户要求在 rss-site 添加 Antigravity 博客订阅，并确认定时抓取是否依赖本机代理。本项目采集 API 已迁移到 Cloudflare Workers，Supabase Cron 调用云端 API；官方 Feed 请求由 Worker 发起，本机代理不参与生产采集。

## Scope

- 在 AI 分区注册 `antigravity`，直接使用 `https://antigravity.google/blog/rss.xml`。
- 新增四张表的版本化来源白名单迁移。
- 增加每六小时的错峰调度配置，沿用现有来源导航、列表、RSS 和文章持久化流程。

## Out of scope

RSSHub 路由、全文抓取、封面提取、新页面布局、依赖变更及本次 PR 中的生产部署或 Cron 启用。

## Acceptance criteria

- 官方 Feed 可通过现有解析器读取有效标题、唯一链接、作者及真实发布时间。
- 来源位于 AI 分区，使用固定官方 URL，最多采集 20 篇。
- 来源、迁移、Cron 配置一致；保留原有调度，新增任务与其至少相隔五分钟。
- 相关测试、全仓类型检查及 Worker 打包通过；生产任务在云端验收后才能启用。

## Feasibility

可行。复用 `native-high-signal-sources.md`、`unify-signal-registry.md` 和 `cloudflare-blog.md` 已采用的来源注册、官方 Feed 直连及新来源上线门禁，无新增设计决策或 UI 变更。

2026-10-19 通过现有 `parseSignalFeed` 读取官方 RSS：HTTP 200，10,718 bytes，25 篇。首篇标题为 `Gemini 4 Argon in Google Antigravity`，链接为 `https://antigravity.google/blog/gemini-4-argon-in-google-antigravity`，发布时间为 `2026-10-13T08:00:00.000Z`。

主要限制是官方 Feed 的 25 篇均无正文、摘要或封面。保留上游实际元数据，不伪造正文；阅读正文需打开原文。该限制不阻碍订阅接入，全文抓取不在本次范围内。生产网络可达性仍需从实际 Worker 验证，本机探测不能替代云端验收。

## Implementation

- `packages/signals` 添加 `antigravity`：名称 Google Antigravity、AI 分区、官方 Feed、20 条上限。
- 复用原有导航与 `AG` 字母图标回退，无新增 UI 代码或页面模板。
- 调度追加到清单末尾，UTC `35 4,10,16,22 * * *`，北京时间每天 00:35、06:35、12:35、18:35，不改变其他来源时间。
- 迁移由 Supabase CLI 创建，沿用现有四张表的白名单，仅新增 AI 来源 `antigravity`。
- 基于最新 `origin/master` `450cf08` 创建 `feat/antigravity-feed`，保留主分支已有 Skills 调度超时测试。

## Verification

- 官方 Feed 的真实解析结果见 Feasibility，未使用凭据。
- 全仓类型检查通过；Worker `deploy:check` 打包通过。
- `pnpm test`：Signals 7 项、API 107 项、Web 329 项，共 443 项通过。AI 页新增来源后的条目数断言同步为 24。
- 五个变更代码文件通过 Biome；`git diff HEAD --check` 通过。
- `pnpm build` 通过：63/63 静态页、early hints 与 service worker 生成成功；Turbo 写入 Windows standalone 构建缓存时出现现有符号链接路径过长警告，命令退出 0，Linux 发布仍由 CI 验证。
- 迁移静态核验通过：与此前完整白名单迁移相比，四项约束仅增加 `antigravity`，不删除旧来源。
- Standards/Spec 自审通过：固定上游 URL、正确 AI 分区、原始发布时间、20 条上限、43 路任务全部覆盖来源；每日 228 个执行时间无碰撞且相隔至少五分钟；保留上线门禁。无阻塞发现或接受的后续事项，不创建空 roadmap。
- 未应用生产迁移、执行生产采集或启用 Cron；完整云端门禁属于合并后的发布步骤。

## Release gate

本 PR 不启用生产 Cron。合并上线时按 AGENTS 顺序操作：

1. 部署包含新来源的 API，并应用版本化迁移。
2. 手动调用生产 `POST /cron/signals/antigravity`，使用服务端密钥。
3. 验证云端 `ingestion_runs` succeeded、`source_status` 更新、`hot_items` 与 `signal_articles` 写入至少一篇，检查来源、分区、标题、链接、排名和发布时间；无正文是官方源的已知限制。
4. 验收通过后，启用 Vault 支持的 `signal-ingest-antigravity`，核实 active 与调度时间，记录非敏感证据。

## Risks

- 上游无正文与封面，站内全文阅读、翻译和总结无法依赖此 Feed 获得原文。
- 云端访问也可能遭遇上游网络或服务故障；经过 Vercel RSSHub 转发并不能消除这些故障，还会增加一层依赖。
