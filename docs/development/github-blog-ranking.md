# GitHub Blog 与开源排行榜

## Background

用户要求 Trending 作为排行榜，GitHub Blog 用于文章资讯，并明确继续当前 `feat/section-rss-feeds` 分支。

## Scope

- 保留 `/technology/github` 与既有 `github` 数据身份，按上游 position 展示周榜。
- 首页科技区与科技总览把 Trending 单独展示为开源排行榜，文章 RSS 排除仓库条目。
- 添加独立 `github-blog` 来源与 `/technology/github-blog`，使用官方 RSS。
- 准备数据库来源约束迁移；沿用本分支不部署、不推送、不合并约定，不启用新 Cron。

## Out of scope

日榜/月榜切换、星标统计、跨平台排名、其他热榜调整。

## Acceptance criteria

仓库排名不受发布日期影响；Trending 不混入文章列表或文章 RSS；博客不复用旧仓库数据；新来源失败或为空不影响其他来源；Cron 保持未启用。

## Feasibility

本地实现可行。复用官方 Feed 解析和现有 source 分区，新增 ID 需要扩展 ingestion_runs、source_status、hot_items、signal_articles 四处约束。
2026-09-07 无凭据探测 `https://github.blog/feed/`：HTTP 200，application/rss+xml，10 条；首条 Project HydraFusion，发布时间 2026-09-04 16:04:14 UTC，链接属于 github.blog。旧 blog.atom 经 Web 检查跳转博客首页。
生产就绪仍需部署 API、应用云迁移、手动调用生产采集并验证数据，最后才可添加 Vault-backed Cron；本轮不执行这些生产操作。

## Implementation

沿用 section-article-list 与 home-list-navigation 已确认的紧凑列表、现有明暗语义 token、冷蓝强调、4px 间距基础、桌面和 390px 手机范围；标题与仓库名是阅读重点，排名使用等宽数字，不增加 UI 库。
复用 Next 16.3.4、React 19.2.8、React Aria 1.17.0、Tailwind 4.3.3、HotList 和 FeedResultView。新增来源复用现有动态详情页面模板；榜单为已有科技区域内的独立列表。保留 loading、empty、error 状态。
已读取 UI Skills interface-design 与 baseline-ui。使用 TDD 验证排名及文章/榜单分离。

## Verification

GitHub 分离改动已通过 Web 80 项、API 54 项测试、全仓类型检查及生产构建，本次 TS 文件 Biome 检查通过。三个新增回归测试先失败再通过。实际解析器读取官方 RSS 得到 10 条有效文章。
独立评审未发现阻塞问题；浏览器确认 Trending 21 条按 01–21 展示，390px 下无页面横向溢出，Blog 在首次采集前显示空态。
用户随后明确要求跳过测试，并让首页采用截图中的大标题、说明、横向来源导航布局；首页移除侧栏与卡片外框，复用 SourceNavigation，保留六个分区及独立开源榜。此后首页改动未运行测试或构建，之前的验证结果不覆盖这次布局调整。
云端生产门禁未执行，新 Cron 未配置。没有额外的已接受后续功能，不创建空 roadmap。

## Risks

部署与迁移完成、首次采集之前 Blog 显示空态。Trending 仍依赖既有 RSSHub 路由。
