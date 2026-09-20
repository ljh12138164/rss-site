# 全站 SEO 优化

## Background

2026-09-20 对 `https://news.ljhboard.cn/` 做了完整 SEO 审计。线上页面可被抓取，HTTPS、canonical、SSR、robots、IndexNow 和移动端结构正常；主要缺口是 sitemap 响应过大且慢、普通文章没有结构化数据、首页和列表页缺少社交元数据、`llms.txt` 缺失，以及部分薄内容仍可索引。

当前分支 `feat/ui-update` 已有未提交的首页与导航改版。线上仍是旧首页，所以视觉结论只作为部署后复核项。本次只做与 SEO 直接相关、可独立验证的补丁，不改现有 UI 设计，不提交或推送分支。

## Scope

- 统一 canonical、Open Graph、Twitter 和 meta description 生成。
- 为首页输出真实的 WebSite 与 CollectionPage JSON-LD。
- 为普通文章输出 Article/NewsArticle/TechArticle 与 BreadcrumbList JSON-LD，并保留原始来源 URL。
- 将 `content_updated_at` 用于文章 `dateModified` 与 sitemap `lastmod`。
- 将 sitemap 缩小为 5,000 URL 分片，增加 CDN 缓存并补入 `/mcp`。
- 提供 `llms.txt`，列出主要栏目、AI 时间轴、说明页和 RSS。
- 增加不依赖第三方脚本 nonce 的基础安全响应头。

## Out of scope

- 不用字数阈值批量 noindex；需要先持久化内容质量状态，避免 sitemap 为判断质量读取数千篇正文。
- 不虚构运营主体、作者、publisher、联系方式、社交账号或文章图片。
- 不在本轮加入 CSP；当前 GA、Umami、AdSense 和 Next 内联资源需要先设计 nonce/来源策略。
- 不部署、不推送、不创建或合并 PR。

## Acceptance criteria

- 首页、六个栏目及其来源页输出各自正确的 canonical、Open Graph 与 Twitter 文本元数据。
- 首页服务端 HTML 包含 WebSite 和 CollectionPage JSON-LD。
- 普通文章服务端 HTML 包含来源可追溯的文章与面包屑 JSON-LD。
- sitemap 根在 5,000 篇以上返回 sitemap index；响应可由共享缓存复用；`/mcp` 被收录；文章更新使用 `content_updated_at`。
- `/llms.txt` 在配置 `SITE_URL` 时返回绝对链接，未配置时不输出错误域名。
- 全站响应配置包含 `nosniff`、严格来源 referrer、拒绝 framing 和收敛权限策略。
- 定向测试、Web 全量测试、类型检查、修改范围格式检查与生产构建通过。

## Feasibility

可行。现有 Next App Router 已服务端渲染元数据和正文，`signal_articles.content_updated_at` 已由版本化迁移和触发器维护，无需数据库变更。最大技术风险是现有 sitemap 每次串行读取大量数据；缩小分片并允许边缘缓存可直接降低单次响应工作量。

## Implementation

实施计划：`docs/superpowers/plans/2026-09-20-site-seo-optimization.md`。

已完成：

- 新增统一 SEO 元数据与 JSON-LD 生成器，并应用到首页、栏目、来源、文章、AI 时间轴、GitHub、Skills、MCP、关于和隐私页面。
- 文章结构化数据使用真实来源链接与 `content_updated_at`，同时输出面包屑。
- sitemap 分片从 45,000 缩小到 5,000，增加共享缓存、`/mcp` 和真实更新时间。
- 新增 `/llms.txt`，并配置基础安全响应头。
- 保存被忽略的本地审计基线，并建立后续路线图：`docs/roadmaps/site-seo-optimization.md`。

## Verification

- `pnpm --filter @rss-site/web test`：51 个测试文件、175 项测试通过。
- `pnpm --filter @rss-site/web check-types`：通过。
- `pnpm exec biome check <36 个 SEO 相关文件>`：通过，无需修复。
- `SITE_URL=https://news.ljhboard.cn pnpm --filter @rss-site/web build`：通过，57/57 个静态页面生成完成。
- 构建产物核对：首页含 WebSite、CollectionPage、Open Graph 和 Twitter 元数据；新闻栏目 canonical 正确；`llms.txt` 含 sitemap 与 RSS；404 含 `noindex` 且不含冲突的 `index, follow`。
- `git diff --check`：通过；仅报告工作区既有文件的 CRLF 转 LF 提示，没有空白错误。

## Risks

- 线上首页仍未包含当前工作区的 digest 改版，部署后必须重新做桌面/移动视觉与真实性检查。
- 没有 CrUX 数据；性能分数来自 Lighthouse 波动样本和启发式分析，不能把实验室 TBT 当作 INP。
- 普通文章质量不一致；本轮结构化数据只陈述页面可验证字段，不会解决上游正文缺失。
- 当前改动尚未部署；线上 SEO 表现与结构化数据需要在发布后重新验证。
