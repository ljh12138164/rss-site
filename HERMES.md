# HERMES

## 2026-10-13 总结边框可见性

- 目标：feat/summary-card-border，在已合并 PR #40 后提高总结轮廓可见性；用户反馈 1px/40% 仍太淡，现改为 2px/70%，已验证完整展开态明暗截图。
- 记录：docs/development/summary-card-border.md；明暗截图和 Biome/diff 检查完成，无阻塞审查项。交付 feat/summary-card-border，由用户创建并合并到 master 的 PR，未部署。

## 2026-10-13 Folo 风格总结面板

- 用户后续要求符合项目色调：已用 text-primary、border-border、bg-muted/30 替换紫色，18 项回归、Biome 与明暗截图通过；继续推送同一 feat/summary-folo-ui 分支。
- 目标：feat/summary-folo-ui，基于 d0326c6，仅修改详情页 ArticleSummary 的卡片与标题栏。
- 记录：docs/development/summary-folo-ui.md；已完成 300 项 Web 测试、类型、Biome 与本地全状态/明暗/390px 验证；完整构建编译通过但云 REST 预渲染超时。分支交付后由用户创建并合并到 master 的 PR，以 CI 复验。未部署。

## 2026-10-13 Cloudflare 文章总结

- 最新调整：浏览器/Web/Nest 仅传 {id}，Nest Drizzle 直查 Supabase 标题与正文，Redis 30 天与并发合并迁入 Nest。少于 200 个非空白 Unicode 字符前端隐藏、后端拒绝，标题与链接地址不计入。两仓版本 v2，idb 缓存保留。用户确认移除 Nest assistant 示例。
- 当前验证：Nest 18 项、Web 300 项测试，双仓类型/相关 lint/构建通过；Supabase 实际只读抽查 10 条通过。审查的链接字数问题已修复并回归，无剩余阻塞。真实模型推理与部署未执行。
- 两仓实现已推送 feat/article-summary-agent：后端 0ee3b01，前端 411bc09。后端现有 PR https://github.com/ljh12138164/ai-base/pull/1 的描述已更新，未报告 CI 检查；前端由用户通过下方链接创建到 master 的 PR。下一步配置 Nest 可达的 REDIS_URL，协调两仓合并并验证真实模型后部署；本轮未验证真实 Redis/Cloudflare 或部署。

- 当前目标：feat/article-summary-agent，Nest DeepAgentsJS/Cloudflare Qwen 总结接口与 Web 手动入口。
- 开发记录：docs/development/article-summary-agent.md；用户已确认详情页 UI，Folo 公开调用/缓存/正文边界调研完成。
- 用户先要求调研，随后确认 idb 实现，并要求 PR 地址；交付两仓 feat/article-summary-agent 分支到 master 的 PR 创建链接。AI 生成结果（总结和翻译）缓存为 30 天，本轮不部署。
- 已有实现的验证记录：Web 294、API 100、signals 7 项测试、全仓类型及 Web 62 页生产构建通过，浏览器模拟响应验证桌面/手机、明暗主题和键盘操作。真实 Cloudflare 推理未验证。
- 用户已确认 idb 本地总结缓存，实现与验证完成：30 天期限、刷新恢复、正文/版本失效、存储降级、首次生成手动。全仓 409 项测试、Web 类型、变更文件 Biome、62 页生产构建通过；浏览器真实 IndexedDB 配模拟总结响应验证刷新/折叠/正文切换，首次生成后无新增总结请求，临时页面/服务/标签页已清理。独立审查无阻塞项和接受的后续事项。
- 交付：[rss-site PR 创建链接](https://github.com/ljh12138164/rss-site/compare/master...feat/article-summary-agent?expand=1)、[ai-base PR 创建链接](https://github.com/ljh12138164/ai-base/compare/master...feat/article-summary-agent?expand=1)。按 AGENTS，由用户创建并协调合并两仓 PR；接着配置 Nest/Web 服务端环境并验证真实 Cloudflare 调用，再部署。

## 2026-10-12 顶部导航加载条

- 分支 `feat/top-loading-bar` 基于最新 `origin/master` `955b21d`。
- 已在根布局接入 `nextjs-toploader` 3.9.17：2px 贴顶主色加载条，导航完成自动隐藏，关闭 spinner、阴影和同页锚点触发；尊重减少动态效果。
- 开发记录：`docs/development/top-loading-bar.md`。
- Web 282 项测试、类型、变更文件 Biome、62 页面生产构建、桌面/手机与明暗主题导航验证通过；独立评审无阻塞项或接受的后续事项。
- 交付：已验证的功能分支；由用户创建并合并到 `master` 的 PR，合并后发布；本轮未部署生产。

## 2026-10-12 新闻发布时间

- 用户要求新闻优先补真实日期，非法/缺失按本次抓取日北京时间00:00兜底，GitHub/Skills不改。
- 分支feat/news-publication-dates基于origin/master c780969；RSSHub独立分支feat/news-publication-dates修中新网。
- API100项、类型、Biome、Worker打包dry-run、RSSHub30条真实handler与云库迁移回滚验证通过。迁移20261012064000补6929条，尚未应用。
- 实现9ebb082已推送origin/feat/news-publication-dates；RSSHub实现5b92e29ec保留在origin/feat/news-publication-dates，文档更新d5ea281c4已推送，旧codex分支已删除。记录docs/development/news-publication-dates.md。下一步用户合并两仓库PR，先上线RSSHub验证，再部署API并执行迁移和正式采集验收；当前未部署。

## 2026-10-11 SEO 与时间轴来源

- 分支 `feat/seo-followup` 基于最新 `origin/master` 336d8a8，独立工作区保留原采集器未提交修改。
- 目标：索引资格、标题摘要、时间轴来源、历史分页、同来源内链及 sitemap 缓存。记录 `docs/development/seo-followup.md`。
- 用户已批准逐项实施，沿用现有界面和组件；不继续知乎回答抓取，不新增来源或 Cron。
- 已完成六项 Web 优化与云迁移 `20261011143000`；282 项测试、类型、Biome、真实云快照生产构建与 HTML/XML 验证通过。REST 直连构建受本机网络限制，详见开发文档。
- 时间轴与历史页通过桌面/手机、浅色/深色浏览器检查；16 个 sitemap 分片无重复或不可索引文章，热请求不重查数据库。
- 实现提交 `772bc99` 已推送 `origin/feat/seo-followup`，工作区干净。后续路线图：`docs/roadmaps/seo-followup.md`。下一步：用户创建并合并到 `master` 的 PR，再发布 Web 并复验线上；Web 当前尚未部署。CI 仅在 PR 或 master push 时触发。

## 左侧封面的紧凑文章列表

- 继续 `feat/cloudflare-blog`，记录 `docs/development/article-cover-list.md`。
- CoverImage 支持原生懒加载、尺寸/默认图配置、fallback 插槽、图片失败回退与更换 src；列表有封面时显示真实图片，无图时显示平台标志，无文章时保持空状态。
- 用户确认 TDD 仅测试封面组件；逐项 red/green 与真实浏览器事件检查完成。Web 270 项、类型、Biome 通过，真实快照构建 63/63 及产物脚本通过；云 REST 直连仍被本机网络阻断。
- 本地服务已补齐全分类真实数据快照并重启，六个分类接口各 30 条，时间轴可读；保留用户在 server/api/src/ingestion/feed.ts 的本地回退，不纳入前端提交。
- 前端提交 `48f03bf` 已推送 `origin/feat/cloudflare-blog`；下一步由用户创建并合并到 master 的 PR 后部署。本地 3000 预览服务保持启动，3011 组件检查服务已关闭。
- 后续图片点击行为：真实封面打开大图预览，标题/摘要单独跳转；平台占位不预览。用户要求直接用包，现改用 yet-another-react-lightbox 3.32.2，移除自定义弹窗，兼容现有 React 19，无额外运行 dependencies。保留 CoverImage 的懒加载/失败回退测试与接口。
- 图片懒加载复查：封面、平台/页头图片、央视视频海报与 Lightbox 图片均使用原生 lazy；点击后才挂载预览。补齐海报的 lazy/async，相关 6 项测试和 Web 类型通过。
- 首页/hover 补充：速览和分区导览复用封面与平台回退，封面预览不跳转；文章行统一圆角、内边距和柔和 hover/focus 背景。Web 271 项、类型、63 页快照构建通过，首页/来源页与390px手机视觉核验完成。

## 2026-10-10 Cloudflare Blog

- 分支 `feat/cloudflare-blog` 基于最新 `origin/master`。
- 目标：仅接入 RSSHub `/cloudflare/blog` 到科技文章与服务端 Supabase Cron 采集。
- 记录：`docs/development/cloudflare-blog.md`；无凭据上游探测 HTTP 200、20 篇全文文章。
- 本地测试和类型检查通过；API 已部署，云迁移 `20261010123000` 已应用；生产批次 `f92652dd-8b67-4f1a-aa5c-d231e9bbc1b5` 写入 20 篇全文，数据质量核验通过。
- `signal-ingest-cloudflare-blog` 已启用并核验 active/Vault，UTC `30 4,10,16,22 * * *`。
- 实现提交 `47e15bd` 已推送 `origin/feat/cloudflare-blog`。下一步：用户创建并合并到 `master` 的 PR，发布 Web 来源展示；后续 API 发布需保留新来源。
- 本地已启动并通过真实云文章快照预览（本机 Supabase REST 网络失败）；补齐 Cloudflare 标志与极客公园 GP 字母图标并验证。
- 用户确认紧凑文章列表＋左侧封面，要求先排查图片来源。记录 `docs/research/article-cover-audit.md`；发现列表未取 image_url，Cloudflare 图片 enclosure/相对地址未提取。下一步根据排查结果实施列表与必要的图片提取修复。
- 用户要求先修复本站解析器：四项新增回归测试已验证原逻辑失败；统一解析器现支持图片 enclosure 优先、正文有效图片回退及相对路径，API 89 项、类型和 Biome 通过。Worker `56c0c2dc-84d1-4a6c-9b26-0adca12073a2` 已部署；生产批次 `4c861872-5fc3-445c-a527-47a8284a8121` 将 Cloudflare 图片从 1/20 更新为文章/热点表均 20/20，原文章 ID 保留，Cron 保持 active。下一步完成左侧封面 UI；用户仍需创建并合并分支 PR。

## 2026-10-08 管理后台与内容发布

- 分支 `feat/admin-dashboard-publication` 基于最新 `origin/master` `2108484`。
- 目标：收拢内容发布步骤；优化 `/admin` 标准 dashboard；授予用户指定现有账号文章管理与采集看板角色。
- 记录：`docs/development/admin-dashboard-publication.md`。
- 账号服务器角色已更新为 `article_admin` 并复查；回滚事务验证角色可读采集记录。用户需退出并重新登录刷新凭据。
- 实现完成：标准后台布局、真实分区统计、权限刷新及文章编辑状态；采集和人工编辑共用内容发布流程。356 项测试、类型、变更文件 Biome、62 页生产构建及本地浏览器验证通过；独立审查无阻塞项。
- 代码提交 `30d63a3` 已推送到 `origin/feat/admin-dashboard-publication`。下一步由用户创建并合并到 `master` 的 PR，再发布 Web；尚未生产部署。真实账号需刷新登录会话后验收。
- 富文本增补：用户批准 Tiptap，正文支持可视化排版与源码切换；视频嵌入保留源码模式。267 项 Web 测试、类型、Biome、完整 Web 构建和手机/桌面浏览器验证通过；独立审查发现的自动改写问题已修复并复审。同一分支交付，需合并并发布后上线。

## 2026-10-02 阅读效率与采集管理

- 分支 `feat/reading-productivity` 基于最新 `origin/master`（`8cca2f9`）。
- 目标：按 roadmap 依次实现并验证个人关注页、搜索筛选、长文目录/时间/进度、管理员采集看板、组合 RSS。
- 记录：`docs/development/reading-productivity.md`；路线图：`docs/roadmaps/reading-productivity.md`。
- 五阶段代码、338 项全仓测试、浏览器操作和云端采集统计/RLS 验证已完成。云端迁移版本 `20261002053650` 已应用；无来源或 Cron 变更。
- 本机云端 REST 连接重置导致真实环境预渲染失败；公开数据快照用于本地 UI/构建验证，真实登录及部署后的连接验收仍需发布后完成。
- 功能提交 `57a94cc` 已推送到 `origin/feat/reading-productivity`；工作区检查与快照构建完成。提交钩子 pnpm 联网停滞，已使用安装好的 Biome 对全部暂存文件执行相同检查后提交。
- 下一步：用户创建、合并到 `master` 的 PR；CI 用真实环境构建，发布后补充真实管理员登录与生产验收证据。尚未部署 Web。

## 2026-10-01 Redis first-deployment fix

- Branch `feat/fix-redis-release-bundle`, based on `origin/master` `fb0965c`, matching the failed production release supplied by the user. Remote fetch failed with a connection reset.
- Root cause: the installed old deployment script cannot execute the incoming script's Redis pull before that incoming script is installed after success.
- Fix: package Redis and Web together in the existing `image.tar`; existing server loader then has both images without registry access.
- Development record: `docs/development/fix-redis-release-bundle.md`.
- Verification: both packaging regression tests, YAML parse, Bash syntax, diff checks and all 323 workspace tests passed. Independent review confirmed compatibility with the old installed loader; no blocking findings remain. Actual image save/load and production rollout remain CI/deployment checks.
- Next: commit/push, owner creates and merges PR to `master`, then deploy the fix commit.
- Fix commit `f7091ea`; push attempts failed (GitHub direct connection and local proxy TLS handshake). Retry publication when connectivity recovers. Immediate owner workaround: pull `redis:7.4-alpine` on the server with an administrator account, then rerun the failed deployment; the incoming loader will be installed after that successful release.
- Follow-up: CI fix published on `feat/fix-redis-release-bundle`, based on fetched `origin/master` `fb0965c`; unrelated local GTM commit excluded. Owner creates/merges PR against `master`. No production commands or workflow trigger in this follow-up.
- Prior authorized Workbench recovery caused an unverified deployment followed by host-wide unavailability; user later confirmed services recovered. No reboot performed. Incident evidence and resource limits recorded in `docs/development/fix-redis-release-bundle.md`.

## 2026-09-30 Redis translation result cache

- Branch `feat/redis-ai-cache` starts at latest `origin/master` (`58b6d80`).
- Objective: article/event translation results expire after seven days in Redis; share key/read/write helpers with future AI summaries.
- Development record: `docs/development/redis-ai-cache.md`.
- The existing GoogleScripts GTM test edit remains local and is excluded at the user's request.
- Verification: 23 cache-focused tests, 228 Web tests excluding the unrelated GTM file, all workspace type checks, changed-file Biome and 61-page production build passed. Bun + real Redis smoke check verified TTL 604800, hit behavior, expiration and outage fallback. Independent review closed with no blocking findings.
- Delivery: reviewable feature branch; owner creates and merges the PR against `master` after publication. CI and deployment still need to validate the full Linux container and production Redis rollout.
- Product commit: `c81ea4f`. Push is currently blocked by GitHub connection resets/TLS failures, including HTTP/1.1 and local proxy retries. Next action: retry `git push -u origin feat/redis-ai-cache`, then create and merge the PR against `master`.

## 2026-09-29 外链直接直达源站与弹窗优化（保留 /out 兼容）
 
- 分支 `feat/direct-outbound-links` 基于最新 `origin/master` 创建。
- 目标：将全站外链底层 HTML 改造为真实源站 URL，消除爬虫对 `/out` 路径的刷量污染；保留 `/out` 页面以兼容老版本；升级 `OutboundDialog` 全局弹窗拦截站外链接并在确认后直接新开标签页跳转；在 `/out` 页面屏蔽统计脚本。
- 开发记录：`docs/development/direct-outbound-links.md`。
- 验证：全仓单测 208/208 项全部通过（62 个测试文件），Turborepo 跨 3 个子包类型检查全部通过，生产构建成功生成 61/61 个页面。
- 下一步：完成代码 review 后合并或推送至远程分支。

## 2026-09-28 Deploy without GitHub Actions artifact storage

- Branch `feat/deploy-without-artifact` starts at merged `origin/master` commit `e180430`.
- Objective: restore automatic deployment after PR #31 failed at `actions/upload-artifact@v4` because the repository's artifact storage quota was exhausted.
- Development record: `docs/development/deploy-without-artifact.md`.
- Verification: YAML parsing and artifact-step check passed; local `/admin` and `/healthz` returned 200. Docker Desktop is unavailable locally, so CI will verify the image build and deploy runtime.
- Review found no blocking issues or accepted follow-ups. Next: push the branch and ask the owner to create a PR against `master`.

## 2026-09-28 Article admin and Hono RPC

- Branch `feat/article-admin` starts at `origin/master` commit `0245afd`.
- Objective: Supabase Auth protected article editor at `/admin`; move all Next `/api/*` handlers under Hono with typed browser RPC; preserve edits through ingestion.
- Development record: `docs/development/article-admin.md`.
- Verification: 295 tests, all workspace type checks, changed-file Biome, and a 61-page production build passed. Cloud trigger and RLS behavior were validated in rolled-back transactions, then migration `20260928120257_article_admin` was applied and verified. Root lint has pre-existing failures; authenticated and mobile browser flows await the owner's admin account and suitable viewport tooling.
- Review: no blocking findings or accepted follow-ups. The branch is published on GitHub; next the owner creates a PR against `master` and merges after CI. The production migration is already applied; the web deploy follows the merge.

## 2026-09-26 接入首批官方原生高信噪比信号源 (Native High-Signal Feeds)

- 当前分支 `feat/native-high-signal-sources` 基于最新 `master` 创建。
- 目标：接入首批 4 个官方原生直出 RSS/Atom 信号源（极客公园、Lil'Log、Simon Willison、触乐网），以 0 Vercel RSSHub 负载提供高品质图文全文与双语精读深度内容。
- 交付内容：
  1. `server/api/src/ingestion/feed.ts` 升级统一支持 RSS 2.0 与 Atom 1.0 标准。
  2. `@rss-site/signals` 注册 4 个官方直连源及错峰定时策略。
  3. 创建 Supabase 迁移更新四表 CHECK 约束。
  4. 补充全套单测与类型声明，执行生产准入验证门。
- 开发记录：`docs/development/native-high-signal-sources.md`。
- 下一步：升级 Feed 解析器并补全 Atom 单测。

## 2026-09-25 双语段落对照阅读与本地稍后读/历史足迹 (P1 实施)

- 当前分支 `feat/bilingual-and-reading-list` 基于 `feat/ui-ux-pro-max-polish` 创建。
- 目标：落实路线图 P1（双语段落穿插对照阅读模式、零后端负担的「稍后读」与「历史足迹」）。
- 交付内容：
  1. `ArticleTranslation` 与 `EventTranslation` 升级为「原文 / 双语对照 / 仅译文」三态切换，正文块级段落精准穿插排版。
  2. 原生 `localStorage` 零后端负担存储与响应式 Hook（书签收藏、LRU 100 历史记录）。
  3. 新增 `/reading-list` 专属管理页面及双标签视图。
  4. 全局导航 `SiteHeader` 与详情页 `ArticleReader` 联动收藏状态与已读标记。
- 路线图与开发记录：`docs/roadmaps/bilingual-and-reading-list.md` 与 `docs/development/bilingual-and-reading-list.md`。
- 下一步：实现客户端存储模块、升级双语段落组件、新增阅读列表页面并补充完整测试。

## 2026-09-25 UI/UX Pro Max 视觉重构与体验优化 (Modern Swiss-Editorial UI Polish)

- 当前分支 `feat/ui-ux-pro-max-polish` 从 `origin/master` 创建；采用 `ui-ux-pro-max-skill` 设计智能对全站核心 UI 进行现代极简报刊风（Modern Swiss-Editorial）重构。
- 覆盖交付表面：全局框架（SiteHeader、SiteShell）、首页（HomeDigest）、列表榜单（HotList、SectionLayout、SourceNavigation）、文章阅读器（ArticleReader）及全局主题/微交互（globals.css）。
- 开发记录：`docs/development/ui-ux-pro-max-polish.md`。
- 下一步：逐一实施样式与组件升级，并通过完整测试与类型检查验证。

## 2026-09-25 统一全站缓存与边缘失效 (Unify Cache Policy & Edge Revalidation)

- 当前分支 `feat/unify-cache-policy` 基于 `feat/unify-signal-readers` 创建；已将全站散落的 ISR revalidate 硬编码、HTTP 缓存头与边缘失效路径收拢至统一的配置与解析模块。
- 引入 `apps/web/lib/cache.ts` 集中管理全站 TTL；抽取 `apps/web/lib/revalidate-paths.ts` 纯函数统一失效路径推导。
- 在 `revalidate/route.ts` 中接入 `@rss-site/signals` 校验来源合法性，消除多重特例分支判断。
- 全仓单测 270/270 项全部通过（新增 4 项路径解析纯函数单测），类型检查与 Web 57/57 静态生产构建成功。
- 开发记录：`docs/development/unify-cache-policy.md`。
- 下一步：推送 `feat/unify-cache-policy`，由用户创建并合并 PR；至此四项架构深化优化全部圆满完成。

## 2026-09-25 统一热点与文章读取器 (Unify Hot Items & Article Readers)

- 当前分支 `feat/unify-signal-readers` 基于 `feat/unify-ingestion-pipeline` 创建；已将前端 `apps/web/lib/` 中重复的专区 Feed 查询与数据转换收拢为泛型读取器。
- 引入泛型 `getSectionFeeds` 与 `getSourceFeed`，消除 `hot-feed.ts` 中 150 余行机械重复的 7 组专区模板代码。
- 在 `signal-article.ts` 中通用化为 `getSignalArticle`，并通过 `@rss-site/signals` 动态派生分区。
- 保证全部既有命名函数与类型 100% 兼容。
- 全仓单测 266/266 项全部通过，3 个工作区子包类型检查通过，Web 57/57 静态页面生产构建成功。
- 开发记录：`docs/development/unify-signal-readers.md`。
- 下一步：推送 `feat/unify-signal-readers`，由用户创建并合并 PR；随后继续推进 Candidate 4（统一全站缓存与边缘失效）。

## 2026-09-25 收拢信号采集管线 (Signal Ingestion Pipeline)

- 当前分支 `feat/unify-ingestion-pipeline` 基于 `feat/unify-signal-registry` 创建；已将位于 `server/api/src/technology/` 下的历史浅模块重组为高内聚的深管道模块 `server/api/src/ingestion/`。
- 将网络截断防护、Feed 泛化解析、快照比对、事务入库和边缘失效广播收拢至 `runIngestionPipeline` 高阶协调器。
- `server/api/src/index.ts` 胶水代码由 50 余行大幅削减，直接接入深模块。
- 保持向后兼容导出与 MCP 协议接口不变。
- 全仓单测 265/265 项全部通过（新增 5 项 pipeline 协调器与流式截断防护单测），类型检查与 Web 57/57 静态生产构建通过。
- 开发记录：`docs/development/unify-ingestion-pipeline.md`。
- 下一步：推送 `feat/unify-ingestion-pipeline`，由用户创建并合并 PR；随后继续推进 Candidate 3（统一热点与文章读取器）。

## 2026-09-25 统一信号源注册中心 (Unify Signal Source Registry)

- 当前分支 `feat/unify-signal-registry` 从最新 `origin/master` 创建；已将分散在前后端 8 个浅模块中的 37 个信号源及 7 大专区元数据收拢为单一深模块 `@rss-site/signals`。
- 全字段统一并置：基础标识、前端展示、采集配置、调度任务；提供紧凑查询接口并消除跨端配置漂移。
- 保证 MCP 接口完全兼容，11 项 MCP 回归测试全部通过。
- 全仓单测 260/260 项通过，3 个工作区子包类型检查通过，Web 端 57/57 静态页面生产构建成功。
- 开发记录：`docs/development/unify-signal-registry.md`。
- 下一步：推送 `feat/unify-signal-registry` 分支，由用户创建并合并指向 `master` 的 PR；随后推进架构优化第二项（收拢信号采集管线）。

## 2026-09-15 Cloudflare Worker MCP 新闻服务与 Web 接入页面

- 当前分支 `feat/fix-home-loading-boundary`；在 Cloudflare Worker API (`server/api`) 中实现 MCP (Model Context Protocol) 规范接口。
- 支持 `get_news` 工具，支持按 `platform` 平台/分类筛选，不传参数默认返回最新的 100 条全平台热点新闻。
- 前端 (`apps/web`) 推出 `/mcp` 专属接入指南页面，包含端点一键复制、主流 AI 客户端（Codex CLI、Claude Code、Cursor、Windsurf、Claude Desktop）终端命令行一键安装与配置卡片及平台列表。
- 开发记录：`docs/development/mcp-news-service.md`。

## 2026-09-15 隔离首页列表加载边界与修复 ChatGPT sourceKey 冲突

- 当前分支 `feat/fix-home-loading-boundary` 基于最新 `origin/master`；修复从首页或路由跳转进入文章详情页时显示首页“今日热点”列表骨架的问题。
- 将首页 `page.tsx`、`loading.tsx` 及 `page.test.tsx` 移入 `(home)` 路由组，公开 URL 保持 `/` 不变，彻底消除根级 loading 对下层子路由（六栏目详情等）的祖先边界泄露。
- 排查并修复 ChatGPT 产品更新日志无数据问题：RSSHub 抓取正常（211 条）；根因是 `feed.ts` 中 `canonicalWebUrl` 抹除 GUID 哈希锚点导致 20 条日志生成相同 `sourceKey`，触发 PostgreSQL `ON CONFLICT DO UPDATE` 重复冲突回滚。新增 `canonicalSourceKey` 严格保留 Hash 锚点。
- 全仓 API 67/67、Web 160/160 测试、双方类型检查、修改范围 Biome 与 55/55 页面生产构建通过；开发记录：`docs/development/fix-home-loading-boundary.md` 与 `docs/development/chatgpt-ai-events.md`。

- 修正分支 `feat/skills-leaderboard-views` 基于最新 `origin/master`：原实现误把 `trending` 标为“最热门”、把小时级 `hot` 标为“增长最快”。
- 正确映射为“最热门”=`all-time`、“增长最快”=`trending`（24h）；RSSHub 同步补充 `all-time` 视图，本站移除 `skills-hot`。
- 用户确认两个来源每六小时更新；新增独立 `skills` section，避免混入科技文章列表。
- 页面复用现有设计系统与 React Aria Tabs；开发记录：`docs/development/skills-leaderboards.md`。
- RSSHub 与站点测试、类型检查通过；下一步推送两个分支，由现有 MR/CI 自动部署，再按生产门禁替换线上数据与 Cron。

## 2026-09-13 ChatGPT AI 事件来源

- 当前分支 `feat/chatgpt-ai-events` 基于最新 `origin/master`；新增 ChatGPT 更新日志来源，同时保留 OpenAI 综合新闻。
- 用户确认 `/ai/events` 不再包含 OpenAI 综合新闻生成的自动事件；ChatGPT、其他 AI 来源和人工事件保持对应行为。
- 真实 RSSHub Feed 已无凭据返回 HTTP 200；开发记录：`docs/development/chatgpt-ai-events.md`。
- API/Web 测试、类型和生产构建已通过；按用户要求跳过后续 UI 检查。
- SQL 与最终差异自审完成；本机 Docker 引擎不可用，pgTAP 与生产数据门禁留待部署环境执行。
- 下一步提交并推送分支，由用户按仓库规则创建并合并 PR。

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

## 2026-10-04 Workbox cache

- Branch: feat/workbox-cache, based on user-confirmed current origin/master 25ab02d.
- Objective: production SW registration, public HTML fallback, bounded static cache, self-hosted Workbox.
- Document: docs/development/workbox-cache.md.
- Verification: 342 tests, Web types/Biome, 62-page real-data production build, generated SW and real Chrome offline/update checks passed.
- Local Next production homepage registers SW and reloads offline; 13 static assets cached. Linux standalone launch remains CI/deployment validation (Windows generated links returned EPERM).
- Review complete; no accepted implementation follow-ups. No production deployment.
- Feature commit 41e855b published to origin/feat/workbox-cache.
- User explicitly requested direct master integration on 2026-10-04, overriding the usual owner-created PR workflow.
- Local master fast-forwarded to 638c8fd; merged-version regression passed (342 tests and real Chrome SW/offline/update smoke).
- Main checkout dependencies installed from verified offline cache; Web types, changed-file Biome and SW generation passed.
- Next: push master when GitHub TLS connectivity recovers, then verify the remote head. No production deployment requested.
