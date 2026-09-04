# 科技多来源热点与 React Aria 迁移

## Background

现有站点只展示掘金周榜。用户已确认把科技区扩展为多来源信号台，并将可交互组件从
shadcn/Radix 的现成视觉逐步迁移到 React Aria，同时保留现有 Tailwind 语义色与明暗主题。

本期来源为 GitHub Trending、Hacker News、掘金、V2EX、IT之家和 36氪。RSSHub 自建实例已实时
验证六条路由，其中 GitHub 在配置 `GITHUB_ACCESS_TOKEN` 后可返回有效 RSS。

## Scope

- 首页改为六来源摘要入口，不构造跨平台综合排名。
- 新增 `/technology` 科技总览。
- 使用 `/technology/[source]` 承载六个来源的完整榜单；保留 `/technology/juejin` URL。
- `/out` 保持受控离站职责，返回入口改为科技总览。
- 建立来源注册表、通用 RSS 解析与通用 Drizzle 存储。
- 新增受保护的按来源采集入口，并保留 `/cron/juejin` 兼容入口。
- 扩展 Supabase 约束、RLS 测试和错峰五小时 Cron。
- 引入 `react-aria-components`，仅用于 Button、Tooltip 及后续复杂交互；内容结构继续使用语义 HTML。

## Out of scope

- Product Hunt、少数派、InfoQ 及其他未确认来源。
- 搜索、收藏、个性化排序、跨来源评分和历史趋势。
- 管理后台、用户登录、自动翻译。
- 本 PR 内执行生产部署或写入任何密钥。
- 全量替换所有现有组件或引入 React Aria 示例主题。

## Acceptance criteria

- 首页能看到六个来源各自的一条热点与更新时间，并可进入科技总览。
- `/technology` 以来源频段条和六个独立来源带展示每源前三条热点。
- 六个来源详情 URL 展示各自完整榜单，未知来源返回 404。
- 单一来源为空或读取失败时不影响其他来源。
- 热点链接继续通过 `/out?url=...`，离站页返回 `/technology`。
- 数据库只接受已确认的科技来源与 `http`/`https` URL；匿名权限保持只读。
- 采集失败不清除该来源最后一次成功数据，各来源运行记录相互隔离。
- 新 Cron 错峰触发六个来源；旧掘金入口在切换期间继续工作。
- React Aria 交互组件支持键盘、触摸、可见焦点和中文辅助文本。
- 1440px、390px、浅色和深色界面通过视觉验收，无横向溢出。
- Biome、TypeScript、Vitest 和生产构建通过。

## Feasibility

结论：可行。前置条件均已满足：PR #4 已合并到 `origin/master`，UI 路由与视觉方向已确认，
React Aria 已获明确批准，GitHub Trending RSS 已恢复为 200。

- 当前表结构本身已按 `source` 分区，但首个迁移中的检查约束只允许 `juejin`，需要追加迁移放宽为
  六来源白名单，并把 URL 约束改为 Web 协议约束。
- RSSHub 各来源的条目字段都能落入现有标题、链接、摘要、作者、时间和位置模型；Hacker News 会指向
  外部原文域名，因此不能用来源域名作为数据库 URL 约束。
- 冷请求曾达到约 10–25 秒，不能把所有抓取串成一个 Cron 请求；使用按来源端点和分钟错峰降低超时与
  上游突发压力。
- 首页必须通过批量查询获取所有来源，避免为六个来源生成十二次 Supabase 请求。
- UI Skills MCP 注册表未在当前环境暴露，因此不声明完成 UI Skills 审查；使用已确认的
  `frontend-design` 方案、仓库现有语义 token 和 UI 质量约束作为替代基线。

## Implementation

- 分支：`feat/technology-hot-sources`，基线：PR #4 合并提交 `499dbdf`。
- 来源顺序固定为 GitHub、Hacker News、掘金、V2EX、IT之家、36氪；这是从代码信号到社区与行业信号
  的阅读顺序，不表示跨平台名次。
- 来源注册表同时提供数据库 ID、URL slug、RSSHub 路径、展示名和简短说明。
- 视觉沿用 `#f7f9fc` 背景、`#1e293b` 正文、`#e4572e` 信号橙、`#d9e1ea` 分隔线和现有深色 token。
- 页面保持平面层级，不使用卡片墙、渐变、发光或装饰性动画；唯一签名元素是可导航的来源频段条。
- React Aria 只形成小型 client islands；数据查询、榜单、SEO 和面包屑继续是 Server Components。
- 旧 `/cron/juejin` 映射到通用 `juejin` 采集，避免部署与 Cron 重配之间出现空窗。
- API 使用受分区约束的 `signalSources` 白名单选择 RSSHub 路径，并以 30 秒上游超时独立执行；科技 Cron
  每隔 10 分钟触发一个来源，数据库 HTTP 请求上限为 45 秒。后续新闻分区复用同一采集边界，详见
  [中国国内新闻来源](./domestic-news-sources.md)。
- `supabase migration new expand_technology_sources` 生成迁移
  `20260904170915_expand_technology_sources.sql`；迁移只扩展来源与 Web URL 检查，不改变既有 RLS。
- 前端以两次 Supabase 批量读取取得所有条目和状态，再按来源分组、排序和裁剪，避免首页或总览产生
  12 次请求。
- React Aria Components 固定为 `1.17.0`；主题按钮使用其 Button、Tooltip 与中文 I18nProvider。
  静态链接、面包屑、状态标签、分隔线和骨架继续使用语义 HTML，并移除不再使用的 Radix、CVA 与
  shadcn 配置。
- 未知来源由 `proxy.ts` 在流式渲染前校验白名单并重写到统一 404 页面，保证响应状态为 404；详情页仍保留
  运行时校验，六个已知参数按请求动态读取数据。

## Verification

已完成：

- 合并新闻分区后的最终验证为 API Vitest 33 项、Web Vitest 22 项通过。
- `pnpm check-types` 与 `pnpm build` 通过；Next.js 16.3.4 成功构建 `/`、`/out`、`/technology`、
  `/technology/[source]`、`/news` 和 `/news/[source]`。
- 直接以当前通用解析器读取自建 RSSHub 六条线上公开 RSS：GitHub 20、Hacker News 30、掘金 20、
  V2EX 9、IT之家 12、36氪 8 条，全部解析成功。
- 浏览器验收覆盖首页、总览、掘金详情和未知来源 404；1440px 为两列、390px 为一列且频段条为
  3×2。两种主题无横向溢出，键盘焦点呈信号橙描边，控制台无 warning/error。
- 生产服务器状态码复核：`/technology/github` 返回 200，`/technology/nope` 返回 404 且保留统一站内
  404 内容。
- Supabase 当前官方 Cron、Vault、RLS 与 breaking-change 摘要已复核；现有 `cron.schedule`、
  `vault.decrypted_secrets` 和客户端只读 RLS 模式仍适用。
- 本机 Docker Desktop 未运行，因此 `supabase test db` 无法连接本地容器；pgTAP 已扩展为 21 项，
  需由 CI 或有 Docker 的环境执行。这不以线上数据库代测，避免违反本 PR 的生产变更边界。

## Review

- Standards：来源端点先做常量时间鉴权再校验白名单；前端未暴露服务端密钥；公开表继续只授予
  `select`，写入和内部运行记录仍不可由 `anon`/`authenticated` 访问。无未解决阻塞项。
- Spec：审查发现两个阻塞项——未知动态参数需确定返回 404、手动 Cron 备用脚本需包含历史清理；
  已分别用请求入口白名单重写与补充 retention job 解决并复核。
- Rejected：不建立跨来源综合排名，也不把静态内容包装成 React Aria 组件；两者都违背已确认范围。
- Accepted follow-ups：来源契约防漂移与生产运行质量观察已进入
  [科技多来源热点 roadmap](../roadmaps/technology-hot-sources.md)。

## Risks

- RSSHub 页面抓取路由会随上游结构变化；每个来源失败必须局部化并保留最后成功快照。
- GitHub Trending 依赖 RSSHub 服务端令牌；令牌不得进入本站仓库、前端或数据库。
- 新迁移和 Cron 只有在代码部署后才可应用；本 PR 不自动修改生产状态。
- React Aria 若被用于纯静态结构会扩大客户端边界，实施时限制到确有交互语义的组件。
- Web 与 API 当前各自保留一份面向自身职责的来源元数据，数据库白名单又是 SQL 表达；当前由测试
  和评审同步，后续应建立可验证的统一契约。
