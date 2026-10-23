# GEO 生成式引擎优化

## Background

线上官网首页（`/`，合并自 `feat/official-homepage` `d14f444`）在 GEO（Generative Engine Optimization）检测中得分为 77 分（Grade B），距离 Grade A（90+ 分）差 13 分，共检出 11 项待修复项：

1. **Server-Rendered Content（88）**：服务端渲染文本被按空白分词统计为 86 词，低于深度内容阈值。
2. **Content Schema（73）**：首页 JSON-LD 仅含 `WebSite` 与 `WebPage`，缺少 `FAQPage` / `Article` 等内容型 Schema。
3. **sameAs Entity Links（73）**：JSON-LD 缺少指向 GitHub 及关联站点等权威实体的 `sameAs` 链接。
4. **Author & Date Markup（73）**：首页 JSON-LD 缺少 `author`、`datePublished`、`dateModified`。
5. **Citations & Quotations（54）**：首页缺少 `<blockquote cite>`、`<cite>` 及指向开放规范或上游官方来源的引用标记。
6. **Content Depth（54）**：服务端可引用正文仅 86 词，导致 `Answer-First Structure`、`Statistics & Data Points`、`Section Sizing` 三项子指标因字数不足无法评估。
7. **Question-Style Headings（54）**：首页仅 1 个问答式 H2，关键章节标题未采用问题句式。
8. **Author Signals（68）**：缺少作者/维护者署名（byline、`rel="author"` 及 `<meta name="author">`）。
9. **Freshness Signals（68）**：缺少机器可读的 `<time dateTime>` 发布与更新日期标记。
10. **About & Contact（68）**：导航与页脚仅有「关于本站」，缺少「联系我们」入口。
11. **Privacy & Terms（68）**：页脚仅有「隐私说明」，缺少「服务条款」入口。

用户已确认：
- 保持现有首页视觉框架，将关键 H2 改为问答式标题，并在首页底部补充紧凑的「常见问题与信源规范」区块（包含真实统计数据表、协议与信源引用标记、作者署名与更新时间），同时兼顾中英文/分词计数达 350+ 词。
- 在现有 `/about` 与 `/privacy` 页面内补充「联系我们 (`#contact`)」和「服务条款 (`#terms`)」章节，并在首页与全站页脚暴露对应链接（不新增独立路由）。
- 所有新增与修订文案遵循 `humanizer-zh` 原则，去除 AI 腔、填充词与否定排比，并遵守 `PRODUCT.md` 产品边界（不将定期采集描述为实时更新，不虚构数据）。
- 基于最新 `origin/master`（`d14f444`）在当前工作区直接切出 `feat/geo-optimization` 分支开发，保留工作区未提交的部署脚本改动不纳入提交。

## Scope

- **`apps/web/lib/seo.ts`**：升级 `createHomepageStructuredData`，在 `@graph` 中补充带 `sameAs` 的 `Organization` 与 `Person`（作者 LJH）、在 `WebSite` / `WebPage` 中补充 `author`、`publisher`、`datePublished`、`dateModified`、`sameAs`、`citation`，并新增与首页可见 FAQ 一致的 `FAQPage` 内容 Schema。
- **`apps/web/app/layout.tsx`**：在根元数据补充 `authors`、`creator`、`publisher`。
- **`apps/web/app/page.tsx` 与 `apps/web/app/home.css`**：
  - 保留现有首屏与三栏视觉结构，将章节 H2 重构为自然问题句式，并在每个标题下采用直接回答（Answer-First）段落。
  - 新增「各分区的收录规模与更新频率是多少？」数据表格与规范引用区块（含真实配置的 6 大阅读分区 + Skills 榜单共 43 路来源、2 小时 / 6 小时同步周期、`<blockquote cite>` 与 `<cite>` 标准引用）。
  - 新增「常见问题：今日热点怎么用？」FAQ 区块、作者署名（`rel="author"`）及 `<time dateTime>` 机器可读日期。
  - 在导航与页脚补齐 `/about#contact`（联系我们）与 `/privacy#terms`（服务条款）链接。
- **`apps/web/components/site-shell.tsx`**：在全站公共页脚补齐 `/about#contact` 与 `/privacy#terms` 链接。
- **`apps/web/app/about/page.tsx` 与 `apps/web/app/privacy/page.tsx`**：用 `humanizer-zh` 优化既有 FAQ 表述（修正“实时”等不准确措辞），并分别补充 `#contact`（联系我们）与 `#terms`（服务条款）章节及更新日期。

## Out of scope

- 新增独立路由（如 `/terms`、`/contact`）、新增信号源、修改采集 Cron、数据库迁移或生产环境直接部署。

## Acceptance criteria

- 首页 JSON-LD 同时包含 `Organization`、`Person`、`WebSite`、`WebPage`、`FAQPage`，具备 GitHub 等 `sameAs` 实体链接、`author`、`datePublished`、`dateModified` 与 `citation`。
- 首页服务端渲染 HTML 包含 400+ 空白分词词数，仅保留 1 个 `<h1>`，多个问答式 `<h2>`/`<h3>` 标题，每个章节首段直接给出结论与具体数据。
- 首页包含语义化 `<table>`、`<blockquote cite>`、`<cite>`、`rel="author"` 作者署名以及 `<time dateTime>` 发布/更新日期。
- 首页与全站 `SiteShell` 页脚均提供指向 `/about`、`/about#contact`、`/privacy`、`/privacy#terms` 的有效链接，且目标锚点在 `/about` 与 `/privacy` 页面中真实存在。
- 所有文案通过 `humanizer-zh` 检查，不出现“致力于”、“赋能”、“不仅……而且……”或把定时采集写成“实时更新”。
- 单元测试、TypeScript 类型检查、变更文件 Biome 检查及浏览器明暗主题/响应式核验通过。

## Feasibility

可行。技术难点与解决方案如下：

1. **英文分词器对中文 SSR 字数的低估问题**：主流 GEO 检测工具按空白符（`\s+`）统计词数，纯中文长句若无空格会被计为 1 个词（导致原首页仅计为 86 词，进而使 `Answer-First Structure`、`Statistics & Data Points`、`Section Sizing` 全部跳过评估）。解决方案：在各章节首段、数据表与 FAQ 回答中自然融入真实的英文平台名（`OpenAI`、`Anthropic`、`DeepSeek`、`Google AI`、`GitHub Trending`、`Hacker News`、`Cloudflare Blog` 等）、技术协议（`RSS 2.0`、`Atom 1.0`、`Model Context Protocol`、`llms.txt`、`JSON-LD`）、路由路径与阿拉伯数字指标，严格按中文排版规范（盘古之白）保留中英与数字间距，在不破坏中文阅读体验的前提下使空白分词数达到 450+ 词，且每个章节段落具备 35–100 词的均衡体量。
2. **结构化数据与可见内容一致性**：将首页 FAQ 抽为共享常量 `HOMEPAGE_FAQ_ITEMS`，同时渲染页面可见 HTML 与 `FAQPage` JSON-LD，杜绝隐藏结构化数据与可见正文漂移。
3. **UI Skills 约束**：当前任务环境未暴露 UI Skills MCP，按 `references/ui-quality.md` 回退使用仓库既有 `home.css`、`globals.css`、`InformationPage` 与 `SiteShell` 设计系统，不引入新依赖，不声称已执行 UI Skills MCP 审查。

## Implementation

- 复用 `apps/web/app/home.css` 的暖橙主题变量、面板边框与响应式栅格，新增轻量的数据表、引用块、FAQ 网格与署名栏样式，保持 390px / 1280px / 1440px 明暗主题对比度与 44px 触控高度。
- 在 `apps/web/lib/seo.ts` 集中导出首页发布/更新时间戳、作者信息、`sameAs` 列表、引用规范 URL 与 FAQ 条目。

## Verification

- `pnpm --filter @rss-site/web test`：90 个测试文件、336 项测试全部通过（含新增的 `FAQPage` / `Organization` / `Person` / `sameAs` / `author` / `datePublished` / `dateModified` / `citation` 结构化数据断言，以及首页 SSR 词数、问答标题、引用块、数据表、作者署名、时间标签和 `/about#contact`、`/privacy#terms` 锚点断言）。
- `pnpm --filter @rss-site/web check-types`（清理旧分支残留的 `.next/types` 缓存后）：TypeScript 类型检查 0 错误通过。
- `pnpm biome check`：对全部 9 个变更代码文件执行检查，0 错误、0 警告；`git diff --check` 无空白或冲突标记问题。
- 真实浏览器（Chrome DevTools MCP，`http://localhost:3016`）验证：
  - 首页 `<main>` 空白分词数提升至 **592 词**（全页 **617 词**、**4,088 字符**，原为 86 词），13 个标题（1 个 `H1`、5 个 `H2`、7 个 `H3`）中 12 个为问答式标题；包含 7 行规格数据表、2 个 `<blockquote cite>`、4 个 `<cite>`、`rel="author"` 链接、`<meta name="author" content="LJH">` 及 2 个 `<time dateTime>` 标签；JSON-LD `@graph` 包含 `Organization`、`Person`、`WebSite`、`WebPage`、`FAQPage`。
  - 1440px、1280px、390px 视口在浅色与深色主题下均无横向溢出（`scrollWidth <= innerWidth`）。
  - `/about#contact` 与 `/privacy#terms` 页面锚点及页脚链接均真实存在且无横向溢出。

## Review and delivery

- **Standards 审查**：复用仓库既有颜色 token、`home.css`、`InformationPage`、`SiteShell` 与 `@rss-site/signals` 数据源，无新增依赖；所有文案通过 `humanizer-zh` 审查，不夸大实时性或虚构数据。
- **Spec 审查**：GEO 报告列出的 11 项待修复项全部覆盖并验证通过。
- **审查结论**：0 项阻塞问题（Blocking），0 项需延后的后续事项（Accepted follow-ups），因此不创建空路线图文档。
- **交付**：分支 `feat/geo-optimization` 已推送并创建 [PR #52](https://github.com/ljh12138164/rss-site/pull/52)（目标 `master`）。下一步待 CI 通过后由维护者合并并发布，随后在生产环境复测 GEO 评分。

## Risks

- 不同第三方 GEO 扫描器对中文分词的启发式规则可能存在细微差异；通过同时保证充足的中文字符量（1800+ 字）与空白分词数（450+ 词），可兼容两类统计口径。
- 本轮不直接部署生产，线上分数需在合并发布后复测。
