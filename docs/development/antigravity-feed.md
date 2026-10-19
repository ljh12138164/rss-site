# Google Antigravity 全文订阅接入

## Background

用户要求在 rss-site 添加 Antigravity 博客的正文和封面。本项目采集 API 已迁移到 Cloudflare Workers，Supabase Cron 调用云端 API，再由 Vercel RSSHub 抓取文章，本机代理不参与生产采集。

## Scope

- 在 AI 分区注册 `antigravity`，使用 RSSHub `/google/antigravity/blog` 补齐正文和封面。
- 新增四张表的版本化来源白名单迁移。
- 增加每六小时的错峰调度配置，沿用现有来源导航、列表、RSS 和文章持久化流程。

## Out of scope

新页面布局、依赖变更及本次 PR 中的生产部署或 Cron 启用。RSSHub 抓取实现由配套 PR 交付。

## Acceptance criteria

- RSSHub Feed 可通过现有解析器读取有效标题、唯一链接、作者、真实发布时间、正文与封面。
- 来源位于 AI 分区，使用配置的 RSSHub 实例，最多采集 20 篇。
- 来源、迁移、Cron 配置一致；保留原有调度，新增任务与其至少相隔五分钟。
- 相关测试、全仓类型检查及 Worker 打包通过；生产任务在云端验收后才能启用。

## Feasibility

可行。复用 `unify-signal-registry.md` 和 `cloudflare-blog.md` 已采用的来源注册、RSSHub 全文补抓及新来源上线门禁，无 UI 变更。

2026-10-19 通过现有 `parseSignalFeed` 读取官方 RSS：HTTP 200，10,718 bytes，25 篇。首篇标题为 `Gemini 4 Argon in Google Antigravity`，链接为 `https://antigravity.google/blog/gemini-4-argon-in-google-antigravity`，发布时间为 `2026-10-13T08:00:00.000Z`。

官方 Feed 的 25 篇均无正文、摘要或封面，因此配套 RSSHub 路由保留官方元数据，抓取网页 `.post .content-section` 与头图，并缓存结果，最多三路并发；恢复延迟加载视频的 src，统一媒体及链接的绝对地址。文章 HTML 包含正文，无需浏览器自动化。生产网络可达性仍需从实际部署验证，本机探测不能替代云端验收。

## Implementation

- `packages/signals` 添加 `antigravity`：名称 Google Antigravity、AI 分区、RSSHub 路径、20 条上限。
- 配套路由 PR：https://github.com/ljh12138164/RSSHub/pull/6；消费方沿用本 PR #45，部署 RSSHub 后才能采集。
- 复用原有导航与 `AG` 字母图标回退，无新增 UI 代码或页面模板。
- 调度追加到清单末尾，UTC `35 4,10,16,22 * * *`，北京时间每天 00:35、06:35、12:35、18:35，不改变其他来源时间。
- 迁移由 Supabase CLI 创建，沿用现有四张表的白名单，仅新增 AI 来源 `antigravity`。
- 基于最新 `origin/master` `450cf08` 创建 `feat/antigravity-feed`，保留主分支已有 Skills 调度超时测试。

## Verification

- 官方 Feed 的真实解析结果见 Feasibility，未使用凭据。
- 全文补抓验证：配套 RSSHub handler 抓取 25 篇，经真实 RSS 模板输出 369,006 bytes；本项目 `parseSignalFeed` 识别 25/25 正文、25/25 封面与日期，最短正文 3,024 字符，无邮件订阅或分享组件残留。路由切换后 Signals 7 项测试和全仓类型检查通过。
- 全仓类型检查通过；Worker `deploy:check` 打包通过。
- `pnpm test`：Signals 7 项、API 107 项、Web 329 项，共 443 项通过。AI 页新增来源后的条目数断言同步为 24。
- 五个变更代码文件通过 Biome；`git diff HEAD --check` 通过。
- `pnpm build` 通过：63/63 静态页、early hints 与 service worker 生成成功；Turbo 写入 Windows standalone 构建缓存时出现现有符号链接路径过长警告，命令退出 0，Linux 发布仍由 CI 验证。
- 迁移静态核验通过：与此前完整白名单迁移相比，四项约束仅增加 `antigravity`，不删除旧来源。
- Standards/Spec 自审通过：固定 RSSHub 路径、正确 AI 分区、原始发布时间、20 条上限、43 路任务全部覆盖来源；每日 228 个执行时间无碰撞且相隔至少五分钟；保留上线门禁。无阻塞发现或接受的后续事项，不创建空 roadmap。
- 原 PR 交付时未应用生产迁移、执行生产采集或启用 Cron；合并后的生产回归见下文。

## Production regression — 2026-10-19

- RSSHub #6、rss-site #45 已合并；RSSHub Vercel 部署和 Web Actions `39197619582` 成功。Web 发布提交 `0ffbe597c2dc0ada33b18a97c9e2f0295dc2b69f`，Worker 版本 `e808453a-6c8b-4370-9111-747214b1b0fe`。
- 生产 `https://rss.ljhboard.cn/google/antigravity/blog` HTTP 200；现有解析器识别 25 篇，25/25 正文、封面、日期、唯一链接，最短 HTML 3,082 字符。
- 回归发现云端四张表尚未包含来源白名单。通过 MCP 应用仓库 `20261019033047_add_antigravity_source.sql` 的原 SQL；云迁移登记为 `20261019041547_add_antigravity_source`（MCP 生成时间戳）。保留这项本地/云端版本映射，不重写已执行迁移历史。
- 生产 `POST /cron/signals/antigravity` HTTP 200，批次 `8430cb3d-6f12-4e1e-a6e0-c7933015b345`，20 条；云端 run 为 `succeeded`，完成时间 `2026-10-19T04:15:56.488Z`，source_status 同步同批次、AI 分区、20 条。
- 云端 `signal_articles` 20/20 正文、封面、发布时间及唯一链接，最短正文 HTML 3,570 字符，无分享/邮件订阅组件；`hot_items` 20 条、排名 1–20、20 张封面及唯一 URL。
- 初次采集 `publication=failed`，导致来源页暂为空。定位为 Workers 不支持 `redirect: 'error'`，生产两端凭据一致。使用生产服务器持有的凭据调用刷新 HTTP 200；浏览器确认 20 条文章链接，前两张封面已加载（naturalWidth 1,920 / 1,440），首篇 Gemini 4 Argon 阅读页可读完整正文、三节目录及原文链接。没有输出或提交密钥。
- 修复后的真实通知函数在 Cloudflare 远程预览返回 `publication=revalidated`，耗时 1,357 ms；正式修复发布及复验仍待完成，详见 [Worker 刷新修复](fix-worker-revalidation.md)。人工刷新不等于正式 API 已修复。
- 数据门禁通过后仅新增 Cron `signal-ingest-antigravity`，job ID `119`，`active=true`，确认命中 Antigravity 端点并使用 Vault。UTC `35 4,10,16,22 * * *`，北京时间 00:35、06:35、12:35、18:35；尚未等待首次自然调度。

## Release gate

本 PR 不启用生产 Cron。合并上线时按 AGENTS 顺序操作：

1. 先合并部署配套 RSSHub PR，验证 `/google/antigravity/blog` 返回正文和封面；再部署包含新来源的 API，并应用版本化迁移。
2. 手动调用生产 `POST /cron/signals/antigravity`，使用服务端密钥。
3. 验证云端 `ingestion_runs` succeeded、`source_status` 更新、`hot_items` 与 `signal_articles` 写入至少一篇，检查来源、分区、标题、链接、排名、发布时间、正文和封面。
4. 验收通过后，启用 Vault 支持的 `signal-ingest-antigravity`，核实 active 与调度时间，记录非敏感证据。

## Risks

- rss-site 上线依赖配套 RSSHub 路由先部署，否则采集会遇到 404。
- 文章页面结构变化或网络失败会使抓取失败；RSSHub 缓存和三路并发减少重复请求，生产验收前不启用 Cron。
