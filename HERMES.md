# HERMES

## 2026-09-08 云迁移已完成，API 发布受作者关联阻断

- 用户要求继续接通。三条迁移已应用，SQL 文件按云端版本同步为 20260907160405 / 20260907160408 / 20260907160426；公开写权限为 0，25 个 Cron 未变。
- 本地真实社交摘要详情可读，桌面及 390px 手机无横向溢出，主题切换可用。
- API 部署 dpl_HWJqd5uWgcBwbUSnrYNMqNe6cP5F 被 Vercel 标记 BLOCKED：HEAD 作者 Vitality <vitality@kreator-inc.com> 未关联 Git 账号；CLI 登录为 ljh12138164。未改作者身份绕过限制，未手动采集或发布前端。
- 下一步等待用户确认合法提交身份或关联邮箱后重新发布 API，再验证正文落库。细节见 docs/development/article-reader.md。

## 2026-09-07 全分区阅读与正文保存（待云端接通）

- 在当前分支完成六分区 /{section}/{source}/{slug} 阅读页，列表与搜索进入站内详情；保留旧新闻 URL。
- Feed 保留 content:encoded 优先的 HTML，signal_articles 新增 content_html 迁移；正文仅在详情清洗渲染，保留标题、段落、列表、引用、代码和表格。沿用不显示图片偏好。
- Web 93 项、API 56 项测试与类型检查通过，临时 SITE_URL=http://localhost:3000 下生产构建通过。真实 GitHub Blog Feed 验证正文结构保留，未写入云端。
- 云端只读确认仍缺生命周期和正文迁移；真实详情返回 503，完整视觉验收、落库验收待接通。不擅自应用迁移、部署或重跑生产采集。
- 下一步：获得云迁移执行授权后应用前置迁移，再更新 API 并重新采集、验证正文写入及阅读页。详见 docs/development/article-reader.md 和 docs/roadmaps/article-content.md。

## 2026-09-07 今日热点头部

- 继续 feat/section-rss-feeds，共享头部改为“今日热点”，补上分类高亮与时间轴分组，默认 metadata 同步更名。
- 文章跳转原因：仅新闻分区支持站内摘要详情，其余来源进入 /out；没有第三方全文。此轮解释现状，未扩展详情模型。
- 本地首页 HTTP 200，diff 空白检查通过；Biome 和类型检查受 node_modules 缺失阻断，视觉验收待完成。见 docs/development/today-hot-header.md。

## 2026-09-07 P1–P5 补齐（本地实施，未验收）

- 用户要求逐项实现 P1–P5，并明确 AI 时间轴入口放在页面头部；已加入 SiteShell 主导航。
- `/ai/events` 时间轴与 `/ai/events/[slug]` 事件详情读取已发布真实事件；首屏 ISR、来源引用、关联事件、React Query 游标分页和一页预取。
- 新生命周期迁移 `20260907095143_complete_content_lifecycle.sql` 固定 slug、维护内容修改时间并记录删除标记；尚未应用云端。代理层用标记和公开可见性在流式正文前返回 410/404，失败返回 503。
- 增加 sitemap/robots、事件发布后受保护失效、新闻详情 ISR；薄新闻摘要设置 noindex 并排除 sitemap。搜索迁移 React Query，保留中文输入法和防抖。
- 新增人工编辑事件 CLI `pnpm --filter @rss-site/api publish:event <JSON文件>`，校验真实 AI 文章引用，事务写入后通知 Web；没有创建或发布任何事件。
- 只读云端盘点：2,208 篇文章、0 个已发布 AI 事件、25 个活跃 Cron。P1 全来源生产门禁未完成；未部署 API/前端，未启用任何新 Cron。
- 用户要求跳过测试，未测试、类型检查、构建或浏览器验收。详见 `docs/development/roadmap-p1-p5.md`；不能标记 P1–P5 全部完成。

## 2026-09-07 React Query 列表迁移

- 用户要求继续迁移；已固定安装 @tanstack/react-query 5.102.8，根 Provider + 服务端 HydrationBoundary + useInfiniteQuery 接管全部滚动列表。
- 保留一页预取，缓存按分区/来源/游标隔离，关闭无必要自动刷新，不修改 ISR 周期。
- 记录：`docs/development/react-query-lists.md`。依约未测试、未构建、未部署，P5 运行验收仍待完成。

## 2026-09-07 优先启用列表 ISR

- 用户暂停 React Query 迁移，优先实现 SEO roadmap P3。首页和 AI 列表 2 小时 ISR，其余分区及来源列表 6 小时。
- 新增 /api/revalidate 白名单鉴权接口；采集事务成功后可通知 Web，发布失败单独记录，不改变采集结果。
- 记录：`docs/development/list-page-isr.md`。未配置真实密钥或生产 URL，未测试、构建或部署，不能宣称缓存命中已验证；完整 P3 仍未完成。

## 2026-09-07 列表下一页预取

- 首页、六个分区及来源详情共用一页预取：首屏后后台取下一页，触底复用结果，显示后再预取一页。
- 当前未使用 React Query，保持 fetch + IntersectionObserver；后台失败静默，触底重试，离开页面取消请求。按约定未测试或构建。

## 2026-09-07 分区与来源滚动加载

- 六个分区总览及来源详情页接入 PaginatedArticleFeed，首屏 30 条并按范围继续加载；文章按时间，GitHub 当前榜单按排名。
- /api/articles 增加分区与来源白名单；切换来源重置列表和请求，保留重试及手动加载。
- 记录：`docs/development/section-infinite-scroll.md`。按用户要求跳过测试与构建，未部署、未推送，继续当前分支。

## 2026-09-07 首页全部文章与滚动加载

- 用户纠正首页需求：一个全站文章列表，按发布时间倒序、滚动加载，取消六分区分别展示。
- 已改用 signal_articles 首屏 30 条及 /api/articles 游标续取，保留来源链接、新闻详情和独立开源榜入口。
- 记录：`docs/development/home-all-articles.md`。用户要求跳过测试；本轮不运行测试、类型检查、构建或浏览器验收。保持本分支、不部署、不推送。

## 2026-09-07 GitHub Blog 与开源排行榜

- 当前目标：在 `feat/section-rss-feeds` 分离 GitHub Trending 排行榜与 GitHub Blog 文章；用户明确继续本分支。
- Trending 保持原始排名和已有来源 ID；Blog 使用独立 `github-blog` 与官方 `https://github.blog/feed/`。
- 开发记录：`docs/development/github-blog-ranking.md`。GitHub 分离部分通过测试、构建与独立评审；用户随后要求跳过测试，首页按截图改为大标题、说明、横向来源导航与平面列表，新增布局未测试。
- 沿用不部署、不推送、不合并约定；新来源生产门禁未执行，Cron 未添加。

## 2026-09-07 关于页原理小结

- `/about` 新增四步原理小结，手机纵排；“查看原理图”打开 Archify 生成的独立工作流图。
- 开发记录：`docs/development/about-content-flow.md`。构建、类型检查及本次 Biome 通过；图的 9/9 结构校验通过，最终自动截图遇 Chrome 超时，已通过手动浏览器检查补充确认四种桌面尺寸和明暗主题。
- 继续当前 `feat/section-rss-feeds`，不推送、不部署、不合并。

## 2026-09-07 关于、隐私与离站访问

- 在 `feat/section-rss-feeds` 添加 `/about`、`/privacy` 与页脚入口，沿用项目现有配色和风格。
- 用户确认保留离站提示，点击“继续访问”后在当前标签页访问原文。
- 开发文档：`docs/development/about-privacy-pages.md`。77 项 Web 测试、全仓类型检查、生产构建与本次 Biome 通过；桌面/390px 手机明暗主题已复核，真实 GitHub 链接确认在原标签页打开。
- 本次实现与评审完成，后续继续当前分支开发；沿用不部署、不推送、不合并约定。

## 2026-09-07 分区统一时间列表

- 六分区概览移除平台分组，按发布时间混合显示全部当前条目，连续编号、平台图标/链接与最多 240 字符简介；复用现有 RSS 正文兜底。
- 开发文档：`docs/development/section-article-list.md`。Web 77 测试、全仓类型检查、Web 构建与本次 Biome 通过；本地 /ai DOM 已验证，截图工具超时，移动端和主题像素复核待完成。
- 继续 `feat/section-rss-feeds`，不部署、推送或合并；保留用户 next-env.d.ts 修改。

## 2026-09-07 首页顺序列表与分区局部加载

- 在 `feat/section-rss-feeds` 继续实现首页编号列表与平台图标/名称，复用平台页 HotList。
- 六分区标题和平台导航移入共享布局，骨架屏只覆盖文章区；新闻详情保留独立布局。
- 开发文档：`docs/development/home-list-navigation.md`。75 项 Web 测试、全仓类型检查、生产构建、本次文件 Biome 检查及独立评审通过；全仓 lint 仍受既有 82 个未改文件的 CRLF 格式诊断影响。
- 六分区慢加载、390px 手机中断切换/前进后退、明暗主题和新闻详情独立布局已验证；保持当前分支继续开发，不部署或合并。

## 2026-09-06 跳转中间页精简

- 在 `feat/section-rss-feeds` 将 `/out` 收敛为独立信息卡，只显示 AI 热榜标识、离站安全提示、完整目标地址与“继续访问”按钮。
- 保留 URL 安全校验和无效链接返回路径；开发记录见 `docs/development/outbound-page.md`。
- 68 项 Web 测试、类型检查、生产构建与桌面/390px 手机页面检查通过，页面无横向溢出和控制台错误。

## 2026-09-06 文章时间排序与年份

- 在 `feat/section-rss-feeds` 修复文章展示顺序：来源列表、首页各分区及分区 RSS 均按发布时间从新到旧排列；无发布时间的条目置后并保留原有顺序。
- 来源列表日期补充四位年份，不修改抓取任务、数据库结构或平台排名数据。开发记录见 `docs/development/chronological-feed-dates.md`。
- 70 项 Web 测试、类型检查、生产构建、真实新华社页面与新闻 RSS 顺序检查通过；仓库全量 lint 仍受未改文件的既有 CRLF 格式诊断影响。

## 2026-09-06 来源平台图标

- 在 `feat/section-rss-feeds` 为 36 个来源增加本地图标，首页文章来源与六类来源导航复用 `SourceIcon`；不增加运行依赖或第三方页面请求。
- 桌面和 390px 手机分类页已验证图标正常加载且无页面溢出；开发记录见 `docs/development/source-platform-icons.md`。

## 2026-09-06 首页视觉细化

- 原分支 `feat/section-rss-feeds` 继续优化：首页改为响应式分区目录与独立阅读面板，增强标题栏、来源首字标识及元数据层次。
- 69 项 Web 测试、生产构建及桌面/手机明暗主题检查通过。详情见 `docs/development/home-article-list.md`。未部署，后续继续原分支。

## 2026-09-06 首页文章列表与搜索高亮

- 按用户参考图，在 `feat/section-rss-feeds` 将首页从稀疏来源面板改为六分区的紧凑文章列表，显示标题、摘要、时间和真实来源。
- 搜索命中词改为深蓝底白字。沿用现有主题和来源查询，无数据库、部署变化。
- 记录见 `docs/development/home-article-list.md`；页面、69 项 Web 测试、构建和对比度检查已通过，继续在本分支迭代。

## 2026-09-06 文章搜索与分支约定

- 用户要求现在和后续均在原本 `feat/section-rss-feeds` 分支开发，不再新建分支。已切回，搜索改动完整保留。
- 已完成 Pagefind 风格搜索弹窗，搜索标题和摘要，支持防抖、高亮、分页、加载、空态、重试和键盘操作；未部署。
- 开发记录：`docs/development/article-search.md`；全仓类型与测试、Web 构建、真实数据和桌面/手机明暗主题页面验证均通过。

## 2026-09-06 新闻详情补充

- 在 `feat/section-rss-feeds` 实现 `/news/[source]/[slug]` 与新闻总览摘要；slug 以标题和持久化 UUID 组成。
- 云端已应用 `20260906022000_allow_public_signal_article_reads`，公开角色仅能 SELECT 文章；两种公开角色均已验证新闻可读且无修改权限。
- 开发与验证记录：`docs/development/news-article-details.md`。前端尚未部署，继续留在当前分支开发。
- canonical 需要最终 `SITE_URL`；ISR、sitemap、清理后的硬 404/410 继续按既有 SEO roadmap 推进。

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
