# 线上空正文与内容质量治理路线图

## Context

2026-11-26（代码基线 `bbd0e86`）对北京生产 ECS（`i-2ze77shgsxr3nwn6ghra`）PostgreSQL 做了一次全量只读排查，覆盖当前在榜 `hot_items`（125 源 / 2,436 条，129/129 `business_cron_jobs` 已验证激活）、历史全库 `signal_articles`（84,520 条）及 `skill_details`（253 条）。

线上用户可见的“空正文 / 没内容”主要来自四类原因：

1. **媒体标签被前端过滤后文本归零**：`apps/web/lib/article-content.ts` 的 `renderArticleContent` 过滤 `<img>`、`<video>`、`<iframe>`，纯视频/纯图/无简介帖在过滤后正文与摘要皆空，回退显示“暂无站内正文，可点击‘查看原文’阅读。”
2. **页面壳子或付费截断产生的伪空正文**：数据库有 `content_html`，但去标签后只剩 `Share`、`Read more` 或 WordPress 尾注。
3. **上游本身仅提供摘要或外链**：如 `google-ai`、`hacker-news`、`baidu`、`coolapk`、`glm`。
4. **并发发现的数据库与调度隐性缺陷**：`is_indexable` 正则误伤正常长文，以及 `elevenlabs` 采集停滞超过 2 天。

关联路线图：[正文增强路线图](article-content.md)、[SEO 后续路线图](seo-followup.md)。

### 2026-11-26 生产在榜快照（`hot_items`）

| 分类 | 分区 / 来源 | 在榜异常数 | 典型表现 |
| --- | --- | --- | --- |
| 完全空正文 | `social / hupu` | 15 / 30（中位 4 字） | 5 条仅 `<video>`、8 条仅图、1 条仅投票、1 条空 `<p>` |
| 完全空正文 | `social / zhihu` | 4 / 30（另 1 条仅 `[图片]`） | 纯提问帖无问题描述，`content_html` 与 `summary` 皆为 `NULL` |
| 完全空正文 | `social / bilibili` | 2 / 20（另 3 条仅 `-`） | 仅 `<iframe>` 播放器且视频简介为空或 `-` |
| 完全空正文 | `ai / deepseek` | 1 / 20 | 第 14 条《DeepSeek APP》仅单张 `<img>` |
| 无正文仅摘要 | `ai / openai` | 1 / 30 | 第 16 条 `content_html` 为 `NULL`，回退显示 499 字摘要 |
| 伪空正文 | `ai / openai` | 4 / 30 | 第 8 / 18 / 20 / 21 条去标签后仅剩 5 字符 `Share` |
| 伪空正文 | `technology / big-technology` | 2 / 20 | 第 6 / 18 条 Substack 付费截断，仅剩 `Read more`（9 字） |
| 伪空正文 | `technology / newcomer` | 1 / 20 | 第 19 条 Substack 付费截断，仅剩 `Read more`（9 字） |
| 伪空正文 | `games / xbox-wire` | 1 / 10 | 仅 WordPress 尾注 `The post ... appeared first on XBOX Wire .` |
| 极短简介 | `technology / bun` | 1 / 20 | 第 7 条《Rewriting Bun in Rust》仅 41 字导语 |
| 上游短讯/摘要型 | `hacker-news` / `baidu` / `google-ai` / `coolapk` / `glm` | 均值为 43–170 字 | 上游 Feed 仅输出外链、热搜导语、配图短帖或文章摘要 |
| Skills 缺失 | `skill_details` | 1 / 253 | `benjitaylor/skills/stageshow`（`detail_state = 'missing'`） |

## Now

### 修复 `article_has_indexable_content` 正则贪婪匹配误伤长文（待合并发布复验）

- Value：恢复被误标为 `noindex` 且移出 sitemap 与同源推荐的正常长文收录能力。
- Evidence：`deploy/postgres/baseline.sql` 中 `regexp_replace(html, '<a\y[^>]*>.*?</a\s*>', '', 'gis')` 在 PostgreSQL 正则引擎下因前段 `[^>]*` 为贪婪量词，导致后段 `.*?` 退化为贪婪匹配，将文章首个 `<a>` 到末尾 `</a>` 之间的全部正文删除。当前在榜至少 20+ 个正常全文源受误伤，包括 `big-technology`（17/20）、`newcomer`（12/20）、`vercel`（7/20）、`meta-engineering`（2/9）、`ign`（2/20）、`elevenlabs`（2/20）、`metr`（2/20，含 7.5 万字长文）、`simon-willison`（2/15）、`ritholtz`（2/10）、`daring-fireball`（2/20）等。
- Dependencies：已于分支 `feat/fix-indexable-regex-and-openai-content` 完成 `deploy/postgres/baseline.sql` 与幂等迁移 `deploy/postgres/migrations/025-fix-article-indexability-regex.sql`（改为无反向引用的非贪婪标签剥离 + 排除独立 `Share` 行，并以无 DDL 锁且避开 ~73k 正常长文全表解压的定点 `UPDATE` 重算存量生成列，补齐 pgTAP 与 PostgreSQL 18 集成测试；生产只读对照验证 `2,436` 条在榜中 `62` 条误伤全文转绿、`4` 条 `Share` 演示页转红、无误杀）。详见 [fix-indexable-regex-and-openai-content.md](../development/fix-indexable-regex-and-openai-content.md)。
- Completion signal：合入发布执行迁移 `025` 后，生产复查 `hot_items` 与历史 `signal_articles` 中正常含多处超链接长文均返回 `is_indexable = true`；真正空正文与 `Share` / `Read more` / `Comments on Hacker News` 占位帖仍保持 `is_indexable = false`。

### 修复 `ai / openai` 伪空正文（仅 `Share`）与空正文条目（待部署与重新拉取复验）

- Value：消除高关注度核心 AI 来源中点开几乎空白的异常页面。
- Evidence：2026-11-26 在榜 30 条中，第 8 / 18 / 20 / 21 条（`Connected intelligence for in-house legal`、`See PR scans in action`、`Explore the Codex Security Plugin`、`Get started with Daybreak Blue`）抓取结果去标签后仅 5 字符 `Share`；第 16 条（`Time awareness and async input for personal agents`）`content_html` 为 `NULL` 仅留摘要。
- Dependencies：已在 `RSSHub` 分支 `fix/openai-news-and-developers-blog` 修复 `/openai/news`（精准清除 `[data-article-hero-actions]` 分享栏与仅匹配 `Keep reading` 的尾栏、为无文字视频演示页通过 JSX 模板输出封面图+导语摘要+视频直链并升级缓存键 `v3`）及 `/openai/developers/blog`（解包 `<astro-island>` 与 `<pre>` 内 Shiki `<span>` 使 760 KB 长文压缩至 `~157 KB` 低于 `512 KB` 入库上限并升级缓存键 `v2`），并在 `rss-site` `shared/openai-content.ts` 同步完成消费端防线与单测。需上线 `RSSHub` 与 `rss-site` 并触发 `openai` 重新抓取。
- Completion signal：部署后重新拉取验证 `openai` 在榜不再出现仅剩 `Share` 的条目，常规图文博客正文完整入库，无法抽取正文的产品演示页有明确摘要回退或过滤策略。

### 排查 `ai / elevenlabs` 采集停滞

- Value：保证已上线核心 AI 来源持续按计划更新，避免列表陈旧。
- Evidence：`source_status.last_success_at` 停留在 `2026-11-24 11:55:00+00`，比其余 124 个活跃来源落后超过 2 天。
- Dependencies：查询生产 `ingestion_runs` 最近失败记录与错误消息，验证 `https://rss.ljhboard.cn/elevenlabs/blog` 上游返回状态，定位是 RSSHub 解析失效、超时还是上游变更。
- Completion signal：`elevenlabs` 恢复正常周期采集，`ingestion_runs` 连续成功且 `source_status.last_success_at` 回到正常 6 小时窗口内。

## Next

### 过滤或降级付费截断与占位符伪空正文

- Value：避免读者点开科技/游戏全文源却只看到 `Read more` 或 WordPress 尾注，减少空洞页面。
- Evidence：
  - `technology / big-technology`（2/20）与 `technology / newcomer`（1/20）存在 Substack 付费墙截断条目，正文仅 `Read more`（9 字）。
  - `games / xbox-wire`（1/10）出现正文仅 WordPress 尾注 `The post ... appeared first on XBOX Wire .`（69 字）。
  - `technology / bun`（1/20）个别条目官方 Feed 仅提供 41 字单句导语。
- Dependencies：参考 `the-decoder` 过滤公开全文的思路，评估在采集端识别 Substack 付费截断（仅剩 `Read more`）与 WordPress 尾注的通用规则：是跳过入库、回退摘要，还是仅在阅读页提示“原文需订阅/查看原文”。
- Completion signal：制定统一的低信息量正文判定标准（覆盖 `Read more`、纯尾注等模式），新入库不再将占位文本当作完整正文展示，且不误杀正常短讯。

### 改善纯图/视频/无描述社区帖的空正文体验

- Value：解决社交热点区（尤其是虎扑、知乎、B 站）大量条目点开为空白的体验断层。
- Evidence：
  - `social / hupu`：15/30 条空正文，主体为 `<video>`、纯图或投票组件，被 `renderArticleContent` 过滤后完全空白。
  - `social / zhihu`：4/30 条纯标题提问无描述，1 条仅 `[图片]`。
  - `social / bilibili`：2/20 条无视频简介，3/20 条简介仅为 `-`。
  - `ai / deepseek`：1/20 条纯宣传图被过滤后为空。
- Dependencies：明确产品取舍——对无文字的图/视频/外链社区帖，是在列表页直接标明外链/外跳（类似 `isArticle: false` 或按条目无正文时直接外链）、还是在详情页给出更清晰的“原帖为图片/视频/投票内容，请查看原文”提示与封面图保留（而非统一显示“暂无站内正文”）。
- Completion signal：高空正文比例的社交源不再频繁把用户导向几乎空白的站内详情页；无正文条目在列表或详情页有清晰预期与直达原文路径。

## Later

### 评估摘要型上游源的全文增强或展示分级

- Value：区分“全文阅读源”与“快讯/聚合源”，让用户预期一致，同时优先升级高价值摘要源。
- Evidence：`ai / google-ai`（17/20 <150 字，均值 125 字）在 AI 分区中信息密度明显偏低；`technology / hacker-news`（均值 43 字）、`news / baidu`（均值 89 字）、`social / coolapk`（中位 77 字）、`ai / glm`（均值 170 字）均为上游短内容特性。
- Dependencies：结合 [正文增强路线图](article-content.md) 与自建 RSSHub 维护成本，重点评估是否优先为 `google-ai` 补齐全文抓取；其余快讯/外链聚合源则维持轻量展示。
- Completion signal：完成 `google-ai` 全文可行性实测结论；快讯/聚合型来源在来源说明或 UI 上与全文源形成清晰区分。

### 历史存量空正文数据与 `skill_details` 缺失项观测

- Value：掌握长期存量质量趋势，防止旧垃圾/空条目回流推荐或持续堆积。
- Evidence：`signal_articles` 全库 84,520 条中，历史空正文集中于 `zhihu`（1,238）、`chinanews`（582）、`xinhua`（316）、`baidu`（263）、`hupu`（255）、`hacker-news`（157）、`cctv`（135）、`toutiao`（107）、`bilibili`（91）及历史未过滤前的 `the-decoder`（15，当前在榜已归零）；`skill_details` 有 1/253 条缺失（`benjitaylor/skills/stageshow`）。
- Dependencies：待 `Now` 与 `Next` 项落地后，复跑同一套只读 SQL 统计脚本，对比空正文与 `is_indexable` 指标变化；按 retention 策略自然淘汰或定向清理历史异常记录。
- Completion signal：形成可复用的只读质量巡检 SQL，复检确认在榜空正文、伪空正文与 `is_indexable` 误判数显著下降。
