# HERMES

## 2026-09-12 AI 事件详情加载边界

- 分支 `feat/fix-event-loading` 基于最新 `origin/master`，隔离时间轴列表 fallback，修复事件详情跳转出现列表骨架。
- 列表 page/loading 移到 `(timeline)` 路由组，公开 URL 不变，复用既有 ArticleLoading。
- Web 全量 154/154、最终定向 9/9、类型、修改文件 Biome 与 53/53 页面生产构建通过；开发记录：`docs/development/fix-event-loading.md`。下一步由用户创建 `feat/fix-event-loading` → `master` PR 并合并发布，线上慢网导航待验收。

## 2026-09-12 文章本地翻译

- 当前分支 `feat/article-translation` 基于 `feat/source-content-quality`，在 Next Node.js Route Handler 内挂载 Hono，并通过 Hono RPC 向文章页提供类型安全的英译中接口。
- 翻译引擎直接使用 `mtranserver` npm 包；单进程复用引擎与 `en_zh` 模型，不部署独立翻译服务，也不接受客户端任意文本。
- 生产 standalone 镜像改由 Bun 运行，并通过 Compose volume 持久化模型。开发记录：`docs/development/article-translation.md`。
- 当前补充英文 AI 事件详情翻译；时间轴列表保持浏览密度，不增加逐项按钮。加载文案统一为“正在翻译中”，移除模型来源说明。
- API 63/63、Web 152/152 与双方类型检查通过；英文文章和 AI 事件均经 Hono RPC 完成真实翻译与桌面交互检查。缺少 `SITE_URL` 时 robots/sitemap 安全降级，完整 Web 构建生成 53/53 个静态页面；Docker daemon 未运行，细节见开发记录。
- 下一步：完成双轴评审并推送分支，由用户创建目标为 `feat/source-content-quality` 的 PR；CI 需验证 Linux 容器内 Bun standalone。

## 2026-09-12 来源内容质量修复

- 当前分支 `feat/source-content-quality` 从 `origin/master` 创建；移除 V2EX、同花顺、Steam，改用 GLM 各模型文档链接、解码标题 entity，并保留 GitHub Blog 官方 RSS。
- 中新网视频正文修复在独立 RSSHub 分支 `codex/fix-chinanews-video-content` 完成，避免把上游路由改动混入本站仓库。
- 所有 RSSHub 来源目前都未使用 `mode=fulltext`；本轮不全局开启，因为该模式逐篇抓详情页且已在 Steam 多条请求上出现明显超时。
- 开发记录：`docs/development/source-content-quality.md`；调研证据：`docs/research/rsshub-vercel-content-quality.md`。
- API 63/63、Web 136/136 测试与双方类型检查通过；RSSHub fixture、真实视频页、类型和 lint 验证通过。下一步由用户创建 PR；生产数据迁移必须等代码部署后再应用。

## 2026-09-11 Cloudflare Worker API migration

- Current objective: migrate only `server/api` from Vercel to Cloudflare Workers on the user-selected
  `feat/fix-fullscreen-section-skeletons` branch; RSSHub, web, schema, sources, and Cron logic remain
  unchanged.
- Worker entrypoint, Hyperdrive lifecycle, Wrangler config, generated types, bounded feed reads, and
  deployment guidance are implemented. Development record:
  `docs/development/cloudflare-worker-api.md`.
- Next action: complete changed-file checks and review. Production cutover remains gated on replacing
  the placeholder Hyperdrive ID, installing Worker secrets, and verifying one real ingestion before
  Vercel is disabled.

## 2026-09-11 栏目全屏骨架修复

- 当前分支 `feat/fix-fullscreen-section-skeletons` 从最新 `origin/master` 创建；目标是修复骨架越过页面主体、吞掉全局顶栏的问题，并非加载卡死。
- 第一次给六个栏目根 loading 增加 `SiteShell` 的修复会与来源页 `SectionLayout` 形成双顶栏，已撤销。最终方案删除六个栏目根 loading，把 `Suspense` 下沉到 `PaginatedArticleFeed` 的异步文章查询内部。
- UI 不改正常页面、配色或动效；开发记录：`docs/development/fix-fullscreen-section-skeletons.md`。
- 最终组合回归 16/16、Web 全量 136 项及类型检查通过；真实 `/technology/juejin` 延迟查询验收只有一个顶栏、main、来源导航和正文骨架，无嵌套或横向溢出。
- 提交 `200c75f` 的错误实现已由 `e60d024` 覆盖并推送；最终代码编译、构建内类型检查通过，真实页面预渲染连续在不同 Supabase 来源超时，未伪报完整构建成功。下一步由用户重新发布验收。

## 2026-09-10 GitHub 中文开源排行榜

- 当前分支 `feat/github-ranking-ui` 从最新 `origin/master` 创建，修复 GitHub 仓库误入站内文章详情骨架，并把“开源排行”放到主导航“AI 时间轴”右侧。
- 用户确认默认只显示中文描述项目；RSSHub 目标路由为 `/github/trending/weekly/any/zh`，编程语言仍为任意语言。
- 榜单已显示排名、作者头像与名称、仓库名、简介、语言、Stars 和 Forks；点击经现有离站确认页进入 GitHub。
- UI Skills registry 当前不可用，沿用仓库既有视觉系统与 UI quality 清单。开发记录：`docs/development/github-ranking-ui.md`。
- API 61 项、Web 120 项测试、类型、修改范围 Biome、55/55 页面构建以及桌面/390px 手机明暗主题检查通过；全仓 lint 仍只有既有 CRLF 格式诊断。
- 提交 `d99aaf2` 已推送到 `origin/feat/github-ranking-ui`。下一步由用户创建目标为 master 的 PR；合并并部署 API 后手动重新采集 GitHub，确认云端默认快照确为中文榜，再保持现有 Cron。

## 2026-09-09 来源列表缓存恢复

- feat/fix-source-routes 修复六分区来源列表在缓存缺失后因 dynamicParams=false 抛 NoFallbackError 的问题，允许白名单来源重新生成。
- 生产构建 55/55、Web 116 测试及六来源缓存缺失 HTTP 回归通过，无效来源仍为 404。
- 记录：docs/development/fix-source-routes.md。下一步推送分支，由用户创建并合并到 master 的 PR，发布后复核线上来源页；本轮未修改生产服务。
## 2026-09-08 分区 RSS 订阅弹窗

- feat/rss-subscription-dialog 为六个分区总览与平台列表增加 RSS 订阅按钮，弹窗包含完整地址、复制反馈和三步配置说明，沿用现有 React Aria 与样式。
- Web 116 项测试、类型检查、相关 Biome 与临时 SITE_URL 下 55/55 页面生产构建通过；六分区地址、复制、关闭、桌面/手机及明暗主题已检查。浏览器拒绝复制场景仅代码检查。
- 用户授权原有 next-env.d.ts 开发类型路径修改随本需求一起提交。文档：docs/development/rss-subscription-dialog.md。
- 下一步推送分支，由用户创建并合并到 master 的 PR；没有部署或修改数据源。

## 2026-09-08 修复 GitHub Blog 与自动 AI 时间轴

- GitHub Blog 生产采集验证成功，10 篇文章；数据门禁后新增 Vault 支持的六小时 Cron，任务 108 active。
- 云端自动时间轴迁移已应用，105 篇 AI 文章回填为 105 个带来源事件；未来采集自动同步，稳定链接并防重复，保留人工事件与归档状态。
- 云端事务回归、API 61 项测试通过；服务器 Blog 数据接口返回 10 条、时间轴首屏 20 条并有下一页，缓存已刷新。
- 分支 codex/fix-content-pipelines，证据和边界见 docs/development/content-pipelines.md。

## 2026-09-08 全站详情加载边界

- 六栏目文章详情及 AI 事件详情共用带 SiteShell 的文章骨架，AI 时间轴补齐独立加载外框，修复冷导航时列表骨架铺满视口的问题。
- Web 116 项测试、类型和相关 Biome 检查通过。文档：`docs/development/detail-loading.md`；分支 `codex/fix-detail-loading`，目标 master。
- 下一步由用户创建并合并 PR，Actions 发布后验收真实慢网导航。未变更缓存、数据和部署配置。

## 2026-09-08 新闻站 Google 接入、轻量标识与服务器发布配置

- 用户确认 `news.ljhboard.cn` 并要求实现 Actions 到服务器。已新增 `.github/workflows/ci-deploy.yml`、standalone Dockerfile、单实例 PM2、Compose、SSH gate、健康检查和回滚脚本。master push 验证通过后部署，手动入口保留，PR 不部署。
- 231 字节 SVG 用于标签页和“今日热点”左侧；AdSense 复用 blog 发布商并提供 ads.txt；GA 读取 NEXT_PUBLIC_GA_ID，用户尚未给出新闻站 ID。
- 61+108 项测试和 Web 55/55 构建通过，standalone 首页/healthz/icon/ads.txt 均 200。Docker daemon 未运行，镜像和远端发布尚待 Actions 验证。
- 配置及首次服务器准备见 `docs/development/news-deployment.md`。尚未推送或实际运行 GitHub Actions；需 GitHub 参数、部署密钥和服务器一次性安装。保留既有未推送改动。

## 2026-09-08 RSSHub 日期修复已发布，完整门禁通过

- RSSHub 实际工作区为 `C:/Users/PC/Desktop/front/TEST/RSSHub`，修复分支 `codex/fix-stcn-publication-date`。证券时报直接子级日期选择器、完整日期优先解析和缓存键更新已部署：`dpl_86ZgnE7927s4NMkuGiffsF2gb23z`。
- 生产证券时报列表返回 HTTP 200，10 条全部包含有效发布时间；金十已改用 `/jin10/topic/343` 并验证 10 条真实文章落库。详细批次见 `docs/development/cloud-source-validation.md`。
- RSSHub 两项回归测试及静态检查通过；rss-site API 61、Web 108 项测试和类型检查通过；直接构建 Web 包成功生成 55/55 页面。根 Turbo 构建会过滤临时 SITE_URL，验证使用包级构建。
- 完整 36 路门禁从第一路复跑成功：710 条热点、0 个失败批次；37 个 Cron 全部 active，6 路 AI 每 2 小时、30 路其他来源每 6 小时、1 个清理任务。36 路来源任务均引用 Vault；云端 3,380 篇文章，1,281 篇有正文。
- 前端未发布，P6/P7 的公网缓存及 IndexNow 验收仍待前端上线。代码保留在现有分支，未推送；下一步按生产上线 roadmap 准备前端发布候选，沿用用户明确批准前端部署的约定。

## 2026-09-08 P6–P7 本地实现与正文生产验证

- 用户确认 API 已发布；生产 health 为 200。完整 36 路门禁复跑前 26 路成功，金十当前 4 条均无 Web URL，三次失败后安全停止；Cron 保持 25 个旧任务，0 个新任务。
- 云端现有 2,914 篇文章，805 篇保存 content_html，已确认正文 API 真正写入。
- 当前分支实现 Cloudflare 精确清除、最多 5 页预热、IndexNow key/批量通知，以及无变化采集抑制和 AI 关联事件失效。API 61、Web 107 项测试、类型检查及 55/55 页面生产构建通过。
- 下一步：确认构建，完成代码评审收口；等待金十恢复链接后从第一路重跑门禁。前端与本轮新增 API 代码仍未部署或推送。

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
