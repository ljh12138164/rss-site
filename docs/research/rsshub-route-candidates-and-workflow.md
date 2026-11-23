# RSSHub 待新增路由候选与标准化交付工作流

- **调研日期**：2026-11-13（2026-11-18 结合 `KKKKhazix/AIHOT` 增补候选；2026-11-23 结合 `JackyST0/awesome-rsshub-routes` 105 条官方源与 28 条 RSSHub 路由复测，接入 15 路可直连原生全文源至 `technology` 分区并合入 [PR #113](https://github.com/ljh12138164/rss-site/pull/113)，同步提交 `/nextjs/blog` 上游修复 PR [`#23992`](https://github.com/DIYgod/RSSHub/pull/23992) 并补齐最新 CI/PR 模板检验规范）
- **`rss-site` 基线**：`master` @ `f4fe025`（已合入 `PR #113`；`packages/signals/src/index.ts` 已注册 `101` 个源，分属 `7` 个分区：`ai` 29、`technology` 40、`news` 6、`social` 6、`finance` 5、`games` 13、`skills` 2；`deploy/server/business-jobs.json` 含 `100` 个信号抓取任务（不含 `chatgpt`）及 `4` 个维护任务，共 `104` 项）
- **AIHOT 参考样本**：`KKKKhazix/AIHOT`（`industry/sources.json` 含 `18` 个示范 RSS 源）及线上 `https://aihot.news/api/site/stats`（共 `925` 个活跃源，含 `rss: 181`、`web_list: 145`、`json_list: 26`、`mp_account: 23`、`x_search: 549`、`external: 1`）+ `/api/v1/items` 近期精选来源，经交叉核对上游 `DIYgod/RSSHub` `upstream/master` 后分层筛选出本轮高优先级开源/实验室/工程新源。
- **RSSHub 基线与自建实例**：上游 `DIYgod/RSSHub`（`master`）与自建分叉 `ljh12138164/RSSHub`（本地 `master` 已解决冲突并合并同步至 `upstream/master`）。线上部署两个自建实例：**主实例 `https://rss.ljhboard.cn`**（部署自 `ljh12138164/RSSHub` `master`）与 **备用/分流实例 `https://rss1.ljhboard.cn`**（部署自二次 fork 仓库 `ljh-project/RSSHub` `master`，fork 自 `ljh12138164/RSSHub`，用于分担请求、防止单个 Vercel 项目免费额度提前用完；主分叉 `master` 更新后需同步 `ljh-project/RSSHub` 的 `Sync fork -> Update branch` 才会触发 `rss1.ljhboard.cn` 重新部署）。
- **分支与 PR 边界约定**：后续所有 RSSHub 新路由开发**统一从上游 `DIYgod/RSSHub` 的 `master` 分支切出独立 `feat/*` 分支实现**（例如 `git checkout -b feat/<route> upstream/master`）；**代理仅负责实现路由、本地校验、部署自建与生成中英文上游 PR 文案，禁止自行向上游 `DIYgod/RSSHub` 提交 PR**，上游 PR 统一由用户本人提交。

### 推荐实施优先级（2026-11-23 更新）

> 结合历史已完成记录、`AIHOT` 线上信源、`awesome-rsshub-routes` 实测可用性与生产接入进度，建议按以下几档优先挑选下一批要新写或修复的 RSSHub 全文路由：

- **第一档｜最顺手优先（已有官网摘要/空正文 RSS，仅需补全正文，上游 PR 通过最快）**：
  1. **已完成自建与接入 `rss-site`**：`Modal Blog`（`/modal/blog`）、`ElevenLabs Blog`（`/elevenlabs/blog`）、`Sierra Blog`（`/sierra/blog`）、`Together AI Blog`（`/together/blog`，上游 PR `#23980` 已合入）、`Apple ML Research`（`/apple/ml-research`，上游 PR `#23973` 已合入）、`OpenAI Developers Blog`（`/openai/developers/blog`，上游 PR `#23920` 已合入）、`vLLM Blog`（`/vllm/blog`，上游 PR `#23918` 已合入）。
  2. **待开发新全文路由（`AI` / `开发工具` / `awesome-rsshub-routes` 增补）**：
     - **Supabase Blog**（`https://supabase.com/rss.xml`：`448` 条、`20` words 摘要 -> 文章页 `<article>` `4,155` 字符，200 无反爬）
     - **Deno Blog**（`https://deno.com/feed`：`249` 条、`21` words 摘要 -> 文章页 `<article>` `3,549` 字符，200 无反爬）
     - **Astro Blog**（`https://astro.build/rss.xml`：`191` 条、`20` words 摘要 -> 文章页 `<main>` `52,753` 字符，200 无反爬）
     - **Nuxt Blog**（`https://nuxt.com/blog/rss.xml`：`52` 条、`28` words 摘要 -> 文章页 `<article>` `9,840` 字符，200 无反爬）
     - **Chrome Developer Blog**（`https://developer.chrome.com/blog/feed.xml`：`16` words 摘要 -> 文章页 `<article>` `12,577` 字符，200 无反爬；北京 ECS 直连 `173.194.203.*` 25s 超时，做好 RSSHub 全文路由可同步解决连通性）
     - **Stripe Blog**（`https://stripe.com/blog/feed.rss`：`33` words 摘要 -> 文章页 `<article>` `4,374` 字符，200 无反爬）
     - **Spotify Engineering**（`https://engineering.atspotify.com/feed/`：`34` words 摘要 -> 文章页 `body` `17,111` 字符，200 无反爬）
     - **AIHOT 日报**（`https://aihot.news/feed/daily.xml`：`30` 条、`77` words 摘要 -> 文章页 `<main>` `2,658` 字符，200 无反爬；可直接加到既有 `RSSHub/lib/routes/aihot` 命名空间 `/aihot/daily`）
     - 其余既有待开发：**Suno Blog**（`4,522` 字符）、**Allen AI (Ai2) Blog**（`9,796` 字符）、**Databricks Blog**、**Tailscale Blog**、**Figma Blog**、**Mitchell Hashimoto**、**CISA News**、**Schneier on Security**、**Python Blog**；游戏引擎与媒体：**Godot Engine News**、**Game Developer**、**Gematsu**、**VGC**、**Rock Paper Shotgun**。
- **第一档并列｜已有上游 RSSHub 路由但失效/缺失全文或 `limit`（修复 PR）**：
  - **✅ 已完成修复（待上游审核合并）**：**`/nextjs/blog`**（`lib/routes/nextjs/blog.ts` + `templates/description.tsx`，分支 `feat/nextjs-blog` @ `8d57faea95` 基于 `upstream/master` `@ d75a3fc57a`，上游 PR [`#23992`](https://github.com/DIYgod/RSSHub/pull/23992)）。改用官方 `https://nextjs.org/feed.xml`、`--article-full-width` 容器、`templates/description.tsx`（基准柱状图转表格、SVG 叠层标签内嵌与主题色变量回退）、`4x3` 视频放大至 `800x600`、通用 `limit` 参数、同源/`publicOnly: true` 防护及单篇失败回退摘要；本地实测 `?limit=100` 全量 `89/89` 篇均含正文，PR 代码检查（`Anti Slop`/`CodeFactor`/`CodeQL`/`Lint`/`oxlint`/`Vitest`/`Docker build`）全绿。
  1. **`/deepmind/blog`**（`lib/routes/deepmind/blog.ts`）：未支持通用 `limit` 参数，冷缓存全量并发抓 `100` 篇导致 Serverless 15s 超时。
  2. **`/google/developers/:locale?`**（`lib/routes/google/developers.ts`）：实测仅抓搜索卡片摘要（`220` 字符），缺失详情页全文。
  3. **`/meta/ai/blog`**（`lib/routes/meta/ai-blog.ts`）：2026-11-23 实测返回 HTTP `200` 但正文 `0` 字符且内容停留在 `2026-07-27`（GraphQL 抓取已失效）。
- **第二档｜高价值无 RSS 源（需解析列表 HTML / Next.js RSC，AIHOT 核心覆盖，均无 CF 拦截）**：
  1. **LMSYS Org Blog**（`https://lmsys.org/blog/`：Next.js RSC `__next_f` + `<article>` `21,679` 字符，AIHOT `json_list` 核心推理/评测博客）
  2. **Fireworks AI Blog**（`https://fireworks.ai/blog`：`<article>` `9,458` 字符）
  3. **Liquid AI Blog**（`https://www.liquid.ai/blog`：`<article>` `6,624` 字符）
  4. **OpenHands Blog**（`https://www.openhands.dev/blog`：`<main>` `13,363` 字符）
  5. **Artificial Analysis Articles**（`https://artificialanalysis.ai/articles`：`<main>` `5,322` 字符）
  6. **Lovable Blog** / **Scale AI Blog** / **Mastra Blog** / **Wiz Research** / **Berkeley RDI Blog** / **Browserbase Blog** / **Recraft Blog** / **Replit Blog** / **Goodfire**；游戏向 **Unity Blog**（`https://unity.com/blog`）。
- **免新写 RSSHub 路由、可直接接入 `rss-site` 的高信号源**（见「三」）：既有的 `METR`、`BAIR`、`Ahead of AI`、`AWS ML`、`Redwood Research`、`Interconnects`、`Import AI`、`Latent Space`、`Dwarkesh Patel`、`ChinaTalk`、`Pragmatic Engineer`、`Newcomer`；2026-11-23 新增直连 `technology` 的 `15` 路全文原生源（`Rust`、`Go`、`Svelte`、`TypeScript`、`Swift`、`Kotlin`、`Netflix Tech`、`Meta Engineering`、`Smashing Magazine`、`JavaScript Weekly`、`Golang Weekly`、`This Week in Rust`、`Krebs on Security`、`MIT Technology Review`、`阮一峰科技爱好者周刊`）；以及上游已验证 200 全文可用的 `/huggingface/blog`、`/google/research`（已升级全文）、`/langchain/blog`、`/zed/blog`、`/nodejs/blog`、`/react/blog`、`/tailwindcss/blog`、`/techcrunch/news`、`/theverge`、`/claude/blog`、`/claude/dev/blog`、`/anquanke/news/fulltext`。

---

## 一、RSSHub 没有 + 官网也无原生 RSS（必须新建抓取路由）

以下平台经实时探测确认：**上游 `DIYgod/RSSHub` `master` 无对应路由（404）**，且**官网无原生 RSS/Atom feed**，需要新建 API 或 HTML/SSR 抓取路由。

### 1.1 科技 / AI / 硬件

| 平台 | 首页 / 列表页 | RSSHub 上游 | 官网原生 RSS | 探测实证与抓取方案 |
| :--- | :--- | :--- | :--- | :--- |
| **Arm Newsroom** | `https://newsroom.arm.com/` | ✅ 已完成（上游 PR `#23872`，`master` @ `0db3292f4`）；`rss-site` PR `#82` 已接入 | 无（HTML 无 RSS link） | 公开 WordPress REST API（`/arm/news` 与 `/arm/blog`）；`rss-site` `technology` 分区已上线 `arm` 合并源。 |
| **Cohere Blog** | `https://cohere.com/blog` | ✅ 已完成（上游 PR [`#23881`](https://github.com/DIYgod/RSSHub/pull/23881) 已合入）；自建 `https://rss.ljhboard.cn/cohere/blog` 已上线；`rss-site` PR `#88` 已合并 `master` | 无 | 官网同时保留 Sanity Content Lake（`rjtqmwfu.apicdn.sanity.io` / `web3-prod`）与 Ghost Content API 两部分文章。新路由并发合并双源、按 URL 去重时间排序后截取 `limit`，支持 Portable Text 全文、行内/块级 LaTeX 公式、`blogFaqSection` 问答、`keyTakeaways`、表格、代码块及音视频嵌入，并采用 JSX 模板渲染与主机名边界安全校验。 |
| **MiniMax** | `https://www.minimax.io/blog` / `https://www.minimax.io/news` | ✅ 已完成（自建 `https://rss.ljhboard.cn/minimax/blog` 与 `/minimax/news` 已上线，`master` @ `eaa8bc531`，源分支 `feat/minimax` @ `a31d6de3a`，上游 PR [`#23882`](https://github.com/DIYgod/RSSHub/pull/23882) 已提交）；`rss-site` PR `#89` 已合并 `master` | 无 | 支持可选参数 `:lang?`（默认 `en` 抓取 `minimax.io`，传 `zh-CN`/`zh` 切换 `minimax.cn`）；`/minimax/blog` 解析 SSR 列表并并发提取文章 `.prose` 全文、MathML/KaTeX 公式、图片及 Next.js RSC 内嵌视频；`/minimax/news` 读取官方 `/api/news` 与双排版详情页正文并按规范链接去重，采用 JSX 模板渲染与 CI 零告警重构。 |
| **Moonshot / Kimi Blog** | `https://www.kimi.com/blog/` | ✅ 已完成（上游 PR [`#23907`](https://github.com/DIYgod/RSSHub/pull/23907) 已合入；自建 `https://rss.ljhboard.cn/kimi/blog` 已上线，`master` @ `c8477b403`，源分支 `feat/kimi-blog` @ `a6c1a5100`）；`rss-site` [PR #94](https://github.com/ljh12138164/rss-site/pull/94) 已合并 `master` | 无 | 解析并重拼 Next.js RSC `__next_f` 分片中的 `articleList.items`（`20` 条，含站内 `/en/blog/*` 长文与 GitHub/HuggingFace/`moonshotai.github.io` 开源项目发布，无显式时区日期按 `UTC+8` 解析）；通过实时 DOM 节点移动循环还原嵌套 Streaming Suspense 槽位表格/视频、清理暗色重复图与隐藏内联样式、保留 KaTeX `<math>` 并基于 `markdown-it` 转换自定义 `<markdown>`/`<latex>` 标签；`rss-site` `ai` 分区接入 `kimi`（`/kimi/blog`，`itemLimit: 20`）。 |
| **LMSYS Org Blog**（AIHOT 参考） | `https://lmsys.org/blog/` | 无（`lmsys` 缺失） | 无（`/rss.xml` 与 `/feed.xml` `404`） | 列表 `200`（`113,579` B），在 Next.js RSC `__next_f` 分片中暴露完整 slug、标题与发布日期；文章页如 `/blog/2026-11-17-sglang-summit-recap/` 返回 `200`（`214,305` B，`<article>` `21,679` 字符，无 CF 拦截），可沿用 `kimi` RSC 解析思路实现。 |
| **Fireworks AI Blog**（AIHOT 参考） | `https://fireworks.ai/blog` | 无（`fireworks` 缺失） | 无 | Next.js 列表 `200`（`349,810` B，`20` 篇 `/blog/*`）；文章页 `200`（`1,344,724` B，`<article>` `9,458` 字符），推理模型与训练基础设施高价值博客。 |
| **Liquid AI Blog**（AIHOT 参考） | `https://www.liquid.ai/blog` | 无（`liquid` 缺失） | 无 | Next.js 列表 `200`（`549,411` B，`31` 篇 `/blog/*`）；文章页 `200`（`525,634` B，`<article>` `6,624` 字符），新型基础模型实验室。 |
| **OpenHands Blog**（AIHOT 参考） | `https://www.openhands.dev/blog` | 无（`openhands` 缺失） | 无 | SSR 列表 `200`（`217,522` B，`121` 个 `/blog/*` 链接）；文章页 `200`（`102,313` B，`<main>` `13,363` 字符），开源编码智能体头部博客。 |
| **Artificial Analysis Articles**（AIHOT 参考） | `https://artificialanalysis.ai/articles` | 无（`artificialanalysis` 缺失） | 无 | Next.js 列表 `200`（`357,443` B，`12` 篇 `/articles/*`）；文章页 `200`（`324,379` B，`<main>` `5,322` 字符），独立 LLM 基准评测实验室长文分析。 |
| **Lovable Blog**（AIHOT 参考） | `https://lovable.dev/blog` | 无（`lovable` 缺失） | 无 | 列表 `200`（`608,790` B，大量 `/blog/*` 链接）；文章页 `200`（`151,892` B，`3,269` 字符），AI Coding 应用平台博客。 |
| **Scale AI Blog** | `https://scale.com/blog` | 无（`scale` 缺失） | 无 | Next.js 列表 `200`（`178,338` B，`21` 篇 `/blog/*`）；文章页 `200`（`117,640` B，`<main>` `10,468` 字符）。 |
| **Mastra Blog**（AIHOT 参考） | `https://mastra.ai/blog` | 无（`mastra` 缺失） | 无 | Next.js 列表 `200`（`530,441` B，`17` 篇 `/blog/*`）；文章页 `200`（`392,967` B，`<article>` `2,671` 字符），TypeScript Agent 框架工程博客。 |
| **Wiz Research**（AIHOT 参考） | `https://www.wiz.io/blog` | 无（仅存在无关 `wizfile`） | 无 | Next.js 列表 `200`（`649,909` B）；文章页如 `/blog/malicious-version-of-microsofts-agent-framework-published-to-pypi` 返回 `200`（`432,890` B，`<article>` `7,629` 字符），云与 AI 安全威胁研究。 |
| **Berkeley RDI Blog**（AIHOT 参考） | `https://rdi.berkeley.edu/blog` | 无（`berkeley` / `rdi` 缺失） | 无 | 轻量 HTML 列表 `200`（`31,736` B，`20` 篇 `/blog/*`）；文章页 `200`（`33,366` B，`<article>` `16,409` 字符；详情页缺少语义发布时间，需重点核查列表页或元标签日期解析）。 |
| **Browserbase Blog**（AIHOT 参考） | `https://www.browserbase.com/blog` | 无（`browserbase` 缺失） | 无 | Next.js 列表 `200`（`605,729` B，抓取链接时需过滤 `/blog/page` 与分类标签路径）；文章页 `200`（`175,110` B，`<main>` `3,098` 字符）。 |
| **Recraft Blog**（AIHOT 参考） | `https://www.recraft.ai/blog` | 无（`recraft` 缺失） | 无 | 列表 `200`（`428,114` B）；文章页 `200`（`114,404` B，`<body>` 含 `12,422` 字符，但未使用 `<article>`/`<main>`，需针对 Webflow 正文节点定位选择器）。 |
| **Replit Blog**（AIHOT 参考） | `https://replit.com/blog` | 无（`replit` 缺失） | 无（`/blog/rss.xml` 与 `/feed.xml` `404`） | Next.js 列表 `200`（`257,117` B，`28` 篇 `/blog/*`）；文章页 `200`（`168,564` B，`<article>` `6,574` 字符）。 |
| **Goodfire Research / Blog**（AIHOT 参考） | `https://www.goodfire.ai/research` / `/blog` | 无（`goodfire` 缺失） | 无 | `/research`（`200`，`57,214` B）与 `/blog`（`200`，`31,813` B）；研究页单篇 SVG/交互数据体积较大（实测 `2,569,902` B），若抓取需做好体积裁剪与 `512 KiB` 超限防范。 |
| **Dario Amodei Essays**（AIHOT 参考） | `https://www.darioamodei.com/` | 无 | 无 | Next.js 首页 `200`（`31,899` B），长文 `200`（`470,760` B，`<article>` `145,987` 字符）；更新频率极低，更适合作为 RSSHub 归档路由而非高频新闻源。 |

### 1.2 游戏 / 游戏技术

| 平台 | 首页 / 列表页 | RSSHub 上游 | 官网原生 RSS | 探测实证与抓取方案 |
| :--- | :--- | :--- | :--- | :--- |
| **80 Level** | `https://80.lv/articles/` | ✅ 已完成（上游 PR [`#23885`](https://github.com/DIYgod/RSSHub/pull/23885) 已合入；自建 `https://rss.ljhboard.cn/80lv/articles` 已上线，`master` @ `dba5a9557`，源分支 `feat/80lv` @ `01c11aa27`）；`rss-site` [PR #92](https://github.com/ljh12138164/rss-site/pull/92) 已合并上线，已完成生产自动激活与线上回归 | 无 | 基于官方公开 API `/api/articles/list` 与 `/api/articles/:slug` 抓取全文，支持 `:category?`（默认 `all` 及 17 个官方分类与 `80-level-china` 汉语标识）及通用 `limit`（1–100）；使用 `hono/jsx/dom/server` `renderToString` 模板还原排版正文、代码块、表格、引用块组、YouTube/Vimeo 嵌入及图片，并发限流 `DETAIL_CONCURRENCY = 5`；`rss-site` `games` 分区已上线 `80lv`（`/80lv/articles?limit=30`，`30/30` 入库并激活 `rss-site-80lv`）。 |
| **Unity Blog** | `https://unity.com/blog` | 无（`unity` 缺失） | 无 | Next.js 列表页 `200`（2026-11-18 复测 `620,263` B，`16` 篇 `/blog/*`）；文章页 `200`（`494,292` B，`<main>` `7,885` 字符，无 CF 拦截），可稳定用列表 + 原文页提取。 |

### 1.3 较复杂的 SPA / 后端接口型候选（备选）

| 平台 | 首页 | RSSHub 上游 | 官网原生 RSS | 探测实证与复杂度说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Tencent Hunyuan Research（腾讯混元）**（AIHOT 参考） | `https://hunyuan.tencent.com/research` | 无（`tencent` 无混元研究子路由） | 无 | 国产前沿大模型研究高价值源（AIHOT 为 `json_list`）；首页 `200`（`6,886` B SPA 壳，静态 bundle 入口暂未直接暴露研究列表接口），需用浏览器抓包定位研究页动态 chunk 接口后方可开发。 |
| **篝火营地** | `https://gouhuo.qq.com/` | 无（`gouhuo` 缺失） | 无 | 首页 `200`（`217,140` 字节），`/news` 返回 `404`，首页静态 HTML 缺少直达文章链接，需排查后端 API。 |

---

## 二、RSSHub 没有（或缺子路由）+ 官方 RSS 不完整（仅摘要/元数据，需抓原文补全文后提 PR）

以下平台已有官方 RSS/Atom，但**官方源仅输出短摘要或纯标题元数据**，且上游 `DIYgod/RSSHub` 尚无对应路由（或缺少对应子路由）。通过 RSSHub 读取官方 feed 发现条目并并发抓取文章原文补全全文，实施门槛最低、稳定性最高、最容易通过上游审核。

### 2.1 科技 / AI / 开发工具

| 平台 | 官方 RSS / Atom 地址 | RSSHub 上游状态 | 探测实证（Feed 正文长度 / 原文页状态） |
| :--- | :--- | :--- | :--- |
| **vLLM Blog** | `https://vllm.ai/blog/rss.xml` | ✅ 已完成（自建 `https://rss.ljhboard.cn/vllm/blog` 已上线，`master` @ `693346b621`，源分支 `feat/vllm-blog` @ `1d4bc5c9b`）；`rss-site` PR `#95` 已合并至 `master` @ `f363b8c` 并完成线上自动激活与回归验收（待提交上游 `DIYgod/RSSHub` PR） | Feed 仅含摘要（`50` 条，`rssBodyWords: 194`）；新路由通过 `rss.xml` 发现条目并发抓正文页补全全文、MathJax 公式、代码块、表格、`<video>` 与交互 `<iframe>` 图表，跳过 `/og?` 文字卡片封面；`rss-site` `ai` 分区已接入 `vllm`（`/vllm/blog`，`itemLimit: 20`，`pg_cron` job `1260` 已激活）。 |
| **OpenAI Developers Blog**（AIHOT 参考） | `https://developers.openai.com/rss.xml` / `https://developers.openai.com/blog` | ✅ 已完成（自建 `https://rss.ljhboard.cn/openai/developers/blog` 已上线，`master` @ `41e91be7e`，源分支 `feat/openai-developers-blog` @ `0f560af02`；待提交上游 `DIYgod/RSSHub` PR）；`rss-site` [PR #98](https://github.com/ljh12138164/rss-site/pull/98) 已合并至 `master` @ `1f97de9` 并完成线上回归验收 | 新路由 `/openai/developers/blog/:lang?` 直接解析 Astro SSR 博客列表与文章正文页（EN/`zh-Hans` 等语言全量 `35` 篇），过滤动态 OG 卡片封面并用 JSX 模板输出代码/表格/图片全文；`rss-site` 将 `openai` 升级为 `/openai/news?limit=20` 与 `/openai/developers/blog?limit=20` 双 Feed 合并（`itemLimit: 30`，线上回环首批混合入库 `openai.com: 20` + `developers.openai.com: 10`）。 |
| **Modal Blog**（AI 开发推荐） | `https://modal.com/blog/atom.xml` | ✅ 已完成（自建 `https://rss.ljhboard.cn/modal/blog` 已上线，`master` @ `90cd7c7b7d`，源分支 `feat/modal-blog` @ `d3654a0b89`；待提交上游 `DIYgod/RSSHub` PR）；`rss-site` `ai` 分区接入 `modal`（`itemLimit: 20`） | Atom `158` 条且无摘要与正文；新路由并发抓取文章页补全分类、作者、封面、全文并内联 SVG 图表样式，`100` 篇实时审计通过。 |
| **ElevenLabs Blog**（AIHOT 参考） | `https://elevenlabs.io/blog/rss.xml` | ✅ 自建 [`/elevenlabs/blog`](https://rss.ljhboard.cn/elevenlabs/blog) 已上线（`master` @ `d09520a4b5`，源分支 `feat/elevenlabs-blog` @ `a9625b8464`）；`rss-site` AI 分区接入待合并发布 | 通过官方 RSS 发现条目并补全正文、封面、FAQ、表格和音视频。50 篇全量比对通过；默认 20 篇经站点采集器验证。 |
| **Suno Blog**（AIHOT 参考） | `https://suno.com/blog/rss.xml` | 无（`suno` 缺失） | RSS `200`（`24,972` B、`50` 条、`descLen: 121` / `22` words）；文章页 `200`（`183,831` B，`<article>` `4,522` 字符），AI 音乐大模型官方博客。 |
| **Sierra Blog**（AIHOT 参考） | `https://sierra.ai/rss.xml` | ✅ 自建 [`/sierra/blog`](https://rss.ljhboard.cn/sierra/blog) 已上线（`master` @ `8e0c31ccb2`，源分支 `feat/sierra-blog` @ `f07a8fd4ae`）；`rss-site` AI 分区接入待合并发布 | 读取 `sierra.ai/rss.xml`（`147` 篇）并发提取正文主栏、Wistia/YouTube 嵌入、Sanity `mediaResponsiveVideo` 与交互图外链；全量 `147` 篇本地通过，公网 `limit=1`/默认/`limit=100` HTTP `200` 且站点 `ingestSignal` `20/20` 验证通过。 |
| **Together AI Blog** | `https://www.together.ai/blog/rss.xml` | ✅ 自建 [`/together/blog`](https://rss.ljhboard.cn/together/blog) 已上线（`master` @ `9c942d4f77`，源分支 `feat/together-blog` @ `52e78a140d`）；`rss-site` `ai` 分区接入 `together`（`itemLimit: 20`） | 官方 RSS `100` 条仅含短摘要（且 `10` 条空 `<title/>`）；新路由并发补全正文、作者、封面、`<audio controls>`（`[data-howler-src]`）、`<video controls>` 及 YouTube 嵌入，本地 `?limit=100` 审计 `100/100`、公网与站点 `ingestSignal` `20/20` 全部通过。 |
| **Allen AI (Ai2) Blog** | `https://allenai.org/rss.xml` | 无（`allenai` / `ai2` 缺失） | RSS `200`（`25` 条、`descLen: 458` / `20` words）；文章页 `200`（`1,222,437` B、`9,796` 字符），开放大模型研究实验室（OLMo/Tulu）。 |
| **Apple ML Research** | `https://machinelearning.apple.com/rss.xml` | ✅ 自建 [`/apple/ml-research`](https://rss.ljhboard.cn/apple/ml-research) 已上线（`master` @ `57cd7adafd`，源分支 `feat/apple-ml-research` @ `473976be15`）；`rss-site` `ai` 分区接入 `apple-ml`（`itemLimit: 20`） | 官方 RSS 仅 `10` 条截断摘要（`592–600` 字符）；新路由 `/apple/ml-research/:category?` 合并 `/highlights`（`56` 篇工程长文）与 `/research`（`1,194` 篇论文）并补全正文、Hero 媒体、音频、KaTeX `<math>` 及 arXiv/GitHub 链接，公网 `/apple/ml-research`（`20/20`）与本地 `highlights` `56/56`、`research` `100/100` 全部通过。 |
| **Databricks Blog**（AIHOT 参考） | `https://www.databricks.com/feed` | 无（`databricks` 缺失） | RSS `200`（`10` 条、`descLen: 83` / `13` words）；文章页 `200`（`758,863` B、`20,151` 字符）。 |
| **Supabase Blog** | `https://supabase.com/rss.xml` | 无（`supabase` 缺失） | RSS `200`（`171,713` B、`448` 条、`descLen: 128` / `20` words）；文章页 `200`（`175,387` B，`<article>` `4,155` 字符）；北京 ECS 直连 `718ms` `200`。 |
| **Deno Blog** | `https://deno.com/feed` | 无（`deno` 缺失） | Atom `200`（`179,221` B、`249` 条、`descLen: 144` / `21` words）；文章页 `200`（`64,335` B，`<article>` `3,549` 字符）；北京 ECS 直连 `1,622ms` `200`。 |
| **Astro Blog**（`awesome` 增补） | `https://astro.build/rss.xml` | 无（`astro` 缺失） | RSS `200`（`74,044` B、`191` 条、`descLen: 133` / `20` words）；文章页 `200`（`482,990` B，`<main>` `52,753` 字符）；北京 ECS 直连 `845ms` `200`。 |
| **Nuxt Blog**（`awesome` 增补） | `https://nuxt.com/blog/rss.xml` | 无（`nuxt` 缺失） | RSS `200`（`32,946` B、`52` 条、`descLen: 169` / `28` words）；文章页 `200`（`262,452` B，`<article>` `9,840` 字符）；北京 ECS 直连 `996ms` `200`。 |
| **Chrome Developer Blog**（`awesome` 增补） | `https://developer.chrome.com/blog/feed.xml` | 无（`chrome` 缺失） | RSS `200`（`10` 条、`descLen: 119` / `16` words）；文章页 `200`（`133,632` B，`<article>` `12,577` 字符）。注：北京 ECS 直连 `173.194.203.*` 25s 超时，适合通过 RSSHub 路由补全文并兼顾海外抓取。 |
| **Stripe Blog**（`awesome` 增补） | `https://stripe.com/blog/feed.rss` | 无（`stripe` 缺失） | RSS `200`（`9,641` B、`10` 条、`descLen: 223` / `33` words）；文章页 `200`（`403,161` B，`<article>` `4,374` 字符）；北京 ECS 直连 `414ms` `200`。 |
| **Spotify Engineering**（`awesome` 增补） | `https://engineering.atspotify.com/feed/` | 无（仅存在用户/歌单路由，缺工程博客） | RSS `200`（`6,232` B、`5` 条、`descLen: 213` / `34` words）；文章页 `200`（`122,098` B、`body` `17,111` 字符）；北京 ECS 直连 `1,616ms` `200`。 |
| **AIHOT 日报**（`awesome` 增补） | `https://aihot.news/feed/daily.xml` | 已有 `aihot` 榜单/模型路由，缺 `/aihot/daily` | RSS `200`（`68,484` B、`30` 条、`descLen: 597` / `77` words）；文章页 `200`（`98,848` B，`<main>` `2,658` 字符）；北京 ECS 直连 `182ms` `200`。 |
| **CISA News / Schneier / Python Blog**（`awesome` 备选） | `https://www.cisa.gov/news.xml` / `https://www.schneier.com/feed/` / `https://blog.python.org/feeds/posts/default` | 无对应博客/资讯路由 | 均 `200` 无 CF 拦截（CISA `0` words -> `<main>` `3,133` 字符；Schneier `112` words -> `body` `35,903` 字符；Python `12` words -> `<article>` `1,224` 字符），北京 ECS 直连均 `579ms–1,179ms` `200`。 |
| **Tailscale Blog** | `https://tailscale.com/blog/index.xml` | 无（`tailscale` 缺失） | RSS `200`（`7,957` B、`15` 条、`descLen: 141` / `21` words）；文章页 `200`（`165,765` B、`12,628` 字符）。 |
| **Figma Blog**（AIHOT 参考） | `https://www.figma.com/blog/feed/atom.xml` | 无（`figma` 缺失） | Atom `200`（`427,200` B、`778` 条、`encLen: 158` / `23` words）；文章页 `200`（`1,780,673` B，`<main>` `11,203` 字符）。 |
| **Mitchell Hashimoto**（AIHOT 参考） | `https://mitchellh.com/feed.xml` | 无 | RSS `200`（`55` 条、**`0` words 纯标题链接**）；文章页 `200`（`64,404` B，`<main>` `10,698` 字符），Ghostty 与开发者工具深度技术文章。 |
| **Google Blog · AI**（AIHOT 参考） | `https://blog.google/innovation-and-ai/rss/` | 无对应 `blog.google` 子路由 | RSS `200`（`20` 条、`descLen: 234` / `16` words）；文章页 `200`（`359,572` B）。注：`rss-site` 的 `google-ai` 当前已通过自建代理 `feeds.ljhboard.cn/google-ai` 消费。 |

> 注：**Mistral AI**（`lib/routes/mistral`，含 `namespace.ts` 与 `news.ts`）已通过上游 PR `#23854` 合入 `DIYgod/RSSHub` `master`；按用户指令，本轮跳过 Mistral AI，暂不接入 `rss-site`。此外，上游 `/google/research`（`lib/routes/google/research.ts`）已补齐正文抓取（2026-11-23 `rss.ljhboard.cn/google/research?limit=3` 实测 `200`、`15,589` 字符全文）；而以下现有路由需待修复/增强 PR：
> - **`/nextjs/blog`**（`lib/routes/nextjs/blog.ts`）：2026-11-23 实测原线上版本 HTTP `200` 但 `description` 全空（`$('div.prose').html()` 选择器已失效）；已在分支 `feat/nextjs-blog`（`8d57faea95`，PR [`#23992`](https://github.com/DIYgod/RSSHub/pull/23992)）改用 `feed.xml` + `--article-full-width` 修复全文抓取与图表/视频还原（`?limit=100` `89/89` 篇全量实测通过），待上游合并。
> - **`/deepmind/blog`**（`lib/routes/deepmind/blog.ts`）：未实现 `limit` 截断，冷缓存并发抓取全量 `100` 篇导致 Serverless 15s 超时。
> - **`/google/developers/:locale?`**（`lib/routes/google/developers.ts`）：当前仅输出 `.search-result__summary` 摘要（`220` 字符），未抓正文页。
> - **`/meta/ai/blog`**（`lib/routes/meta/ai-blog.ts`）：2026-11-23 实测 HTTP `200` 但正文 `0` 字符且内容停留在 `2026-07-27`。

### 2.2 游戏 / 游戏媒体与引擎

| 平台 | 官方 RSS / Atom 地址 | RSSHub 上游状态 | 探测实证（Feed 正文长度 / 原文页状态） |
| :--- | :--- | :--- | :--- |
| **Godot Engine News** | `https://godotengine.org/rss.xml` | 无（`godot` 缺失） | RSS `200`（`307,103` B、`15` 条、`descLen: 1,463` / `223` words）；文章页 `200`（`17,742` B）。 |
| **Game Developer** | `https://www.gamedeveloper.com/rss.xml` | 无（`gamedeveloper` 缺失） | RSS `200`（`76,906` B、`50` 条、`descLen: 164` / `21` words）；文章页 `200`（`454,566` B，`cf:false`）。 |
| **Gematsu** | `https://www.gematsu.com/feed` | 无（`gematsu` 缺失） | RSS `200`（`32,919` B、`20` 条、`encLen: 237` / `17` words）；文章页 `200`（`101,350` B）。 |
| **VGC (Video Games Chronicle)** | `https://www.videogameschronicle.com/feed/` | 无（`vgc` / `videogameschronicle` 均缺失） | RSS `200`（`13,426` B、`10` 条、`encLen: 220` / `11` words）；文章页 `200`（`85,535` B）。 |
| **Rock Paper Shotgun** | `https://www.rockpapershotgun.com/feed/` | 无（`rockpapershotgun` 缺失） | RSS `200`（`231,275` B、`100` 条、`descLen: 638` / `61` words）；文章页 `200`（`225,947` B，`cf:false`）。 |

---

## 三、暂不提上游 RSSHub PR 的排除项说明

候选官方 Feed 与游研社原生 RSS 已接入现有 AI、科技和游戏分区。发布后由生产门禁逐项试抓和启用。见[采集与验收记录](../development/native-feed-ingestion.md)。

1. **官方 RSS 已自带较完整正文（可直接作为 `rss-site` `feedUrl` 评估，无需额外做 RSSHub 路由）**：
   - **AI / 前沿研究与专栏（AIHOT 复测新增）**：
     - `METR`（`https://metr.org/feed.xml`，`103` 条，`encLen: 38,751` / `3,722` words — 前沿模型安全与能力评测机构）
     - `Berkeley AI Research (BAIR)`（`https://bair.berkeley.edu/blog/feed.xml`，`10` 条，`descLen: 79,451` / `5,502` words）
     - `Ahead of AI (Sebastian Raschka)`（`https://magazine.sebastianraschka.com/feed`，`20` 条，`encLen: 312,565` / `9,145` words）
     - `Dwarkesh Patel`（原直连 `https://www.dwarkesh.com/feed` 在北京 ECS 受 DNS 污染阻塞，已切至自建 RSSHub `/substack/subscribe/dwarkesh`）
     - `AWS Machine Learning Blog`（原直连 `https://aws.amazon.com/blogs/machine-learning/feed/` 在北京 ECS 受 DNS 污染阻塞；已在自建 RSSHub `master` @ `67971cd6c5` 上线 `/amazon/blogs/:category?` 并切至 `/amazon/blogs/machine-learning`，`feat/amazon-blogs` @ `1f86843ede` 待提交上游 `DIYgod/RSSHub` PR）
     - `Redwood Research Blog`（`https://blog.redwoodresearch.org/feed`，`20` 条，`encLen: 37,799` / `3,319` words）
     - `Interconnects (Nathan Lambert)`（`https://www.interconnects.ai/feed`，`20` 条，`encLen: 10,747` / `1,433` words）
     - `Import AI (Jack Clark)`（原直连 `https://importai.substack.com/feed` 在北京 ECS 受 DNS 污染阻塞，已切至自建 RSSHub `/substack/subscribe/importai`）
     - `Latent Space`（`https://www.latent.space/feed`，`20` 条，`encLen: 12,285` / `1,197` words）
     - `Where's Your Ed At (Ed Zitron)`（`https://www.wheresyoured.at/rss/`，`15` 条，`encLen: 87,756` / `9,438` words）
     - `ChinaTalk`（原直连 `https://www.chinatalk.media/feed` 在北京 ECS 受 DNS 污染阻塞，已切至自建 RSSHub `/substack/subscribe/chinatalk`）
     - `Trail of Bits Blog`（`https://blog.trailofbits.com/feed/`，`20` 条，`descLen: 8,399` / `896` words）
     - `Big Technology`（`https://www.bigtechnology.com/feed`，`20` 条，`encLen: 17,476` / `847` words）
     - `Pragmatic Engineer`（`https://blog.pragmaticengineer.com/rss/`，`15` 条，`encLen: 22,820` / `1,725` words）
     - `Newcomer`（`https://www.newcomer.co/feed`，`20` 条，`encLen: 26,168` / `1,238` words）
   - **原有技术 / 游戏全文 Feed**：
     - `Vercel`（`https://vercel.com/atom`，`bodyLen: 2465`）
     - `VoidZero`（`https://voidzero.dev/feed.xml`，`bodyLen: 14721`）
     - `Chips and Cheese`（`https://chipsandcheese.com/feed/`，全站 feed `1.64 MB`）
     - `Linear Now`（`https://linear.app/rss/now.xml`，`enc: 7529`）
     - `Ars Technica`（`https://arstechnica.com/information-technology/feed/`，`enc: 1459`；AI 频道 `https://arstechnica.com/ai/feed/`）
     - `404 Media`（`https://404media.co/rss/`，`enc: 4109`）
     - `Bun`（`https://bun.com/rss.xml`，`desc: 917`）
     - `IGN`（`https://ign.com/rss/articles/feed?tags=games`，`enc: 1816`）
     - `PC Gamer`（`https://www.pcgamer.com/rss/`，`enc: 2252`）
     - `PlayStation Blog 繁中`（`https://blog.zh-hant.playstation.com/feed/`，`enc: 2438`）
     - `Xbox Wire`（`https://news.xbox.com/en-us/feed/`，`enc: 6242`）
     - `GameLook`（`http://www.gamelook.com.cn/feed/`，`31` 条含全文；注意 HTTPS 会触发 `ECONNRESET`）
   - **2026-11-23 `awesome-rsshub-routes` 增补已直连 `technology` 的 15 路全文原生 Feed**（北京 ECS 实测全数可直连且不值得重复透传提上游 RSSHub PR，详见[接入与实测记录](../development/native-tech-feeds.md)）：
     - 语言与框架：`Rust Blog`（`https://blog.rust-lang.org/feed.xml`）、`Go Blog`（`https://go.dev/blog/feed.atom`）、`Svelte Blog`（`https://svelte.dev/blog/rss.xml`）、`TypeScript Blog`（`https://devblogs.microsoft.com/typescript/feed/`）、`Swift Blog`（`https://www.swift.org/atom.xml`）、`Kotlin Blog`（`https://blog.jetbrains.com/kotlin/feed/`）
     - 工程与前端长文：`Netflix Tech Blog`（`https://netflixtechblog.com/feed`）、`Meta Engineering`（`https://engineering.fb.com/feed/`）、`Smashing Magazine`（`https://www.smashingmagazine.com/feed/`）
     - 技术周刊 / 安全 / 综合科技：`JavaScript Weekly`（`https://javascriptweekly.com/rss/`）、`Golang Weekly`（`https://golangweekly.com/rss/`）、`This Week in Rust`（`https://this-week-in-rust.org/atom.xml`）、`Krebs on Security`（`https://krebsonsecurity.com/feed/`）、`MIT Technology Review`（`https://www.technologyreview.com/feed/`，全站主 Feed 实测 `797–7,753` 纯文本字符完整正文）、`阮一峰科技爱好者周刊`（`https://www.ruanyifeng.com/blog/atom.xml`）
     - 同步核对排除的伪可用/低质量/僵尸源：`ByteByteGo`（实测 `4/20` 条末尾 `"Read more"` 付费会员截断预览及课程促销）、`Dev.to`（`https://dev.to/feed` 为 `6–9` 分钟级未过滤全站最新帖、含加密货币推广帖且官方无 `/top` 精选 RSS）、`听说了吗？ (AnyMsgs)`（尾部固定 `→ 会员全文（含图表与交互）` 会员截断）、`Vue Blog`（停更于 `2024-09-01`）、`A List Apart`（`pubDate=0/20` 且停更于 `2026-06-30`）、`Google Security Blog`（302 跳转且 FeedBurner 停更于 `2026-04-23`）、`Mozilla Hacks`（更新停留在 `2026-08-24`）。
2. **上游 `DIYgod/RSSHub` 已存在对应路由（`rss-site` 可直接评估复用或补充子路由）**：
   - **AI / 大模型（结合 AIHOT 核对值得直接评估接入 `rss-site` 的未接路由）**：
     - `claude`（`/claude/blog` `5,222` 字符、`/claude/dev/blog` `18,866` 字符实测 200 全文；另有 `/claude/code-changelog`）
     - `anthropic`（现有 `anthropic` 仅接 `/anthropic/news`，上游已有 `/anthropic/research`、`/anthropic/engineering`、`/anthropic/red`）
     - `thinkingmachines`（`/thinkingmachines/news`）
     - `deepmind`（`/deepmind/blog` — 注：`deepmind.google/blog/rss.xml` 仅 `0` words，当前 `/deepmind/blog` 未加 `limit` 易在冷缓存超时，见上方修复项）
     - `deepseek`（现有 `deepseek` 仅接 `/deepseek/news`，上游已有 `/deepseek/changelog/:language?` 抓取 `api-docs.deepseek.com` 更新日志）
     - `nvidia`（现有 `nvidia` 之外，上游已有 `/nvidia/developer/:language?` 与 `/nvidia/newsroom`）
     - `google`（`/google/research` 实测已升级 `15,589` 字符全文可用；`/google/developers/:locale?` 仍仅摘要 `220` 字符）
     - `meta`（`/meta/ai/blog` 当前返回空正文且停留在 2026-07）
     - `humanlayer`（`/humanlayer/blog`）、`cognition`（`/cognition/blog`）、`windsurf`（`/windsurf/blog`）、`augmentcode`（`/augmentcode/blog`）、`cursor`（`/cursor/blog`）、`apple`（`/apple/newsroom`）、`langchain`（`/langchain/blog` 实测 `13,359` 字符全文 200）、`huggingface`（`/huggingface/blog` 实测 `68,710` 字符全文 200）、`ollama`、`zed`（`/zed/blog` 实测 `22,708` 字符全文 200）、`perplexity`、`baai`、`modelscope`、`mistral`（已合入 `#23854`）
   - **国内科技 / 游戏既有路由**：
     - `qbitai`、`infoq`、`yystv`（原生 `yystv.cn/rss/feed` 亦有 `2,588` 字符全文）、`steam`、`eurogamer`、`lobsters`、`phoronix`、`taptap`、`xiaoheihe`、`a9vg`、`gameres`。
3. **当前存在反爬拦截 / 已改版下线 / 纯空壳 SPA 阻碍**：
   - **游戏葡萄**（`https://youxiputao.com/`）：2026-11-18 实测已改版为 **Sxl.cn（上线了）**纯静态单页品牌名片（`show.js` 内 `blogPosts: []`、`totalCount: 0`，`/sitemap.xml` 仅 1 条首页，`/blog`/`/news`/`/articles` 全 `404`），文章主阵地迁至微信公众号，B 站分叉路由（`/bilibili/user/video/536066324`）无鉴权返回 `503`。
   - **Microsoft AI / Microsoft Research / TechCrunch AI**：`microsoft.ai` 列表 `200` 但 RSS 及文章详情均返回 `403`；`microsoft.com/en-us/research/feed/` 返回 `403`；`techcrunch.com/category/artificial-intelligence/feed/` 返回 `403`。
   - **OpenAI Alignment / OpenAI Deployment Safety / Every**：`alignment.openai.com` 为 `20,852` B SPA 壳（详情页静态正文 `0` 字符）；`deploymentsafety.openai.com/rss.xml` 有 `34` 条（`0` words）但详情页静态 `<article>` 仅暴露 `501` 字符（疑富交互组件后渲染）；`every.to/p/*` 正文外层仅 `80` 字符（会员截断）。
   - **Conductor Changelog**：`https://www.conductor.build/changelog/rss.xml` 含 `213` 条短发布说明（`18` words），详情页静态 `<article>` 仅 `146` 字符（偏简短更新日志）。
   - **OpenMOSS**：`/blog/` 返回 55 字节重定向 `/#blog`，直连 `/blog/cn/moss-live/` 为 `13,554` B 静态壳。
   - **a16z News**（`https://a16z.com/feed/`）：返回 `404`。
   - **MIT Tech Review AI**：官方 feed `encLen: 3,970` 但 `words: 10`（含付费墙/截断导流）。
   - **原有阻断项保留**：`GameSpot`（文章页 `403(CF)`）、`xAI`（`403` CF）、`VideoCardz`（`403` CF）、`Intel Newsroom`（`403` Akamai）、`Unreal Engine Blog`（`/blog` `403`，`/rss` 含畸形 `&lt;p&gt;` 标题及 `341` 字符正文）、`Perplexity Hub`（直连 Web `403` CF，但 RSSHub 已有对应路由）、`机器之心`（静态页面仅 `3,251` 字节壳）、`ByteDance Seed`（静态页面仅 `10,983` 字节壳）。

---

## 四、后续 7 步标准交付工作流

### 第 1 步：从上游 `DIYgod/RSSHub` `master` 切新分支实现路由

1. 拉取并从 `upstream/master` 切出新分支（禁止基于过期分叉直接开发）：
   ```bash
   git fetch upstream
   git checkout -b feat/<platform>-route upstream/master
   ```
2. 按 RSSHub 规范编写 `lib/routes/<namespace>/namespace.ts` 与路由文件（如 `blog.ts` / `news.ts`），提交前必须逐条对照上游仓库的 `AGENTS.md` 与 `.github/prompts/pr_review_rules.md` 自检：
   - `namespace.ts` 填写完整 `name`、`url`（不含 `https://` 前缀）、`lang`（`en` 或 `zh-CN`），按需补充 `zh: { name, description }`。
   - 路由导出填写英文 `name`（不重复 namespace 名）、`description`、`parameters`（严格匹配真实路径参数）以及中文 `zh: { name, description, parameters }`，配置单元素 `categories`、`radar`（`source` 用无协议相对路径，`target` 留空或匹配路由路径）、`maintainers: ['ljh12138164']`、`features`（确保无依赖 Puppeteer/Playwright 或新增第三方依赖，严格使用 `ofetch` + `cheerio` + `cache.tryGet`）。
   - 若基于官方摘要 RSS 补全正文，需保留原作者、发布时间（`parseDate`，无时间则不伪造 `new Date()`）、分类，并对正文内的相对图片/链接与代码块做清洗保留，支持通用 `limit` 参数限制抓取条数。
   - **Auto Review 重点红线**：
     - **禁止手动 `.trim()` 或截断标题（`[No Title Trimming]`）**：`item.title` 由 RSSHub 核心中间件统一处理（如 `decodeHTMLStrict`），只能做 HTML 实体解码/零宽字符清理，严禁对标题调用 `.trim()`。
     - **禁止使用 `allowEmpty: true` 绕过空检查（`[Do Not Bypass Empty Checks]`）**：常规及分类路由不得添加 `allowEmpty: true`，让 RSSHub 核心在无条目时按规范报错暴露异常。
     - 若 PR ` ```routes ` 仅保留稳定返回全部内容的路由示例（例如 `/arm/news`、`/arm/blog`），需提前核对是否覆盖主要功能并确保无未传真实值参数的 `/:param` 占位符。

### 第 2 步：本地文档构建、本地启动与真实抓取数据验收

在 RSSHub 仓库根目录执行以下命令，验证路由注册、无孤立文件、双语（`en` / `zh`）文档构建以及代码风格：

```bash
pnpm run build:docs
pnpm run format:check
pnpm run eslint
pnpm run typecheck
pnpm exec oxfmt --check lib/routes/<namespace>
pnpm exec oxlint --type-aware --config oxlint.ci.config.ts --deny-warnings lib/routes/<namespace>
uvx --from lizard lizard -l typescript -C 10 -w lib/routes/<namespace>
```

> **CI / Windows 必跑提示**：上游已将 CI 配置迁至 `oxlint.ci.config.ts`（旧 `.oxlintrc.ci.json` 已移除），普通 `pnpm run eslint` 或默认配置无法完整暴露 `anti-slop/*` / `quality/*` 与严格 `no-restricted-syntax` 规则，务必显式使用 `--config oxlint.ci.config.ts --deny-warnings` 验证；`2026-11-23` `#23986` 后上游新增禁用 `Number.isSafeInteger()`、`Number.isFinite()`、Cheerio `.clone()`、`Array#some` 内冗余 `Boolean()`、`.catch(() => undefined)` 以及动态替换 `String#replaceAll(token, val)`（需改用正则回调或显式函数）；`lizard -C 10` 用于提前拦截 CodeFactor 圈复杂度超标；若 Windows 因 `core.autocrlf = true` 出现仅行尾差异（`git diff --ignore-all-space` 为空），可先 `pnpm exec oxfmt <files>` 归一化 LF 并确认差异后再 `git push`。

检查与本地启动验收要点：
1. **构建与 i18n 文档生成**：`pnpm run build:docs` 会先运行 `pnpm run build:routes`（通过 `scripts/workflow/build-routes.ts` 校验 `findOrphanFiles()` 孤立文件，并产出 `assets/build/radar-rules.json`、`radar-rules.js`、`maintainers.json`、`routes.json`、`routes.js`、`route-paths.ts`），随后执行 `scripts/workflow/build-docs.ts` 加载全部命名空间并生成 `assets/build/docs/routes.json` 与 `assets/build/docs/categories.json`。
2. **启动本地 `RSSHub-docs` 供用户验收文档渲染**：
   - 将 `RSSHub/assets/build/docs/routes.json` 与 `categories.json` 复制到 `RSSHub-docs/src/public/`。
   - 在 `RSSHub-docs` 启动本地开发服务器：
     ```bash
     pnpm docs:dev --host localhost --port 5173 --strictPort
     ```
   - 打开并向用户提供本地双语文档预览地址（例如英文 `http://localhost:5173/routes/<namespace>` 与中文 `http://localhost:5173/zh/routes/<namespace>`），确认 `name` / `description` / `parameters` / 示例路径 / 表格渲染准确无误，等待用户验收。
3. **启动本地 `RSSHub` 服务并验证真实抓取数据**：
   - 在 `RSSHub` 根目录启动本地 HTTP 服务（Windows 建议使用 `tsx` 直接启动，避免 `tsx watch --inspect` 挂起）：
     ```bash
     pnpm exec tsx lib/index.ts
     ```
   - 访问 `http://localhost:1200/<route>` 实测关键参数组合（如 `?limit=1`、默认路由、专题/分类过滤、`?format=json` 等），检查标题、链接、发布时间、`author`、封面/正文图片、`description` 全文质量及无 `http://` 混合内容问题。
4. **使用 Codex（`gpt-6.2-sol` + 高思考程度 `high`）进行代码 Review**：
   - 若本机尚未安装 Codex CLI（或版本过旧不支持 `gpt-6.2-sol`），先全局安装/升级：`npm install -g @openai/codex@latest`（若使用 Vite+ 工具链可执行 `vp add -g @openai/codex@latest`）；
   - 在提交前针对未提交代码执行高思考力度 Review：
     ```bash
     codex review --uncommitted -c model="gpt-6.2-sol" -c model_reasoning_effort="high"
     ```
   - 用真实线上数据核查 Codex 指出的 P0/P1/P2 问题，修复并重跑静态校验与本地实测后，将 **本地文档预览地址**、**Review 修复结论** 与 **真实抓取的数据样本/质量统计** 一并提交给用户验收；验收通过后再进入第 3 步合并部署到自建 `ljh12138164/RSSHub`。

### 第 3 步：自建 RSSHub 上线与实测验收

1. 将验证通过的路由同步/部署至自建实例（将改动合并/cherry-pick 至 `ljh12138164/RSSHub` `master` 推送以部署主实例 `https://rss.ljhboard.cn`；若需同步更新备用分流实例 `https://rss1.ljhboard.cn`，还需前往二次 fork 仓库 `ljh-project/RSSHub` 执行 `Sync fork -> Update branch`）。
2. 对已上线的自建路由做匿名 HTTP 探测：
   - 分别检查默认路径与 `?limit=1`、`?limit=<default/max>`：HTTP `200`、响应为有效 RSS XML、所有条目 `link` 去重且唯一、`pubDate` 合法、全文 `description` 非空且保留正文核心内容与图片。

### 第 4 步：`rss-site` 新增平台接入

在 `rss-site` 仓库基于最新 `origin/master` 切出 `feat/<source>` 分支，按项目规范逐项接入并测试：

1. `packages/signals/src/index.ts`：注册新信号源（`id`、`name`、`section`、`feedUrl` / RSSHub 路径由 `resolveSignalFeedUrl` 解析，默认 `RSSHUB_BASE_URL` 为 `https://rss.ljhboard.cn`，如需分担 Vercel 免费额度可在配置中指向备用实例 `https://rss1.ljhboard.cn`）。
2. `deploy/postgres/migrations/*.sql`：新增可重复执行 SQL 迁移，同步更新 `ingestion_runs`、`source_status`、`hot_items`、`signal_articles` 4 张表的 CHECK 约束。
3. `deploy/server/business-jobs.json`：添加对应抓取 job；依据 `AGENTS.md`，新源初始保持禁用（待线上验收门禁通过后再激活）。
4. `apps/web/components/source-icon.tsx`：按需补充专属图标（缺省回退使用 `code`）。
5. 测试与本地门禁：补充或更新对应测试与 `docs/development/<source>.md`，运行并确保以下全部通过：
   ```bash
   pnpm format:check
   pnpm lint
   pnpm check-types
   pnpm test
   pnpm build
   ```

### 第 5 步：推送 `rss-site` 分支并直接创建 PR（返回 PR 地址）

遵守 **不通过网页 UI 操作、且不自动合并 PR** 的原则，按仓库所有者约定的工作流区分内外仓库分工：
1. 提交并推送 `feat/<source>` 分支到 `origin`（创建前先通过 `gh pr list` 确认不存在重复开放 PR）。
2. 由代理通过 GitHub CLI（`gh pr create`）而非网页 UI 直接创建合入 `master` 的 PR，禁止执行 `gh pr merge` 自动合并：
   ```bash
   gh pr create --repo ljh12138164/rss-site --base master --head feat/<source> --title "<title>" --body "<summary>"
   ```
   > 注：与 `AGENTS.md` 的 `Pull requests` 规则保持一致——内部仓库 `rss-site` 由代理通过 `gh` CLI 创建 PR 并交付地址、由用户审核合并；第 7 步上游 `DIYgod/RSSHub` PR 仍严格仅输出文案，由用户本人提交。
3. 向用户返回 **已创建的 PR 地址**（`https://github.com/ljh12138164/rss-site/pull/<编号>`）、源分支 `feat/<source>`、目标分支 `master` 及本地验证结果，由用户复核 CI 并完成合并。

### 第 6 步：合并发布后自动试抓激活与线上复核

PR 合并并经发布工作流将 Next 服务及 `deploy/postgres/migrations/` 迁移部署至生产 ECS PostgreSQL 后，`deploy-rss-site` 会按 `AGENTS.md` 新信号源门禁自动完成新增来源试抓与激活：

1. **自动试抓与增量激活（默认链路）**：`sync-business-cron` 同步清单时将新增或路径变更任务标记为 `verified = false`；版本健康且解除回滚后，`sync-business-cron --activate-unverified` 检查无残留旧业务 timer、通过容器本地回环调用新源 `POST /cron/signals/:source` 与 `/cron/verify/:source` 核验入库，并调用 `private.activate_verified_business_jobs(jsonb)` 仅激活本次通过验证的新增任务（不影响存量任务，单源失败不回滚发布）。
2. **线上公开接口复核**：观察 CI 部署日志确认自动激活成功后，抽检公开 `/feeds/*.xml`、频道页与文章详情页展示正常。
3. **故障重试或全量兜底（仅自动激活失败时）**：若新源上线时因上游波动未能自动激活，修复后可在 ECS 运行 `sudo /usr/local/sbin/sync-business-cron --activate-unverified` 重试未激活源，或按需执行全量门禁：
   ```bash
   pnpm setup:cron --output docs/development/evidence/<source>-setup-cron.json
   ```
   确认全部来源通过后调用 `private.activate_business_jobs(jsonb)`。
4. 在需要留档时将非敏感验收信息（HTTP 状态码、激活数、日志检查结果）记录至 `docs/development/<source>.md`（严禁打印或提交数据库 URL、Token、Vault 值或 Cron 密钥）。

### 第 7 步：输出 `DIYgod/RSSHub` 上游 PR 文案（代理只负责写文案，由用户本人提交上游 PR）

> **执行边界**：代理**不调用 CLI / 网页向上游 `DIYgod/RSSHub` 创建 PR**，仅推送分叉分支并在本步给出可直接复制提交的 PR 标题与正文文案，由用户自行检查并向上游发起 PR。

对照本人既往上游 PR 的实际风格（[`#23882`](https://github.com/DIYgod/RSSHub/pull/23882) MiniMax、[`#23881`](https://github.com/DIYgod/RSSHub/pull/23881) Cohere、[`#23872`](https://github.com/DIYgod/RSSHub/pull/23872) Arm、[`#23861`](https://github.com/DIYgod/RSSHub/pull/23861) Groq、[`#23854`](https://github.com/DIYgod/RSSHub/pull/23854) Mistral）以及上游 `scripts/workflow/test-route/identify.mjs` / `.github/PULL_REQUEST_TEMPLATE.md` 强制校验规则，生成上游 PR 文案时必须遵守以下硬性约定：

1. **禁止删改 4 个双语 `##` 模板标题及检查栏（`identify.mjs` 精确校验红线）**：
   - 上游 CI（`scripts/workflow/test-route/identify.mjs`）会用 `remarkParse` 对非写权限提交者的 PR 逐字校验 4 个 `##` 二级标题：
     - `Involved Issue / 该 PR 相关 Issue`
     - `Example for the Proposed Route(s) / 路由地址示例`
     - `New RSS Route Checklist / 新 RSS 路由检查表`
     - `Note / 说明`
   - 并且要求检查表下至少包含 `5` 个标准 `- [ ]` / `- [x]` 复选框。**即使输出“纯英文复制粘贴版 GitHub PR 正文”，也必须原字保留这 4 个双语 `##` 标题和完整检查表项（切勿擅自删掉 `/ 中文`）**，否则会在 `routes` 写法正确的情况下仍被判为 `auto: route no found` 并自动关闭 PR（`#23992` 踩坑实证）；对于修复既有路由的 PR，检查表中 `New Route / 新的路由` 与 `Follows Script Standard` 保持 `- [ ]` 不勾选。
2. **Issue 固定写法**：无关联 Issue 时统一写 `N/A`（不要留空、不要保留 `Close #` 或 HTML 注释占位）。
3. **`routes` 块精简写法（不展开分类子路径）**：` ```routes``` ` 仅填写默认主路由（如 `/80lv/articles`、`/arm/news`、`#23882` 中并列路由 `/minimax/blog` + `/minimax/news` 等），**不要把 `:category?` / `:topic?` 等可穷举分类路径全部展开塞进 PR 文案**。
4. **正文风格统一为精炼英文（对齐 `#23872` / `#23881` / `#23882`）**：
   - **禁止**在 `## Note / 说明` 正文中拆成 `### English` 与 `### 中文说明` 双段模板；
   - **禁止**使用 `Highlights:` / `主要实现：` 等 AI 模板小标题，也**不要**把 `oxlint`、`lizard`、`oxfmt` 等本地代码检查命令堆进上游 PR 说明；
   - `## Note / 说明` 用 1 句综述 + 2–3 条简明英文要点说明上游接口/抓取方式、`cache.tryGet` 缓存与渲染内容、参数/`Radar`/无新增依赖及无 Puppeteer；
   - `### Validation` 直接列出针对线上/本地实测路由的结果（如默认路由、`?limit=1`、`?limit=100` 等条数、HTTP `200`、正文与合法 `pubDate`）。
5. 若需给用户提供中文理解或核对，仅在对话中简述或按需单独附注，不混入 PR 正文。
6. 若使用外层 Markdown 代码块包裹带 ```` ```routes ```` 的 PR 正文供复制，外层须使用 **4 个反引号（````` ````markdown `````）**，避免内层三反引号提前闭合。

#### 7.1 PR 标题模板

- **新增路由（默认）**：`feat(route): add <Platform> full-text <articles/news/blog> route`（如 `feat(route): add 80 Level full-text articles route`、`feat(route): add MiniMax full-text blog and news routes`）
- **升级/修复现有路由**：`feat(route/<namespace>): upgrade /<namespace>/<route> to full-text feed ...`（如 `#23881`）或 `fix(<namespace>): ...`（如 `#23992`）

#### 7.2 上游 PR 正文模板（对照 `#23872` / `#23881` / `#23882` 与 `.github/PULL_REQUEST_TEMPLATE.md`）

````markdown
## Involved Issue / 该 PR 相关 Issue

N/A

## Example for the Proposed Route(s) / 路由地址示例

```routes
/<namespace>/<route>
```

## New RSS Route Checklist / 新 RSS 路由检查表

- [x] New Route / 新的路由
    - [x] Follows [Script Standard](https://docs.rsshub.app/joinus/advanced/script-standard) / 跟随 [路由规范](https://docs.rsshub.app/zh/joinus/advanced/script-standard)
- [ ] Anti-bot or rate limit / 反爬/频率限制
    - [ ] If yes, do your code reflect this sign? / 如果有, 是否有对应的措施?
- [x] [Date and time](https://docs.rsshub.app/joinus/advanced/pub-date) / [日期和时间](https://docs.rsshub.app/zh/joinus/advanced/pub-date)
    - [x] Parsed / 可以解析
    - [x] Correct time zone / 时区正确
- [ ] New package added / 添加了新的包
- [ ] `Puppeteer`

## Note / 说明

Adds a full-text feed for <Platform> under `/<namespace>/<route>`:

- **Source & caching**: Queries <official API / RSS / SSR listing> and fetches full article details via `cache.tryGet` (bounded concurrency), populating titles, authors, categories/tags, cover images, and `pubDate` timestamps.
- **Content rendering**: Renders rich HTML content (headings, images, code blocks, quotes, tables, embeds) cleanly and normalizes/sanitizes links and media.
- **Parameters & metadata**: Defaults to <N> items, supports RSSHub's common `limit` parameter (`1..100`) and optional parameters (`:category?` / `:lang?` when applicable), and adds Radar rules and English/Chinese documentation without new dependencies or Puppeteer.

### Validation

- Verified against the deployed route: `/<namespace>/<route>` (<N> items), `/<namespace>/<route>?limit=1` (1 item), and `/<namespace>/<route>?limit=<max>` (<max> items) all returned HTTP 200 with full article content, unique links, and valid `pubDate` timestamps.
````

---

## 五、历史实现常见问题与 CI / Review 避坑清单（基于 `#23881` Cohere 与 `#23882` MiniMax 实证）

在 `Cohere`（`DIYgod/RSSHub#23881`）与 `MiniMax`（`DIYgod/RSSHub#23882`）开发、Codex 复审及 `rss-site` / ECS 上线过程中真实暴露过以下问题。后续新增任何平台路由或接入 `rss-site` 前，必须在本地逐项核对清零，避免提交 PR 后反复返工。

### 5.1 CI 严格 Lint 规则（`oxlint.ci.config.ts` / `anti-slop/*` / `#23986`）

- **问题表现**：PR `#23881` 遭 `github-advanced-security` Bot 报多条 `oxlint / anti-slop(no-known-value-widening)`（如 `const HEADING_MAP: Record<string, string> = { ... }`、`const DECORATOR_MAP: Record<string, [string, string]> = { ... }`、渲染函数返回匿名宽泛对象类型）；`#23882` 初版 `utils.ts` 触发 `anti-slop(no-unknown-parameters)`（`(node: unknown, urls: string[])`）及 `Record<...>` 注解；2026-11-23 `#23986` 后上游新增禁用 `Number.isSafeInteger()`、`Number.isFinite()`、Cheerio `.clone()`、`Array#some` 中 `Boolean()`、`.catch(() => undefined)` 以及动态 `String#replaceAll()` 等严格限制，并把配置文件从 `.oxlintrc.ci.json` 迁至 `oxlint.ci.config.ts`。
- **根因**：上游 CI（`.github/workflows/lint.yml`）实际执行 `pnpm exec oxlint --type-aware --config oxlint.ci.config.ts`，其中启用了 `anti-slop/*` / `quality/*` 且设置了 `respectEslintDisableDirectives: false`（禁止用注释压制告警）。
- **硬性规避**：
  1. 静态映射表（语言配置、标题/标签映射、样式字典）保留类型推导或使用 `as const` / `as const satisfies ...`，**严禁**声明 `Record<string, ...>` 或宽松匿名对象返回类型；
  2. **严禁**给函数参数或返回值标注 `unknown` / `Record<string, unknown>`（仅保留显式边界 `JSON.parse` + 窄类型守卫 `isRecordObject`，例如直接在行文本解析边界完成字段读取）；
  3. 避免使用被禁用的 `Number.isFinite` / `Number.isSafeInteger` / `.clone()` / `.catch(() => undefined)`；
  4. 提交前必须运行：
     `pnpm exec oxlint --type-aware --config oxlint.ci.config.ts --deny-warnings lib/routes/<namespace>`。

### 5.2 JSX 正文模板、无手写转义与文件精简边界（PR Auto Review 第 25 条 & `#23881` `6503c54`）

- **问题表现**：`#23881` 初版及 `MiniMax` 初版曾用模板字符串拼 HTML、手写 `escapeHtml()`、或用 `cheerio.load('', null, false)` / `$('<video controls>')` 拼装输出，被上游要求改为 JSX 模板（维护者在 `6503c54` 亲自重构成 `templates/description.tsx`）；同时 `MiniMax` 初版元数据兜底误包含 `[metaDescription, title]`，违反规则 11；而单路由额外拆出 `types.ts` 也属于过度拆分。
- **硬性规避**：
  1. 凡自建拼装正文、音视频包装或摘要兜底 HTML，统一放在 `lib/routes/<namespace>/templates/description.tsx`，通过 `hono/jsx/dom/server` 的 `renderToString` 渲染并自动转义，**禁止**手写 `escapeHtml` 或模板字符串拼 HTML；
  2. 不额外创建纯类型拆分文件 `types.ts`（仅当助手函数确被路由与 `templates/description.tsx` 共用时保留精简 `utils.ts`），也不在 `lib/routes/` 下保留测试文件（遵循上游 `AGENTS.md` 第 50 条）；
  3. **禁止**在 `description` 中重复拼接 `title`、`author`、`pubDate`、`H1` 或分类标签（规则 11）；**禁止**在路由内重新遍历补全相对图片/链接或注入 `referrerpolicy`（`lib/middleware/parameter.ts` 已统一处理）。

### 5.3 CodeQL 安全扫描与域名边界校验

- **问题表现**：`#23881` YouTube 视频 URL 解析被 `github-advanced-security` / CodeQL 检出 2 条域名校验缺陷——仅用字符串包含或后缀检查未做域名边界界定，导致 `notyoutube.com` 等伪造主机绕过校验。
- **硬性规避**：
  1. 任何外链/媒体白名单校验必须用 `new URL(raw, BASE_URL)` 解析，明确限制协议白名单（如仅允许 `http:` / `https:` / `mailto:`，拒绝 `javascript:` / `data:`）；
  2. 域名匹配必须写成 `hostname === 'youtube.com' || hostname.endsWith('.youtube.com')`，禁止 `.includes('youtube.com')` 或 `host.endsWith('youtube.com')`（缺前导点）。

### 5.4 CodeFactor 圈复杂度阈值告警

- **问题表现**：`#23881` 即使由维护者合并 `6503c54` 后，仍被 CodeFactor 阻塞 3 条复杂度告警：`handler`（`32`）、`renderSpecialBlock`（`21`）、`renderBlocks`（`18`），不得不二次提交 `bd113a1` 拆分成小函数（降至 `7 / 2 / 10`）；`#23882` 初版也有两处达到 `CCN = 12`。
- **硬性规避**：
  1. 按数据源拉取/映射、源合并去重、块分派与媒体提取拆分为顶层单一职责纯函数；
  2. 推送前运行本地复杂度门禁（目标函数与闭包 `CCN <= 10`）：
     `uvx --from lizard lizard -l typescript -C 10 -w lib/routes/<namespace>`。

### 5.5 真实全量回归（多 CMS 并存、语言参数、公式/FAQ/多媒体）

- **问题表现**：`#23881` 切换至 Sanity Content Lake 后遗漏了仍仅存于 Ghost CMS 的历史文章，且过滤条件静默丢弃 `latex` 行内/块级公式及 `blogFaqSection` 问答块；`#23882` 则需同时兼顾官网中英文双域名（默认英文 `minimax.io`、可选 `:lang?` 切 `minimax.cn`）、Next.js RSC 内嵌 `<video>`、MathML `<math>`、`/api/news` 与双排版详情页及 `/_next/image` 代理还原。
- **硬性规避**：
  1. 不能只用 `?limit=1` 看 HTTP 200 就收工，必须在 `?limit=100` 下对比官网真实文章清单与逐篇 DOM，检查是否存在新旧双 CMS 混存、多语言路由参数及分页遗漏；
  2. 逐项核查数学公式（`LaTeX` / `MathML`）、FAQ / Takeaways、表格、代码块、`<audio>` / `<video>`、封面海报与内嵌图片 URL 还原（如 Next.js `/_next/image`、相对路径），确保无静默丢失；
  3. 禁止硬编码 Next.js 构建哈希等易失效静态凭证（必要时从公开 SSR 页面动态读取）。

### 5.6 Git 工作流、Windows 行尾与 Vercel 双实例同步

- **问题表现**：Windows 配置 `core.autocrlf = true` 时，运行 `oxfmt` 或 `build:docs` 后易在 `git status` 残留无实质语义的 LF/CRLF 假修改；同时主仓库更新后若遗漏同步 `ljh-project/RSSHub` 会导致 `https://rss1.ljhboard.cn` 短暂滞后于 `https://rss.ljhboard.cn`。
- **硬性规避**：
  1. 提交或切换分支前执行 `git diff --ignore-all-space` 复核无多余行尾改动，再 `git checkout -- <path>` 清理纯行尾 stat 噪音；
  2. 自建主库 `ljh12138164/RSSHub` `master` 推送后，务必确认 Vercel commit status 为 `success` 再触发 `rss-site` / ECS 生产验证，并提醒/同步备用仓库 `ljh-project/RSSHub`；
  3. 禁止在未与需求确认的情况下跨仓混改上游无关文件。

### 5.7 Windows `alibabacloud-workbench-cli` ECS 运维避坑

- **问题表现**：在 Windows 直接执行 `workbench exec ...` 未传 `--output json` 会因交互管道参数报 `dial tcp: address \\.\pipe\workbench-exec-...: missing port in address`；短生命周期命令若被超时或子进程强杀导致未关闭远端会话，服务端默认保留 **30 分钟** 空闲会话，累计后触发 `Forbidden.SessionLimit` 阻塞后续操作；此外 `docker compose exec -T` 若未加 `</dev/null` 会提前消耗外层标准输入流。
- **硬性规避**：
  1. **每次** `workbench exec` 必须携带 `--output json`；
  2. 多行远端脚本统一先编码为单行 Base64，再通过 `bash -c 'source <(echo <b64>|base64 -d)'` 执行，且内部 `docker compose exec -T` 命令末尾均加 `</dev/null`；
  3. 用单次集成脚本尽量减少开启会话次数，且**无论成败**命令末尾都必须执行 `workbench session close --all` 与 `workbench daemon stop`，严禁泄漏半开会话；
  4. 执行敏感操作（如 `POST /cron/*` 或 `private.activate_business_jobs`）优先在 `rss-site-web-1` 容器内直接读取内存中的 `process.env.CRON_SECRET` 发起回环调用，只输出脱敏状态与数量统计，**严禁**回显、打印或落盘任何密钥与数据库 URL。

### 5.8 PR 正文模板标题强校验与 `#23992` `/nextjs/blog` 实证

- **问题表现**：PR `#23992` 代码检查（`Anti Slop` / `CodeFactor` / `CodeQL` / `Lint` / `oxlint` / `Vitest` / `Docker build`）全部通过，但因把模板的 4 个双语 `##` 标题裁为纯英文（删掉了 `/ 该 PR 相关 Issue` 等中文部分），仍被 `github-actions` 判定 `auto: route no found`、`auto: DO NOT merge` 并自动关闭。
- **根因**：`scripts/workflow/test-route/identify.mjs` 对无写权限贡献者的 PR 强制精确匹配 4 个 `##` 标题文本（`Involved Issue / 该 PR 相关 Issue`、`Example for the Proposed Route(s) / 路由地址示例`、`New RSS Route Checklist / 新 RSS 路由检查表`、`Note / 说明`）及不少于 `5` 个检查表复选框，任意一项缺失即置 `searchStart = -1` 放弃扫描 ```` ```routes ````。
- **硬性规避**：
  1. 复制给用户的 GitHub PR 文案**必须**原字保留 `.github/PULL_REQUEST_TEMPLATE.md` 的 4 个双语 `##` 标题及检查表骨架，仅保持 `Note / 说明` 正文为简洁英文；
  2. 提交修复前先同步确认最新 `upstream/master` 是否顺带改到同一文件或 `oxlint.config.ts`（如 `#23986` 同步改了 `lib/routes/nextjs/blog.ts` 导致 compare 页显示 `Can't automatically merge`）；
  3. 遇 `auto: route no found` 关闭时，先修改 PR 正文为合法双语模板标题再点击 `Reopen pull request`（或编辑正文触发 `PR - Docker build test` -> `PR - route test`）。
