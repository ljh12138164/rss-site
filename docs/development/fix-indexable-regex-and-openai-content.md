# 修复 `article_has_indexable_content` 正则误判与 `ai / openai` 伪空正文 / 个人智能体博客超限问题

## Background

基于 [线上空正文与内容质量治理路线图](../roadmaps/empty-article-content-audit.md) 的前两项 `Now` 任务，解决两类线上高优先级内容与索引质量缺陷：

1. **PostgreSQL 正则贪婪匹配误伤正常长文**：`public.article_has_indexable_content` 对含 2 个及以上 `<a>` 或嵌入标签的长文误删中间正文，导致至少 20+ 个正常全文源（62 条在榜长文）被标为 `is_indexable = false`，丢失收录与站内推荐。
2. **`ai / openai` 在榜异常正文**：4 条 `/business/learn/...` 研讨会/演示页抓取结果去标签后仅剩 `Share`（`1,990` 字节，原函数误标 `is_indexable = true`），以及 1 条 `developers.openai.com` 长文（《Time awareness and async input for personal agents》）因 RSS `<description>` 达 `760,441` 字节超过 `512 KB` 入库上限而退化为 `content_html = NULL`。

## Scope

- 修复 `deploy/postgres/baseline.sql` 中的 `public.article_has_indexable_content` 正则与 `Share` 占位排除，并新增幂等迁移 `deploy/postgres/migrations/025-fix-article-indexability-regex.sql` 完成一次性无 DDL 锁存量重算。
- 补齐 `supabase/tests/article_indexability.test.sql` 与 `apps/web/lib/article-indexability.database.test.ts` 的 PostgreSQL 18 真实函数与迁移/触发器集成测试。
- 在伴随仓库 `RSSHub`（分支 `fix/openai-news-and-developers-blog`，基于 `upstream/master` `256d4ff365`）修复 `/openai/news`（共用 `common.tsx`）与 `/openai/developers/blog`。
- 在 `rss-site` 消费与渲染侧（`shared/openai-content.ts` 及单测）补齐 `openai.com` 分享栏剥离与 `developers.openai.com` Astro/Shiki 体积瘦身防线。
- 同步更新路线图与 `HERMES.md` 说明。

## Out of scope

- `ai / elevenlabs` 采集停滞排查（路线图第三项 `Now` 任务）。
- Substack 付费截断（`big-technology`、`newcomer` 的 `Read more`）与 WordPress 尾注（`xbox-wire`）通用过滤策略（路线图 `Next` 任务）。
- 虎扑/知乎/B 站/DeepSeek 等纯图/视频/投票社区帖展示策略改造（路线图 `Next` 任务）。
- 改动 `server/api/src/ingestion/store.ts` 的 `coalesce(excluded.content_html, signal_articles.content_html)` 保护语义（避免全站 125 源在瞬时上游降级时覆盖已存全文）。

## Acceptance criteria

1. `public.article_has_indexable_content` 正确保留首尾均含 `<a>` 或多处 `<iframe>`/`<script>`/`<style>`/`<textarea>`/`<audio>` 的正常长文为 `true`，同时将纯 `Share` / `Read more` / `Comments on Hacker News` 占位记录判为 `false`，且保留 CCTV 视频挂载为 `true`。
2. `025-fix-article-indexability-regex.sql` 重复执行 2 次及以上完全幂等，重算所有受影响的在榜与历史记录（含仅 `summary` 含标签或非在榜 `Share` 壳），且在真实 `article_content_lifecycle` 触发器挂载下不推进 `content_updated_at` 或关联 `ai_events.updated_at`。
3. `RSSHub` `/openai/news` 对 4 条演示页不再产出仅剩 `Share` 的正文，而是输出经 URL 安全校验的封面图 + 导语摘要 + 视频直链卡片；普通新闻与研究页无 `Share` 残留且不误删 `Footnotes` 或深浅不一的 `h1`。
4. `RSSHub` `/openai/developers/blog` 与 `rss-site` `shared/openai-content.ts` 在进入 `512 KB` 阈值前剥离 `<astro-island>` 与 `<pre>` 内 Shiki `<span>` 冗余标记，保留 `<code class="language-*">` 与完整代码文本，《Time awareness and async input for personal agents》完整入库非空。
5. `rss-site` CI `verify`（含 `postgres:18-alpine` 迁移重放与集成测试）与 `RSSHub` 全套 lint/typecheck/complexity/build 检查全部通过。

## Feasibility

- **生产数据库根因与性能瓶颈**：
  - PostgreSQL POSIX ARE 引擎以首个量词决定整体贪婪性，`<a\y[^>]*>.*?</a\s*>` 与 `<(script|style|iframe|textarea|audio)\y[^>]*>.*?</\1\s*>` 前段 `[^>]*` 导致后段 `.*?` 退化为贪婪匹配，吞没首尾标签间的全部正文。
  - 生产 ECS（`i-2ze77shgsxr3nwn6ghra`）PostgreSQL 18.7 配置为 `shared_buffers = 32MB`、`mem_limit = 256m`，`signal_articles` 共 `85,133` 行（`is_indexable = false` `11,709` 行、`true` `73,424` 行）。实测读取 `2,436` 条在榜 `hot_items` 的 `content_html`（`40.1 MB`）即需 `6.37s` TOAST 解压 I/O；因此不可在部署事务中 `ALTER COLUMN` 重建生成列（会长时间持锁）或无条件全表回算。
  - **可行方案**：拆分为无反向引用的非贪婪独立正则 + 快速守卫（`stripped_embeds` → `stripped_anchors`），通过 `private.maintenance_state`（`'article_indexability_regex_v2_backfilled'`）仅首次发布执行一次定点 `UPDATE signal_articles SET content_html = content_html`，将扫描收敛到三类可能发生翻转的候选子集，避免解压 ~7.3 万条正常历史长文。生产只读验证全库候选初筛 `4.86s`、全部 `2,436` 条在榜表达式重算 `17.39s`（单篇最大 `503 KB` 仅 `199 ms`），`62` 条误伤全文恢复 `true`、`4` 条 `Share` 演示页转为 `false`、`0` 误杀。
- **`ai / openai` 两类异常根因**：
  - 4 条 `/business/learn/...` 演示页：`RSSHub/lib/routes/openai/common.tsx` 的 `$($article.find('h1').parents().get(4)).remove()` 既漏掉同层 `[data-article-hero-actions="true"]`，又会在浅层专题页越界选中 `$article` 外部祖先节点；无条件 `$article.children().last().remove()` 会删掉无 `Keep reading` 推荐栏页面的唯一视频容器（或文章末尾 `Footnotes`），只留 `Share` 壳。页面本身具备 `subhead` / RSS `<description>` / `meta[name="description"]`、`og:image` 及 Next.js payload 中的 `"videoEmbedUrl"`，适合输出 JSX 摘要卡片，且不误伤 `/business/learn/deploying-daybreak-red/` 等真实图文页。
  - `developers.openai.com` 个人智能体长文：原输出 `760,441` 字节包含 13 个 `<astro-island props="...">`（约 `293 KB`）与 72 个 `<pre>` 内 8,463 个 Shiki `<span>`（约 `579 KB`），解包后降至 ~`157 KB` 且全文 `113,215` 字完好保留。

## Implementation

### `rss-site`（分支 `feat/fix-indexable-regex-and-openai-content`，基于 `master` `34c09cc`）

- [deploy/postgres/baseline.sql](../../deploy/postgres/baseline.sql) & [deploy/postgres/migrations/025-fix-article-indexability-regex.sql](../../deploy/postgres/migrations/025-fix-article-indexability-regex.sql)：
  - 将 `article_has_indexable_content` 拆分为 `stripped_embeds` → `stripped_anchors` 两个顺序 CTE，使用非贪婪正则并保留 `position('<' in html)` 与标签前置守卫；
  - 在 `meaningful` 占位过滤补充 `Share` 整行排除；
  - 在 `025` 中通过 `private.maintenance_state` 保证仅首次发布执行一次定点 `SET content_html = content_html`，覆盖 `not is_indexable` 且 `coalesce(nullif(btrim(content_html), ''), summary, '')` 含 `a/script/style/iframe/textarea/audio` 标签、全部 `hot_items` 以及 `<= 16 KB` 含 `Share` 的历史记录。
- [supabase/tests/article_indexability.test.sql](../../supabase/tests/article_indexability.test.sql) & [apps/web/lib/article-indexability.database.test.ts](../../apps/web/lib/article-indexability.database.test.ts)：补充多 `<a>`/首尾 `<a>`、多 `<iframe>`、纯 `Share` / `Read more`、CCTV 视频测试，并在隔离 schema 中挂载真实 `track_article_content` 触发器验证 `025` 双次重放幂等、历史 `Share` 与仅 `summary` 含链接行回算正确，且 `content_updated_at` 与关联 `ai_events.updated_at` 保持不变。
- [shared/openai-content.ts](../../shared/openai-content.ts)、[apps/web/lib/article-content.test.ts](../../apps/web/lib/article-content.test.ts)、[server/api/src/ingestion/feed.test.ts](../../server/api/src/ingestion/feed.test.ts)：
  - 为 `openai.com` 新增支持自闭合 `<div .../>` 与布尔属性的安全嵌套深度剥离（`data-read-aloud-ui` / `data-article-hero-actions`）并复用 `stripHtmlTagsText` 归零空分享壳；
  - 为 `developers.openai.com` 新增支持属性值内含 `>` 的引号感知 `<astro-island>` 剥离、Shiki `<span>` 清理以及 `<pre data-language>` 到 `<code class="language-*">` 的语言透传。

### `RSSHub`（分支 `fix/openai-news-and-developers-blog`，基于 `upstream/master` `256d4ff365`）

- [lib/routes/openai/common.tsx](../../../RSSHub/lib/routes/openai/common.tsx) & [lib/routes/openai/templates/description.tsx](../../../RSSHub/lib/routes/openai/templates/description.tsx)：
  - 清除 `[data-article-hero-actions]`、`[data-read-aloud-ui]`、`nav[data-show-toc]`、`[data-testid="author-list"]`、`#citations` 与脚本/样式节点，校验 `$.contains(articleNode, heroHeader)` 防止越界，并将尾栏删除收敛为仅匹配 `h2 === 'Keep reading'`；
  - 对无正文页面，校验 `og:image` 的 `http:`/`https:` 协议，优先从 `$article` 媒体节点及页面 `"videoEmbedUrl"` 字段提取并清洗（解码 `&amp;` / `\u0026`、去尾标点、严格主机与路径校验）直连视频 URL，经 JSX 模板 `renderMediaFallbackDescription` 输出摘要卡片（缓存键升级为 `openai:news:detail:v3:${id}`）。
- [lib/routes/openai/developers-blog.ts](../../../RSSHub/lib/routes/openai/developers-blog.ts)：合并 `astro-island, pre span` 逆序解包，仅清理 `<pre>` 及其内部 `<code>` 的 Shiki/UI 装饰属性并将 `<pre>` 的 `data-language` 透传到 `<code class="language-*">`（缓存键升级为 `openai:developers:blog:v2:${entry.link}`）。

## Verification

- **生产 ECS PG 18 只读核验**：在全部 `2,436` 条在榜 `hot_items` 上实跑新表达式耗时 `17.39s`（最大单篇 `503 KB` 耗时 `199 ms`），`62` 条正常长文由 `false` 恢复为 `true`，仅 `4` 条 `Share` 演示页由 `true` 转为 `false`（`0` 误杀）；全库 `85,133` 条候选初筛 `4.86s`。
- **线上 `RSSHub`（`https://rss.ljhboard.cn`）与本地构建实测**：`oxfmt --check`、`oxlint --type-aware --config oxlint.ci.config.ts --deny-warnings`（`0` 警告 `0` 错误）、`tsc --noEmit`、`uvx lizard -C 10 -w`、`tsdown` 构建全部通过；线上 `/openai/news?limit=30`（`30/30` 有效、`shareOnlyCount=0`、`minPlainLen=118`）、`/openai/developers/blog?limit=30`（`30/30` 有效、`maxDescBytes=156,915`、《Time awareness and async input for personal agents》`113,215` 字）、`/openai/research?limit=10`（`10/10` 有效）均返回 `200`。
- **`rss-site` 本地与 CI 验证**：Biome format/lint、`pnpm check-types`、`pnpm test`、`pnpm --filter @rss-site/web build`、`render-cron-sql.mjs`、`test-release-packaging.py`、`test-postgres-backup.py` 及 GitHub Actions `verify`（含真实 `postgres:18-alpine` 迁移重放与 `article-indexability.database.test.ts`）与 `Workers Builds: rss-site-feed-relay` 全部通过。

## Risks

- **首次发布迁移耗时**：生产 ECS PG 18 仅在首次部署执行 `025` 定点 `UPDATE`（约 15–30 秒），已通过 `private.maintenance_state` 保证后续发布零开销，且避免 `ALTER TABLE` 排他锁。
- **消费端空壳兜底与 `coalesce` 行为**：`store.ts` 保留 `coalesce(excluded.content_html, signal_articles.content_html)` 以防瞬时上游降级清库；若历史脏 `Share` 记录尚未由新版 RSSHub 覆写，迁移 `025` 会将其标为 `is_indexable = false` 且 `renderArticleContent` 渲染侧会剥离 `Share` 按钮壳，待新版 RSSHub 周期抓取后以非空摘要卡片覆写库中旧值。
- **OpenAI 页面结构变更风险**：若 OpenAI 调整 Next.js payload 中 `"videoEmbedUrl"` 字段名，演示页仍会通过 `subhead` / RSS `<description>` + `og:image` + 原文链接正常降级，不会退化为空正文或 `Share` 壳。
