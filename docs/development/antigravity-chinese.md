# Antigravity 官方中文订阅

## Background

用户确认 rss-site 是中文站点，要求 Antigravity 订阅采用官方中文。官网已有中文标题和正文，但官方 RSS 与直接抓取 HTML 为英文，需要配套 RSSHub 读取官方中文数据。

## Scope

将现有 antigravity 的 RSSHub 路径切换为 `/google/antigravity/blog/zh-CN`，保留来源 ID、文章原 URL、采集上限及现有 Cron。

## Out of scope

UI 改版、机器翻译、依赖变更、数据库迁移、生产直接部署及此前跨来源缓存通知超时的排障。

## Acceptance criteria

- 真实配套 Feed 经现有解析器保留中文标题、正文、封面和发布时间。
- 原文章 URL 不变，使既有文章原地更新，避免重复入库。
- 相关测试、类型与静态检查通过；明确配套发布顺序。

## Feasibility

可行。复用已合并 `antigravity-feed.md` 的官方内容、封面与站内阅读方案，无新增 UI/架构决策。现有路由与 API 均以来源注册表驱动，只需切换路径；中文由 RSSHub 读取官方翻译资源提供，消费方无需新增翻译逻辑。

## Implementation

- 基于最新 `origin/master` `4438163` 创建 `feat/antigravity-chinese`。
- PR：[rss-site #47](https://github.com/ljh12138164/rss-site/pull/47)，依赖先部署 [RSSHub #7](https://github.com/ljh12138164/RSSHub/pull/7)。CI/预览状态以 PR 检查结果为准。
- 路径与对应来源解析断言改为 zh-CN。
- 必须先合并部署配套 RSSHub 路由，再合并 rss-site 发布 API，最后手动生产采集验证 20 条原文章更新为中文并刷新 Web；本任务不直接合并部署。

## Verification

- 配套 RSSHub 的真实 handler 和 RSS 模板生成中文 Feed（25 篇、340,487 bytes），经本仓库 `parseSignalFeed` 识别 25/25 中文标题、正文、封面、日期和唯一 URL，最短正文 HTML 2,128 字符。
- 中英文逐篇对比：GUID、原 URL、日期、图片/视频/iframe/source 及 pre 代码块不变；原来源 ID 不变，现有入库去重机制继续适用。
- Signals 7 项测试、全仓 `pnpm check-types`、两个变更代码文件的 Biome 检查通过。
- Standards/Spec 自审完成：来源路径与断言一致，无 UI、数据库、调度或其他来源变更；无阻塞发现或接受的后续事项，不创建空 roadmap。

## Production regression — 2026-10-19

- #47 已由用户合并；主分支提交 `01164e8c1b7c319dba45a04f2eeedcb3054d30ed`，Actions `39212473132` verify/deploy 成功。PR CI `39212266744` 的 Signals 7、API 111、Web 329，共 447 项测试通过，类型、镜像构建及运行时验证通过。
- RSSHub #7 合并后实际运行发现解析器 raw transfer 的 6 GiB 缓冲区在 Vercel 分配失败。补丁 [RSSHub #8](https://github.com/ljh12138164/RSSHub/pull/8) 已由用户合并发布，提交 `41e9dc51`；正式中文 Feed HTTP 200，25/25 中文标题、正文、封面、日期和唯一 URL。
- Supabase 使用现有 Vault/Cron 路径执行一次生产采集，pg_net 请求 8627 返回 HTTP 200、未超时，批次 `4546c12d-f932-4184-96a9-79ec94d403ca`、20 条、changed=true、publication=revalidated；run succeeded，完成于 `2026-10-19T07:33:12.785Z`。
- `signal_articles` 仍为原有 20 条，本次新增 0 行；20/20 中文标题、正文、封面、日期及唯一 URL，最短 HTML 2,176 字符。hot_items 同批次 20 条中文、20 张封面、排名 1–20；source_status 同步。
- 浏览器确认来源页 20 篇中文文章及封面；首篇中文阅读页正文 3,135 字符，三节中文目录与原文入口正确。首次观察旧缓存，随后正常刷新即显示中文；没有人工补发刷新请求。
- Cron 119 active，UTC `35 4,10,16,22 * * *`，原定时配置保持；此次从云端手动执行同一调用路径，未等待下次自然调度。没有自动合并、直接部署、数据库结构变更或凭据输出。

## Risks

配套 RSSHub 未发布前调用新路径将失败；官方尚未翻译的新文章保留原文，官方只有纯文本译文的段落会失去行内链接/强调格式，站内原文入口仍可访问。中文标题会更新现有文章的可读 slug，但保留文章 ID/原 URL。此前回归中发现的跨来源刷新失败仍属独立问题，不能因中文适配而宣称已解决。
