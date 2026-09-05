# AI 平台官方文章来源调研

> 调研日期：2026-09-05（Asia/Shanghai）  
> 范围：RSSHub 官方仓库与本地 `D:\code\rss` 源码、平台官方博客/新闻/更新日志，以及公开实例 `https://rss.ljhboard.cn` 的只读 HTTP 实测。没有读取、传输或配置 Cookie、Token、API Key。

## 结论

建议首批覆盖 6 个平台：OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini、Qwen。它们都能落到平台自己发布的内容，而不是媒体转载或搜索聚合；但接入方式不能全部继续假设为 `RSSHUB_BASE_URL + rsshubPath`：智谱和 Google AI 更适合直接消费官方 RSS，DeepSeek 则必须先修复现有 RSSHub 路由的语义回归。

| 平台 | 首批入口 | 内容定位 | 接入判断 |
| --- | --- | --- | --- |
| OpenAI / GPT | RSSHub `/openai/news?limit=20` | OpenAI 官方 News，含 Product、Research、Safety、Engineering 等分类 | 直接接入 |
| Anthropic / Claude | RSSHub `/anthropic/news?limit=20` | Anthropic 官方 Newsroom | 直接接入 |
| DeepSeek | 修复后的 RSSHub `/deepseek/news` | DeepSeek API Docs 官方新闻 | 修复路由后接入；当前返回的不是新闻 |
| 智谱 AI / GLM | 官方 RSS `https://docs.bigmodel.cn/cn/update/new-releases/rss.xml` | 智谱开放平台“最新发布” | 接入官方 RSS，并做标题归一化 |
| Google AI / Gemini | 官方 RSS `https://blog.google/innovation-and-ai/technology/ai/rss/` | Google 官方 AI 文章；包含 Gemini、DeepMind 及 AI 产品动态 | 直接接入官方 RSS |
| Qwen | RSSHub `/qwen/blog/zh-CN` | Qwen 官方博客 | 直接接入；可用官方 RSS 作为降级入口 |

这批来源刻意不加入 AIBase、Google News 或媒体关键词搜索，因为它们不是平台自己发布的文章。服务状态页和 API changelog 也不应混进文章流；它们可在以后单独做“产品更新/服务状态”频道。

## 调研方法与代码基线

- 本地 RSSHub 源码位于 `D:\code\rss`，当前提交为 [`7a622331d1ca613baf4707a8cd6ca16a070aa497`](https://github.com/DIYgod/RSSHub/commit/7a622331d1ca613baf4707a8cd6ca16a070aa497)。对 `lib/routes` 全文检索了 `openai`、`anthropic`、`claude`、`deepseek`、`zhipu`、`glm`、`gemini`、`deepmind`、`qwen`、`meta`、`xai` 与 `mistral`。
- RSSHub 当前文档站的旧分类 URL 已不再稳定返回路由清单，因此路由事实以 [RSSHub 官方仓库](https://github.com/DIYgod/RSSHub) 中的 `Route` 元数据和处理器源码为准，并用本地同源源码交叉核对。
- 实测方法：匿名 GET，不附带自定义 Cookie/Token；记录 HTTP 状态、`Content-Type`、RSS `<item>` 数、耗时和前几条标题。耗时会受到 RSSHub 缓存命中的显著影响，只能作为 2026-09-05 的可运行性快照，不代表 SLA。
- 当前 rss-site 的抓取器只接受 RSS 2.0 `<rss><channel><item>`，而且在 [`server/api/src/index.ts`](../../server/api/src/index.ts) 中固定把来源 path 拼到 `RSSHUB_BASE_URL`。首批要消费官方 RSS 时，需要把来源定义收敛成受信任的绝对 `feedUrl`，或使用 `rsshub-path | absolute-url` 判别类型；不要开放用户可控 URL，以免引入 SSRF 面。

## 逐个平台核对

### OpenAI / GPT

- 推荐路由：`/openai/news?limit=20`。[路由源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/openai/news.ts) 明确标记 `requireConfig: false`、`requirePuppeteer: false`、`antiCrawler: false`。
- RSSHub 先读取 OpenAI 官方 [`https://openai.com/news/rss.xml`](https://openai.com/news/rss.xml)，再抓文章正文；实现见 [`common.tsx`](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/openai/common.tsx)。内容与 [OpenAI News](https://openai.com/news/) 的官方分类一致，不是第三方资讯。
- 公开实例实测为 `200 application/xml`、20 条。两次观测约 1.6 秒与 17.9 秒，说明冷缓存时正文补全成本明显；首批保留 `limit=20`，Cron 不宜高频轮询。
- `/openai/research?limit=20` 也可用，但它从同一官方 RSS 中筛选 `Research`，与 News 会重复；首批不单独设第二个 OpenAI 来源。

### Anthropic / Claude

- 推荐路由：`/anthropic/news?limit=20`。[RSSHub 源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/anthropic/news.ts) 抓取 [Anthropic Newsroom](https://www.anthropic.com/news) 的列表与正文，不读配置、Cookie 或 Token，也不使用 Puppeteer。
- 公开实例实测为 `200 application/xml`、10 条，约 1.6–2.9 秒；标题与 Newsroom 同步。
- 稳定性风险为中等：处理器依赖 Next.js 构建生成的 CSS Module 类名前后缀和 `#main-content`，站点改版后可能空列表或正文缺失。应把“空 Feed”视为该来源失败并告警。
- `/claude/blog?limit=15` 也实测成功（15 条，约 4.4 秒），其 [路由源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/claude/blog.ts) 明确不需要配置、浏览器或反爬处理；但它与 Anthropic News 同属一家且偏产品使用实践，首批只保留 Anthropic News，后续可作为 Claude 专题。
- `/anthropic/research?limit=15` 本次返回 503，不纳入首批；`/anthropic/red` 虽成功但偏红队专题且约 16.5 秒，也不作为综合平台源。

### DeepSeek

- 现有路由 `/deepseek/news` 的 [RSSHub 源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/deepseek/news.ts) 标记 `requireConfig: false`、`requirePuppeteer: false`、`antiCrawler: false`，理论定位是 [DeepSeek API Docs 官方新闻](https://api-docs.deepseek.com/zh-cn)。
- 公开实例虽然返回 `200 application/xml`、11 条、约 0.5–1.0 秒，但内容实测为“图像理解、思考模式、多轮对话、FIM 补全”等指南，`pubDate` 全是 `Invalid Date`，并非官方新闻。原因是处理器依赖 `ul.menu__list > li:nth-child(2)`，而站点侧边栏顺序已经变化。
- 新闻页本身仍可匿名访问。例如当前文章页的侧边栏公开列出 `/zh-cn/news/news260821`、`news260813`、`news260424` 等 17 个新闻链接，[官方更新日志](https://api-docs.deepseek.com/zh-cn/updates/) 也持续发布模型更新。
- 接入建议：先在 `D:\code\rss` 修复 `/deepseek/news`，改为按 `href^="/zh-cn/news/"` 选择链接，并从文章页提取标题、正文和发布日期，不再依赖 `nth-child`。修复后对“链接属于 `/news/`、标题非空、日期可解析”做回归测试，再把该源加入生产 Cron。不能因为 HTTP 200 就视为可用。

### 智谱 AI / GLM

- RSSHub 官方仓库和本地 `lib/routes` 暂无 `zhipu`、`bigmodel` 或 `glm` 专用路由。
- 智谱开放平台的 [最新发布页](https://docs.bigmodel.cn/cn/update/new-releases) 由官方直接提供 RSS：[`https://docs.bigmodel.cn/cn/update/new-releases/rss.xml`](https://docs.bigmodel.cn/cn/update/new-releases/rss.xml)。匿名实测为 `200 application/rss+xml`、15 条、约 0.9 秒，无需 Cookie、Token 或 Puppeteer。
- Feed 的 15/15 个 `<title>` 都只是日期，例如 `2026-08-26`；真正的模型或产品名位于 `content:encoded` 的第一个 `<strong>`，实测可提取 `GLM-5.3-Flash`、`GLM-5.3`、`GLM-5.2`、`GLM Coding Plan 团队版`、`GLM-5.1` 等。
- 接入建议：使用官方 RSS，但为 `glm` 增加小型、显式的标题归一化：优先取正文第一个非空 `<strong>`，取不到则回退原始日期标题。不要把这个特殊规则扩散为所有来源的通用猜测逻辑。
- `https://docs.z.ai/release-notes/new-released` 也是 Z.AI 官方更新页，但没有原生 RSS，页面依赖 Mintlify/Next RSC 数据；既然国内智谱源已有官方 RSS，首批无需再维护第二套页面解析。

### Google AI / Gemini

- 首选 Google 官方 AI RSS：[`https://blog.google/innovation-and-ai/technology/ai/rss/`](https://blog.google/innovation-and-ai/technology/ai/rss/)，其页面入口为 [Google AI](https://blog.google/innovation-and-ai/technology/ai/)。匿名实测 `200 application/xml`、20 条、约 1.0–1.2 秒，无需凭据或浏览器。
- 该 Feed 是 Google AI 综合栏目，不是严格的 Gemini 单一标签；本次 20 条中有 3 条标题直接含 Gemini。它的优势是请求轻、由平台直接发布，适合产品综合源。
- 更偏模型和研究的备选是 Google DeepMind 官方 [`https://deepmind.google/blog/rss.xml`](https://deepmind.google/blog/rss.xml)：匿名实测 `200 text/xml`、100 条，前五条中三条含 Gemini；100 条中 31 条标题含 Gemini。[Google DeepMind News](https://deepmind.google/blog/) 明确是官方突破、项目与更新列表。
- RSSHub 的 `/deepmind/blog` [源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/deepmind/blog.ts) 正是读取上述官方 RSS，再为全部 100 条补抓正文；它不需要配置、Cookie 或 Puppeteer，但没有 `limit`，冷缓存会产生大量上游请求。因此首批优先直接读取 Google AI 官方 RSS，而不是走该 RSSHub 全文路由。
- `/google/developers/en` [源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/google/developers.ts) 本次返回 10 条且速度很快，但它是整个 Google Developers Blog，最近条目并不都与 Gemini 有关，不作为首批 Gemini 主源。

### Qwen

- 推荐路由：`/qwen/blog/zh-CN`。[RSSHub 源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/qwen/blog.ts) 调用 `qwen.ai` 的公开文章 API，明确标记不需要配置、Puppeteer 或反爬处理。
- 公开实例实测 `200 application/xml`、37 条、约 6.4 秒；内容为 Qwen 官方博客。
- 官方旧博客仍提供 [`https://qwenlm.github.io/blog/index.xml`](https://qwenlm.github.io/blog/index.xml)，实测 `200 application/xml`、44 条、约 0.3–1.5 秒；但 [旧博客首页](https://qwenlm.github.io/blog/) 已提示迁移到 `qwen.ai`，因此它只适合作为降级入口，不能假设会持续更新。

## 公开实例与官方 RSS 实测

| 入口 | HTTP / Content-Type | 条目 | 耗时快照 | 语义结果 |
| --- | --- | ---: | ---: | --- |
| `/openai/news?limit=20` | 200 / `application/xml` | 20 | 1.6–17.9s | 正确，OpenAI 官方文章 |
| `/anthropic/news?limit=20` | 200 / `application/xml` | 10 | 1.6–2.9s | 正确，Anthropic Newsroom |
| `/claude/blog?limit=15` | 200 / `application/xml` | 15 | 4.4s | 正确，Claude 产品文章；首批去重 |
| `/deepseek/news` | 200 / `application/xml` | 11 | 0.5–1.0s | **错误：当前为指南，不是新闻** |
| 智谱“最新发布”官方 RSS | 200 / `application/rss+xml` | 15 | 0.9s | 正确，但标题需要从正文归一化 |
| Google AI 官方 RSS | 200 / `application/xml` | 20 | 1.0–1.2s | 正确，Google AI 综合文章 |
| Google DeepMind 官方 RSS | 200 / `text/xml` | 100 | 0.8–2.5s | 正确，模型/研究综合文章 |
| `/deepmind/blog` | 200 / `application/xml` | 100 | 缓存命中约 0.1s | 正确，但冷缓存会补抓 100 篇正文 |
| `/google/developers/en` | 200 / `application/xml` | 10 | 0.1s | 正确，但主题过宽 |
| `/qwen/blog/zh-CN` | 200 / `application/xml` | 37 | 6.4s | 正确，Qwen 官方博客 |
| Qwen 旧博客官方 RSS | 200 / `application/xml` | 44 | 0.3–1.5s | 正确，但站点已迁移 |
| `/meta/ai/blog?limit=20` | 200 / `application/xml` | 20 | 2.2s | 正确，可作第二批 |

## 第二批候选与暂缓项

- **Meta AI / Llama**：RSSHub `/meta/ai/blog?limit=20` 可用，[路由源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/meta/ai-blog.ts) 从 [AI at Meta Blog](https://ai.meta.com/blog/) 页面提取临时令牌后调用 GraphQL。无需用户凭据，但依赖内部 `doc_id`、LSD token 和 GraphQL 结构，稳定性低于首批来源；列为第二批。
- **xAI / Grok**：[xAI News](https://x.ai/news) 内容充足，但 RSSHub 官方仓库与本地源码暂未发现专用路由，也未确认官方 RSS。需要另做页面结构与反爬验证，首批不接。
- **Mistral AI**：[Mistral News](https://mistral.ai/news/) 是高质量官方来源，但 RSSHub 官方仓库与本地源码暂未发现专用路由，也未确认官方 RSS。首批不为扩充数量而新增自维护 scraper。
- **OpenAI Research、Anthropic Engineering、Claude Blog**：都是一手内容，但会使同一公司占多个频段。先实现“一平台一主源”，后续再做可选专题或分类过滤。

## 实施约束与验收建议

1. 新建独立 `ai` section，而不是把平台文章塞进现有“科技热点”；排名代表各官方源的发布时间顺序，不应暗示跨平台热度。
2. 来源定义支持硬编码、受信任的官方绝对 RSS URL，同时保留 RSSHub path；不允许请求参数控制上游 URL。
3. 首批六个平台仍统一最多保存 30 条。OpenAI 使用 `limit=20`；Anthropic 当前实际 10 条；Google AI 和智谱官方 Feed 本身分别为 20 与 15 条。
4. DeepSeek 上线门槛是语义测试通过，不只是 200：前若干条链接必须属于 `/zh-cn/news/`，标题不得是文档指南名，日期必须可解析。
5. 智谱必须测试标题归一化和回退逻辑；原始 date title 可保存在摘要或调试信息中，但 UI 主标题用模型/产品名。
6. 对每个来源分别记录 5xx、超时、空 Feed、条目数骤降和最近发布日期；单源失败不得阻塞其他来源。
7. 外链继续走站内出站页并显示真实域名。官方内容只做摘要和链接，不复制完整文章正文到站内长期展示。

