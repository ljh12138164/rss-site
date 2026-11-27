# 修复 `article_has_indexable_content` 正则误判与 `ai / openai` 伪空正文 / 个人智能体博客超限问题

## 背景与目标

基于 [线上空正文与内容质量治理路线图](../roadmaps/empty-article-content-audit.md) 的前两项 `Now` 任务：

1. **修复 `public.article_has_indexable_content` PostgreSQL 正则贪婪匹配误伤长文**：消除 `<a\y[^>]*>.*?</a\s*>` 与 `<(script|style|iframe|textarea|audio)\y[^>]*>.*?</\1\s*>` 因起始属性段使用贪婪量词 `[^>]*` 造成的跨标签整段吞没，避免含多处超链接或嵌入块的正常长文被误标为 `is_indexable = false`；补齐 `Share` 占位排除，并以无 DDL 锁且幂等的方式重算存量 `signal_articles.is_indexable`。
2. **排查并修复 `ai / openai` 在榜 4 条仅剩 `Share` 的产品演示页与 1 条空正文条目**：从 `RSSHub`（`/openai/news`、`/openai/developers/blog`）与 `rss-site`（`shared/openai-content.ts`）双端修复根因。

## 根因定位

### 1. PostgreSQL POSIX ARE 正则贪婪退化与生产重算约束

- 在 `deploy/postgres/baseline.sql` 与 `supabase/migrations/20261011143000_article_indexability.sql` 中，`<a\y[^>]*>.*?</a\s*>` 与 `<(script|style|iframe|textarea|audio)\y[^>]*>.*?</\1\s*>` 的前段均为贪婪量词 `[^>]*`。PostgreSQL POSIX ARE 引擎以首个量词决定整体匹配模式，使后段 `.*?` 退化为贪婪（leftmost-longest），在文章含 2 个及以上 `<a>`（或嵌入标签）时删除首个开标签至末个闭标签间的全部正文。
- 生产核实：在生产 ECS PostgreSQL 18.7（`compose.yaml` 配置为 `shared_buffers = 32MB`、`mem_limit = 256m`）只读查得 `signal_articles` 共 `85,133` 行（其中 `is_indexable = false` 为 `11,709` 行、`true` 为 `73,424` 行）。仅读取 `2,436` 条在榜 `hot_items` 的 `content_html`（`40.1 MB`）即需约 `6.37s` TOAST 解压 I/O；若在部署单事务 `render-cron-sql.mjs` 内无条件扫描全部 8.5 万行大文本将显著拖慢甚至阻塞发布流程。

### 2. `ai / openai` 两类异常条目根因

1. **4 条 `/business/learn/...` 研讨会/演示页仅剩 `Share`**：
   - 生产库实时确认 `hot_items` 第 8 / 18 / 20 / 21 条 `content_html` 均为 `1,990` 字节且 `is_indexable = t`。
   - `RSSHub/lib/routes/openai/common.tsx` 使用 `$($article.find('h1').parents().get(4)).remove()` 既会遗漏同层 `[data-article-hero-actions="true"]` 分享按钮，又会在仅 2 层深的专题页（如 `Introducing GPT-6.2 Astra and Sol`）越界选中 `$article` 外部祖先节点而漏删 `h1`；同时无条件 `$article.children().last().remove()` 会误删无 `Keep reading` 推荐栏页面的末位视频容器（或文章末尾 `Footnotes` `<section>`），最终 4 条演示页仅余 `Share` 按钮壳子。
   - 实际官网 HTML 与 `openai.com/news/rss.xml` 已包含 `subhead` 导语、`og:image` 封面及 HTML/脚本内的直连视频地址（YouTube / Vimeo），且 `/business/learn/deploying-daybreak-red/` 属于真实图文 PDF 指南页，不宜粗暴按路径前缀封杀。
2. **第 16 条《Time awareness and async input for personal agents》`content_html = NULL`**：
   - 实测 `/openai/developers/blog?limit=30` 原路由输出 `<description>` 达 **760,441 字节**，触发 `server/api/src/ingestion/feed.ts` 与 `apps/web/lib/article-content.ts` 的 `512 * 1024 = 524,288` 字节阈值被直接丢弃为 `null`。
   - 体积膨胀来自 13 个 `<astro-island props="...">` 序列化重复 JSON 属性（约 `293 KB`）与 72 个 Shiki `<pre>` 内嵌套的 8,463 个 `<span class="syntax-highlighter-line"><span class="shiki-token">`（约 `579 KB`）；剥除冗余标签/属性（保留 `<code class="language-*">` 与纯代码文本）后降至 ~`153–157 KB`，全文 `113,755` 字完好无损。

## 改动清单

### `rss-site`（分支 `feat/fix-indexable-regex-and-openai-content`，基于 `master` `34c09cc`）

- [deploy/postgres/baseline.sql](../../deploy/postgres/baseline.sql) & [deploy/postgres/migrations/025-fix-article-indexability-regex.sql](../../deploy/postgres/migrations/025-fix-article-indexability-regex.sql)：
  - 将 `<a\y[^>]*?>.*?</a\s*>` 改为非贪婪匹配；将 `script/style/iframe/textarea/audio` 拆为无反向引用的非贪婪独立正则并仅在命中 `~* '<(script|style|iframe|textarea|audio)\y'` 或 `~* '<a\y'` 时触发；
  - 在 `meaningful` 占位行规则补充 `Share`（大小写不敏感整行匹配，保留含正文的普通文章）；
  - 在 `025` 中利用 `private.maintenance_state`（`'article_indexability_regex_v2_backfilled'`）保障仅首次发布执行一次定点重算，后续发布及 `verify-release-runtime` 重放耗时 0 ms；回算范围精确锁定为 `(not is_indexable and content_html ~* '<(a|script|style|iframe|textarea|audio)\y')`（`5,385` 行）、`id in (select article_id from public.hot_items)`（`2,436` 行）及小体积 `is_indexable` 且含 `Share` 的记录（`237` 行），避开 ~7.3 万条正常历史长文解压，并以 `set content_html = content_html` 触发存储生成列重算同时避免触发 `article_auto_ai_event` 与改变 `content_updated_at`。
- [supabase/tests/article_indexability.test.sql](../../supabase/tests/article_indexability.test.sql) & [apps/web/lib/article-indexability.database.test.ts](../../apps/web/lib/article-indexability.database.test.ts)：补充多 `<a>`、多 `<iframe>`、纯 `Share` / `Read more`、CCTV 视频及 `025` 迁移双次幂等重放、`content_updated_at` 保持不变的 PostgreSQL 18 集成测试。
- [shared/openai-content.ts](../../shared/openai-content.ts)、[apps/web/lib/article-content.test.ts](../../apps/web/lib/article-content.test.ts)、[server/api/src/ingestion/feed.test.ts](../../server/api/src/ingestion/feed.test.ts)：
  - 为 `openai.com` 新增按括号深度剥离 `[data-article-hero-actions="true"]` 分享栏与空 `<div>` 外壳（纯分享壳归零，普通文章消除头部残留）；
  - 为 `developers.openai.com` 在进入 512 KB 入库检查前剥离 `<astro-island>` 与 `<pre>` 内 Shiki `<span>`/UI 属性并保留 `language-*` 类名。

### `RSSHub`（分支 `fix/openai-news-and-developers-blog`，基于 `upstream/master` `256d4ff365`）

- [lib/routes/openai/common.tsx](../../../RSSHub/lib/routes/openai/common.tsx) & [lib/routes/openai/templates/description.tsx](../../../RSSHub/lib/routes/openai/templates/description.tsx)：
  - 清除 `[data-article-hero-actions]` / `[data-read-aloud-ui]` / `nav[data-show-toc]` / `[data-testid="author-list"]` 与 `#citations`，校验 `$.contains($article[0], heroHeader)` 防止越界删节点，并将 `.children().last().remove()` 收敛为仅匹配 `h2 === 'Keep reading'`；
  - 当正文经清洗后无有效文字与媒体时，提取 `subhead` / RSS `<description>` / `meta[name="description"]`、`og:image` 与经安全主机校验的直连视频 URL，通过 JSX 模板 `renderMediaFallbackDescription` 输出摘要卡片（缓存键升级为 `openai:news:detail:v3:${id}`）。
- [lib/routes/openai/developers-blog.ts](../../../RSSHub/lib/routes/openai/developers-blog.ts)：新增 `stripCodeBloat` 解包 `<astro-island>` 与 `<pre span>` 并剔除 Shiki 装饰属性，保留 `<code class="language-*">` 与完整代码文本（缓存键升级为 `openai:developers:blog:v2:${entry.link}`）。

## 验证结果

- **生产 ECS PG 18 只读核验**：
  - 修复表达式在全部 `2,436` 条在榜 `hot_items` 实跑耗时 `17.39s`（单篇最大 `503 KB` 仅 `199 ms`），`62` 条正常长文由 `false` 恢复为 `true`（`big-technology` 15、`newcomer` 11、`vercel` 7、`daring-fireball` 3、`metr` 2、`simon-willison` 2、`ritholtz` 2、`elevenlabs` 2、`meta-engineering` 2、`pc-gamer` 2 及另 14 源各 1），仅 `4` 条被 `Share` 污染的 `openai` 演示页由 `true` 转为 `false`（`0` 误杀）；
  - 全库 `85,133` 条初筛候选扫描耗时 `4.86s`，将回算范围收敛至 `5,385` 条含标签未收录历史记录 + `2,436` 条在榜 + `237` 条小体积含 `Share` 历史记录。
- **`RSSHub` 检查与实测**：`oxfmt --check`、`oxlint --type-aware --config oxlint.ci.config.ts --deny-warnings`（`0` 警告 `0` 错误）、`tsc --noEmit`、`uvx lizard -C 10 -w`、`tsdown` 生产构建全部通过；本地原生 Node 服务 `dist/index.mjs` 对接 `rss-site` `parseSignalFeed` + `renderArticleContent` 实测 `/openai/news?limit=30`（`30/30` 有效、`minRenderedPlainLen=118`、`maxBytes=226,538`、`shareLeftover=0`）、`/openai/developers/blog?limit=30`（`30/30` 有效、`maxBytes=156,519`、《Time awareness and async input for personal agents》保留 `113,214` 字且入库非空）、`/openai/research?limit=10`（`10/10` 有效），以及 `/openai/news?limit=100`（`100/100` `200`、`0` 空/`Share`）与 `/openai/developers/blog/zh-Hans?limit=100`（`40/40` `200`、`maxBytes=158,455`）。
- **`rss-site` 检查**：`pnpm format:check`、`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm --filter @rss-site/web build`、`render-cron-sql.mjs`、`deploy/server/test-release-packaging.py`（WSL `8/8`）及 `deploy/server/test-postgres-backup.py`（`7/7`）全部通过（待合入 PR 后由 GitHub Actions `postgres:18-alpine` 与生产 ECS 部署完成真实迁移落地及 `openai` 复抓闭环）。
