# RSSHub 待新增路由候选与标准化交付工作流

- **调研日期**：2026-11-13（2026-11-14 同步进度与自建实例说明）
- **`rss-site` 基线**：`master` @ `32489cc` + `feat/cohere-source`（已接入 `cohere`，`packages/signals/src/index.ts` 已注册 `49` 个源，分属 `7` 个分区：`ai` 12、`technology` 12、`news` 6、`social` 6、`finance` 5、`games` 6、`skills` 2；`deploy/server/business-jobs.json` 含 `48` 个信号抓取任务（不含 `chatgpt`）及 `4` 个维护任务 `retention`、`hot-ranking-log-retention`、`zhihu-cookie`、`publication-outbox`，共 `52` 项）
- **RSSHub 基线与自建实例**：上游 `DIYgod/RSSHub`（`master`）与自建分叉 `ljh12138164/RSSHub`（本地 `master` 已解决冲突并合并同步至 `upstream/master`）。线上部署两个自建实例：**主实例 `https://rss.ljhboard.cn`**（部署自 `ljh12138164/RSSHub` `master`）与 **备用/分流实例 `https://rss1.ljhboard.cn`**（部署自二次 fork 仓库 `ljh-project/RSSHub` `master`，fork 自 `ljh12138164/RSSHub`，用于分担请求、防止单个 Vercel 项目免费额度提前用完；主分叉 `master` 更新后需同步 `ljh-project/RSSHub` 的 `Sync fork -> Update branch` 才会触发 `rss1.ljhboard.cn` 重新部署）。
- **分支与 PR 边界约定**：后续所有 RSSHub 新路由开发**统一从上游 `DIYgod/RSSHub` 的 `master` 分支切出独立 `feat/*` 分支实现**（例如 `git checkout -b feat/<route> upstream/master`）；**代理仅负责实现路由、本地校验、部署自建与生成中英文上游 PR 文案，禁止自行向上游 `DIYgod/RSSHub` 提交 PR**，上游 PR 统一由用户本人提交。

---

## 一、RSSHub 没有 + 官网也无原生 RSS（必须新建抓取路由）

以下平台经实时探测确认：**上游 `DIYgod/RSSHub` `master` 无对应路由（404）**，且**官网无原生 RSS/Atom feed**，需要新建 API 或 HTML/SSR 抓取路由。

### 1.1 科技 / AI / 硬件

| 平台 | 首页 / 列表页 | RSSHub 上游 | 官网原生 RSS | 探测实证与抓取方案 |
| :--- | :--- | :--- | :--- | :--- |
| **Arm Newsroom** | `https://newsroom.arm.com/` | ✅ 已完成（上游 PR `#23872`，`master` @ `0db3292f4`）；`rss-site` PR `#82` 已接入 | 无（HTML 无 RSS link） | 公开 WordPress REST API（`/arm/news` 与 `/arm/blog`）；`rss-site` `technology` 分区已上线 `arm` 合并源。 |
| **Cohere Blog** | `https://cohere.com/blog` | ✅ 已完成：自建 `https://rss.ljhboard.cn/cohere/blog` 已上线（`master` @ `31e6563b`，源分支 `feat/cohere-blog` @ `20e227784`）；`rss-site` 已在 `feat/cohere-source` 接入（上游 PR 文案已交付待用户提交） | 无 | 官网同时保留 Sanity Content Lake（`rjtqmwfu.apicdn.sanity.io` / `web3-prod`）与 Ghost Content API 两部分文章。新路由并发合并双源、按 URL 去重时间排序后截取 `limit`，支持 Portable Text 全文、行内/块级 LaTeX 公式、`blogFaqSection` 问答、`keyTakeaways`、表格、代码块及音视频嵌入。 |
| **MiniMax** | `https://www.minimax.cn/news` | 无（`404`） | 无 | 列表页 `200`（`53,336` 字节，`next:true`）；文章页实测 `https://www.minimax.cn/blog/minimax-m31f` 返回 `200`（`71,778` 字节，`cf:false`）。注：`.io` 同文章（`https://www.minimax.io/news/minimax-m31f`）返回 `500`（`20,192` 字节），路由应优先以 `minimax.cn` 为主。 |
| **Moonshot / Kimi Blog** | `https://www.kimi.com/blog/` | 无（`moonshot` / `kimi` 均 `404`） | 无 | 列表页 `200`（`201,042` 字节，`next:true`，可见 headings `["研究"]`），适合基于 SSR 页面解析列表与文章全文。 |

### 1.2 游戏 / 游戏技术

| 平台 | 首页 / 列表页 | RSSHub 上游 | 官网原生 RSS | 探测实证与抓取方案 |
| :--- | :--- | :--- | :--- | :--- |
| **80 Level** | `https://80.lv/articles/` | 无（`80lv` / `80.lv` 均 `404`） | 无 | 列表页 `200`（`70,767` 字节，`__NEXT_DATA__:true`）；文章页实测 `https://80.lv/articles/bioware-co-founder-explains-the-usd200-million-problem-with-reviving-mass-effect` 返回 `200`（`107,570` 字节，`cf:false`），可基于 `__NEXT_DATA__` / SSR HTML 与原文页面构建全文路由。 |
| **Unity Blog** | `https://unity.com/blog` | 无（`unity` `404`） | 无 | 列表页 `200`（`761,933` 字节，`next:true`，存在 SSR 标题），可通过 SSR HTML 列表结合原文页面抓取。 |

### 1.3 较复杂的 SPA / 后端接口型候选（备选）

| 平台 | 首页 | RSSHub 上游 | 官网原生 RSS | 探测实证与复杂度说明 |
| :--- | :--- | :--- | :--- | :--- |
| **游戏葡萄** | `https://youxiputao.com/` | 无（`youxiputao` `404`） | 无 | 首页 `200`（`103,519` 字节），静态 HTML 未直接暴露文章列表链接，需逆向前端新闻列表 API。 |
| **篝火营地** | `https://gouhuo.qq.com/` | 无（`gouhuo` `404`） | 无 | 首页 `200`（`217,140` 字节），`/news` 返回 `404`，首页静态 HTML 缺少直达文章链接，需排查后端 API。 |

---

## 二、RSSHub 没有（或缺子路由）+ 官方 RSS 不完整（仅摘要，需抓原文补全文后提 PR）

以下平台已有官方 RSS/Atom，但**官方源仅输出摘要/短截断正文**，且上游 `DIYgod/RSSHub` 尚无对应路由（或缺少对应子路由）。通过 RSSHub 读取官方 feed 发现条目并并发抓取文章原文补全全文，即可满足上游 PR 价值。

### 2.1 科技 / AI / 开发工具

| 平台 | 官方 RSS / Atom 地址 | RSSHub 上游状态 | 探测实证（Feed 正文长度 / 原文页状态） |
| :--- | :--- | :--- | :--- |
| **vLLM Blog** | `https://vllm.ai/blog/rss.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 194`，description only）；文章页 `200`（`135,862` 字节）。 |
| **Apple ML Research** | `https://machinelearning.apple.com/rss.xml` | 缺子路由（`lib/routes/apple` 仅有 `apps.ts`、`design.ts`、`exchange-repair.ts`、`namespace.ts`、`newsroom.ts`、`podcast.ts`、`security-releases.ts`，无 ML 路由） | Feed 仅含摘要（`rssBodyWords: 597`，description only）；文章页 `200`（`31,494` 字节）。 |
| **Supabase Blog** | `https://supabase.com/rss.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 155`，description only）；文章页 `200`（`175,137` 字节）。 |
| **Deno Blog** | `https://deno.com/feed` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 66`，description only）；文章页 `200`（`64,335` 字节）。 |
| **Together AI Blog** | `https://www.together.ai/blog/rss.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 155`，description only）；文章页 `200`（`682,220` 字节）。 |
| **Tailscale Blog** | `https://tailscale.com/blog/index.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 86`，description only）；文章页 `200`（`135,784` 字节）。 |
| **Figma Blog** | `https://www.figma.com/blog/feed/atom.xml` | 无（`404`） | Atom 仅含摘要（`rssBodyWords: 136`，`content: 136`）；文章页 `200`（`1,777,788` 字节）。 |

> 注：**Mistral AI**（`lib/routes/mistral`，含 `namespace.ts` 与 `news.ts`）已通过上游 PR `#23854` 合入 `DIYgod/RSSHub` `master` 并随本次冲突解决合并至本地 `RSSHub` `master`；按用户指令，本轮跳过 Mistral AI，暂不接入 `rss-site`。

### 2.2 游戏 / 游戏媒体与引擎

| 平台 | 官方 RSS / Atom 地址 | RSSHub 上游状态 | 探测实证（Feed 正文长度 / 原文页状态） |
| :--- | :--- | :--- | :--- |
| **Godot Engine News** | `https://godotengine.org/rss.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 84`，description only）；文章页 `200`（`19,633` 字节）。 |
| **Game Developer** | `https://www.gamedeveloper.com/rss.xml` | 无（`404`） | Feed 仅含摘要（`rssBodyWords: 135`，description only）；文章页 `200`（`456,450` 字节，`cf:false`）。 |
| **Gematsu** | `https://www.gematsu.com/feed` | 无（`404`） | Feed 仅含短摘要（`rssBodyWords: 120`，`enc: 120`）；文章页 `200`（`98,117` 字节）。 |
| **VGC (Video Games Chronicle)** | `https://www.videogameschronicle.com/feed/` | 无（`vgc` / `videogameschronicle` 均 `404`） | Feed 仅含短摘要（`rssBodyWords: 87`，`enc: 87`）；文章页 `200`（`75,665` 字节）。 |
| **Rock Paper Shotgun** | `https://www.rockpapershotgun.com/feed/` | 无（`404`） | Feed 仅含短描述（`enc: 0 \| desc: 360`）；文章页 `200`（`245,014` 字节，`cf:false`）。 |

---

## 三、暂不提上游 RSSHub PR 的排除项说明

1. **官方 RSS 已自带较完整正文（可直接作为 `rss-site` `feedUrl` 评估，无需额外做 RSSHub 路由）**：
   - `Vercel`（`https://vercel.com/atom`，`bodyLen: 2465`）
   - `VoidZero`（`https://voidzero.dev/feed.xml`，`bodyLen: 14721`）
   - `Chips and Cheese`（`https://chipsandcheese.com/feed/`，全站 feed `1.64 MB`）
   - `Linear Now`（`https://linear.app/rss/now.xml`，`enc: 7529`）
   - `Ars Technica`（`https://arstechnica.com/information-technology/feed/`，`enc: 1459`）
   - `404 Media`（`https://404media.co/rss/`，`enc: 4109`）
   - `Bun`（`https://bun.com/rss.xml`，`desc: 917`）
   - `IGN`（`https://ign.com/rss/articles/feed?tags=games`，`enc: 1816`）
   - `PC Gamer`（`https://pcgamer.com/rss/`，`enc: 2252`）
   - `PlayStation Blog 繁中`（`https://blog.zh-hant.playstation.com/feed/`，`enc: 2438`）
   - `Xbox Wire`（`https://news.xbox.com/en-us/feed/`，`enc: 6242`）
   - `GameLook`（`http://www.gamelook.com.cn/feed/`，`31` 条含全文；注意 HTTPS 会触发 `ECONNRESET`）
2. **上游 `DIYgod/RSSHub` 已存在对应路由（可直接复用或按需增补子路由）**：
   - `mistral`（已合入 `#23854`）、`cursor`、`anthropic`、`ollama`、`zed`、`huggingface`、`perplexity`、`baai`、`modelscope`、`qbitai`、`infoq`、`yystv`（原生 `yystv.cn/rss/feed` 亦有 `2,588` 字符全文）、`steam`、`eurogamer`、`lobsters`、`phoronix`、`taptap`、`xiaoheihe`、`a9vg`、`gameres`。
3. **当前存在反爬拦截 / 纯空壳 SPA 阻碍**：
   - `GameSpot`（文章页 `403(CF)`）、`xAI`（`403` CF）、`VideoCardz`（`403` CF）、`Intel Newsroom`（`403` Akamai）、`Unreal Engine Blog`（`/blog` `403`，`/rss` 含畸形 `&lt;p&gt;` 标题及 `341` 字符正文）、`Perplexity Hub`（直连 Web `403` CF，但 RSSHub 已有对应路由）、`机器之心`（静态页面仅 `3,251` 字节壳）、`ByteDance Seed`（静态页面仅 `10,983` 字节壳）。

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
```

> **Windows 环境说明**：若仓库内存在历史路径或全量校验受环境限制，可同时运行针对新增命名空间的检查命令确保零告警：`pnpm exec oxfmt --check lib/routes/<namespace>`、`pnpm exec oxlint --type-aware lib/routes/<namespace>`、`pnpm exec eslint lib/routes/<namespace>`，并与 `pnpm run typecheck` 配合验证。

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
4. **使用 Codex（`gpt-6.1-sol` + 高思考程度 `high`）进行代码 Review**：
   - 若本机尚未安装 Codex CLI（或版本过旧不支持 `gpt-6.1-sol`），先全局安装/升级：`npm install -g @openai/codex@latest`（若使用 Vite+ 工具链可执行 `vp add -g @openai/codex@latest`）；
   - 在提交前针对未提交代码执行高思考力度 Review：
     ```bash
     codex review --uncommitted -c model="gpt-6.1-sol" -c model_reasoning_effort="high"
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

### 第 6 步：合并发布后线上回归与 Cron 验收

PR 合并并经发布工作流将 Next 服务及 `deploy/postgres/migrations/` 迁移部署至生产 ECS PostgreSQL 后，严格执行 `AGENTS.md` 新信号源门禁：

1. 使用服务端 `CRON_SECRET` 手动调用生产接口 `POST /cron/signals/:source`。
2. 通过鉴权 Next 校验接口 `/cron/verify/:source` 或受权服务端查询核验生产库：
   - `ingestion_runs` 本次运行成功；
   - `source_status` 已更新；
   - `hot_items`（及 `signal_articles`）至少写入 1 条数据，且标题、URL、来源、分区、排序与发布时间合理；
   - 核验线上 `/feeds/*.xml` 及首页热度参与逻辑（如适用）展示正常。
3. 运行全量配置验收生成证据文件（脚本本身不启用任务）：
   ```bash
   pnpm setup:cron --output docs/development/evidence/<source>-setup-cron.json
   ```
   确认全部来源通过后，再通过 `private.activate_business_jobs(jsonb)` 启用新源的 PostgreSQL Cron 任务，并确认旧写入端/已替代定时器已关闭。
4. 将非敏感验收证据（HTTP 状态码、条数、batch ID、时间戳、数据质量检查）写入 `docs/development/<source>.md`（严禁打印或提交数据库 URL、Token、Vault 值或 Cron 密钥）。

### 第 7 步：输出 `DIYgod/RSSHub` 上游 PR 文案（代理只负责写文案，由用户本人提交上游 PR）

> **执行边界**：代理**不调用 CLI / 网页向上游 `DIYgod/RSSHub` 创建 PR**，仅推送分叉分支并在本步给出完整的中英文 PR 标题与正文文案，由用户自行检查并向上游发起 PR。

对照本人既往已合入上游的 PR（[`#23861`](https://github.com/DIYgod/RSSHub/pull/23861) Groq、[`#23854`](https://github.com/DIYgod/RSSHub/pull/23854) Mistral、[`#23811`](https://github.com/DIYgod/RSSHub/pull/23811) The Decoder、[`#23765`](https://github.com/DIYgod/RSSHub/pull/23765) NVIDIA & AMD、[`#23527`](https://github.com/DIYgod/RSSHub/pull/23527) DeepSeek）以及上游官方 `.github/PULL_REQUEST_TEMPLATE.md` 结构，每次交付提供可直接复制提交的**英文正式版**与**对应中文版**两套文案。

#### 7.1 PR 标题模板

- **英文（推荐直接提交）**：
  - `feat(route): add <Platform> full-text <blog/news> feed`（如 `feat(route): add Groq full-text blog feed` / `feat(route): add Mistral AI full-text news`）
- **中文对照**：
  - `feat(route): 新增 <平台名> 全文 <博客/新闻> 路由`

#### 7.2 英文上游 PR 正文模板（对照 `#23854` / `#23861` 与 `.github/PULL_REQUEST_TEMPLATE.md`）

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

Adds a full-text feed for <Platform> at `/<namespace>/<route>`. The route uses <the official RSS feed / public WordPress API / SSR listing page> to discover articles, then fetches and caches the main article content via `cache.tryGet`, including inline images and code blocks. It includes authors and categories when available.

The route returns up to <N> entries by default and supports RSSHub's common `limit` parameter. It adds Radar rules plus documentation in English and Chinese without requiring new dependencies or browser automation.

### Validation

- Tested against the live source. The default request, `limit=1`, and `limit=<max>` returned <N>, 1, and <max> entries respectively.
- Verified that all <max> entries contained main article content, had unique links, and valid `pubDate` timestamps.
- `pnpm run build:docs`, `pnpm run format:check`, `pnpm run eslint`, and `pnpm run typecheck` passed.
````

#### 7.3 中文文案模板（用于双语对照或补充中文说明）

````markdown
## Involved Issue / 该 PR 相关 Issue

无

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

为 <平台名> 新增全文 RSSHub 路由 `/<namespace>/<route>`。路由通过 <官方摘要 RSS / 公开 WordPress REST API / SSR 列表页> 发现最新文章列表，并通过 `cache.tryGet` 抓取并缓存文章正文内容（包含行内图片与代码块），在原文页面或 Feed 可提取时补充作者与分类信息。

路由默认返回最多 <N> 条内容，支持 RSSHub 通用的 `limit` 参数；同时补充了 Radar 规则与中英文双语文档，未新增第三方依赖，也不依赖无头浏览器自动化。

### 验证情况

- 已针对真实线上源实测：默认请求、`limit=1` 与 `limit=<max>` 分别返回 <N>、1 与 <max> 条记录。
- 已核验全部 <max> 条记录均包含有效正文、唯一 `link` 与合法 `pubDate` 时间戳。
- 已完成 `pnpm run build:docs`（含路由构建与中英文文档校验）、`pnpm run format:check`、`pnpm run eslint` 与 `pnpm run typecheck` 校验且全部通过。
````
