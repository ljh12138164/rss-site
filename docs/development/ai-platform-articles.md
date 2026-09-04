# AI 平台官方文章分区

## Background

在科技与国内新闻十二路信号之外，新增一个只收录 AI 平台官方发布内容的独立分区。来源调研与在线抓取结果记录在
[`docs/research/ai-platform-official-article-sources.md`](../research/ai-platform-official-article-sources.md)。

本功能分支 `feat/ai-platform-articles` 叠加在尚未合并的 `feat/technology-hot-sources` 上，因为它复用该分支已经完成的通用来源注册、按分区存储、批量查询与信号台页面组件。RSSHub 的 DeepSeek 修复在相邻仓库
`D:\code\rss` 的 `feat/fix-deepseek-news` 分支单独交付。

## Scope

- 新增 `/ai` 总览与 `/ai/[source]` 六个来源详情页。
- 首页新增“03 / AI 平台”，每个平台只展示一条最新信号。
- 首批来源为 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini 与 Qwen。
- OpenAI、Anthropic、DeepSeek、Qwen 使用已确认的 RSSHub 路由；GLM 与 Google AI 使用官方 RSS。
- 通用采集器支持代码内静态声明的 RSSHub 路径或官方完整 Feed URL。
- 为 GLM 官方 Feed 从 `content:encoded` 的首个 `<strong>` 提取发布标题，提取失败时保留原始标题。
- 新增六个错峰的五小时 Cron，并扩展数据库来源/分区组合约束。

## Out of scope

- Meta AI、Mistral、xAI 及其他第二批来源。
- 跨平台热度评分、推荐排序、翻译、搜索、收藏或用户订阅。
- 接受客户端传入任意 Feed URL；完整 URL 只能来自源码白名单，避免 SSRF。
- 自动部署 RSSHub 或 rss-site、修改生产数据库、创建生产 Cron 或写入密钥。

## Acceptance criteria

- `/ai` 展示六路来源的前三条，详情页展示该来源完整列表，未知或跨分区来源返回 404。
- 单一来源为空或失败时只显示该来源的局部状态，不影响其他来源。
- OpenAI、Anthropic、DeepSeek 与 Qwen 通过自建 RSSHub 抓取；GLM 与 Google AI 只访问注册表中的固定官方 URL。
- DeepSeek Feed 只返回 `/zh-cn/news/news...` 新闻，不能再把 `/zh-cn/guides/` 指南当新闻。
- GLM 条目优先显示正文首个加粗模型/产品名，无法提取时使用 RSS 标题。
- 数据库只接受六个 AI 来源和正确的 `ai` 分区组合；现有 RLS 权限不放宽。
- 18 个来源保持五小时节奏并分三组错峰；每个任务独立调用通用采集入口。
- 1440px 与 390px、明暗主题、键盘焦点、无横向溢出和控制台无错误通过验收。
- 格式、lint、TypeScript、Vitest 与生产构建通过；pgTAP 在本地数据库可用时通过。

## Feasibility

- 六个来源均已在线验证可返回 RSS；不需要 Cookie、浏览器自动化或新密钥。
- GLM 和 Google AI 的完整 URL 是注册表常量，不从请求参数拼接；采集入口仍只接受来源 ID。
- DeepSeek 站点根页只暴露最新新闻入口，而最新新闻页的侧栏包含完整新闻列表，因此路由需要先定位最新新闻页再解析侧栏。
- GLM Feed 的 `<title>` 仅为日期，但 `content:encoded` 首个 `<strong>` 含模型或产品名，可做显式来源级规范化。
- Supabase 当前 Cron 文档仍要求通过 `cron.schedule` 创建任务；最近相关 breaking change 是禁止直接写 `cron.job`，现有仓库模式符合要求。
- UI Skills MCP 注册表仍未在当前环境暴露，因此不声明其审查结果；继续以已确认的 `frontend-design` 方向、现有设计 token 与 UI 质量清单验收。

## Implementation

- API 来源注册表增加 `aiSources`，每项只允许二选一的 `rsshubPath` 或 `feedUrl`，并可声明 `titleFromFirstStrong`。
- 通用 Feed 解析器支持 RSS 2.0 的 `content:encoded`；仅在来源显式启用时提取首个 `<strong>` 作为标题。
- Web 复用 `SourceFrequencyStrip`、`SourceBand` 与 `SourceDetailView`，把基础路径扩展为 `/ai`，保持平面信号台视觉与 React Aria 交互边界。
- Cron 第三组使用 UTC 小时 `2,7,12,17,22`，六个来源按 0、10、20、30、40、50 分钟错峰。
- 数据库迁移继续修改当前未合并的扩展迁移，使来源白名单与分区组合一次到位，不创建重叠迁移。

## Verification

已完成：

- API Vitest 38 项、Web Vitest 26 项全部通过；Biome format/lint、两个包 TypeScript 检查与生产构建通过。
- 生产构建包含 `/ai` 与 `/ai/[source]`；本地生产服务器复核 `/ai`、`/ai/openai` 为 200，`/ai/nope` 与跨分区 `/ai/github` 为 404。
- 使用当前采集解析器在线读取五个可直接部署的 Feed：OpenAI 20、Anthropic 10、GLM 15、Google AI 20、Qwen 37 条，均为 HTTP 200；GLM 首条标题正确归一化为 `GLM-5.3-Flash`。
- `D:\code\rss` 中修复后的 DeepSeek handler 在线返回 17 条，首条 URL 为 `/zh-cn/news/news260821`，没有指南 URL；对应 2 项单元测试、TypeScript、oxlint、ESLint 与格式检查通过。
- 浏览器在 1440px 与 390px、浅色与深色下复核 AI 总览和 OpenAI 详情；频段条在移动端为 3×2，无横向溢出，键盘焦点为可见信号橙描边，控制台无 warning/error。
- `supabase test db` 仍因本机 `127.0.0.1:54322` 无本地 Docker 数据库而不能运行；pgTAP 已扩展为 24 项，未使用生产数据库替代验证。
- RSSHub 首次安装依赖时，两个老旧可选原生模块在 Node 24 下编译失败，但 pnpm 完成安装且目标测试、类型检查和 lint 均可运行；未为此改动依赖。

## Review

- Standards：来源 ID 是唯一外部输入，完整 Feed URL 只存在于服务端注册表；客户端没有新秘密，RLS 权限未放宽，Cron 继续通过 `cron.schedule` 管理。未发现阻塞项。
- Spec：六来源、首页摘要、总览/详情、局部空/错状态、外链返回、真实 404、GLM 标题与 DeepSeek 语义修复均有测试或现场验证覆盖。未发现阻塞项。
- Rejected：不把 Meta AI 加入首批，也不为任意用户 URL 建立通用代理；前者超出已确认范围，后者扩大 SSRF 面。
- Accepted follow-ups：部署顺序与上线后的真实采集复核记录在 [AI 平台文章 roadmap](../roadmaps/ai-platform-articles.md)；跨注册表防漂移继续沿用既有科技来源 roadmap，不重复建项。

## Risks

- RSSHub 抓取路由会受上游 DOM 变化影响；失败必须保留最后一次成功数据并只标记单源失败。
- 官方 RSS 也可能调整字段；GLM 标题规范化必须有原始标题回退。
- 此分支依赖 `feat/technology-hot-sources`，合并前需先合并或重放该基线。
- 迁移、Cron 与代码必须按“代码先部署、再迁移和配置任务”的顺序上线。
