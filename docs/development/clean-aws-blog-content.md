# 清理 AWS 博客作者页脚与封面提取链路

## Background

在 [修复北京 ECS 4 个未激活来源的采集链路](fix-ecs-unverified-feeds.md)（PR #106）上线后，复核 `RSSHub` `/amazon/blogs/:category?`（`feat/amazon-blogs`）与 `rss-site` 的 `aws-ml` 采集渲染链路发现两项内容质量缺陷：

1. **AWS 官方 WordPress RSS 附带作者页脚与头像污染**：实测 `aws.amazon.com/blogs/{machine-learning,security,containers}/feed/` 中，`machine-learning`（`20/20`）、`security`（`20/20`）与 `containers`（`10/10`）文章均在 `<content:encoded>` 末尾附带 `<hr>`、`About the author(s)` 标题及 `<footer><div class="blog-author-box">...</div></footer>`；同时 WordPress `<dc:creator>` 仅保留首位作者，丢失其余合著者（`machine-learning` `19/20`、`security` `10/20`、`containers` `9/10`）。原 `RSSHub` 路由未剥离页脚即提取首图，导致正文无配图的文章（`machine-learning` `6/20`、`security` `7/20`、`containers` `3/10`）将作者头像提取为封面 `image`。
2. **`rss-site` 未清理 AWS 作者页脚且在清洗前提取封面图**：[feed.ts](../../server/api/src/ingestion/feed.ts) 的 `parseSignalFeed` 直接在未清洗的 `rawDescription` / `content` 上执行 `firstImageUrl`；[openai-content.ts](../../shared/openai-content.ts) 的 `cleanFeedArticleHtml` 仅清理了 CMS 模板标签与 OpenAI 朗读控件，未清理 `aws.amazon.com/.../blogs/` 的作者页脚，致使 `rss-site` 历史入库及新入库文章阅读页保留“About the author(s)”与作者简介噪声。

## Scope

- **自建 `RSSHub` 路由升级与规范对齐**：
  - 将 `feat/amazon-blogs` rebase 至最新 `upstream/master`（`b8dbcf0c08`，含 `#23968` `@cloudflare/oxlint-config` 与 `oxlint.ci.config.ts`），整合为单文件 `lib/routes/amazon/blogs.tsx`（移除冗余的 3 行 `templates/description.tsx`）。
  - 在一次 `cheerio.load()` 中提取 `.blog-author-box` 全部合著作者并与 `dc:creator` 合并去重，剥离作者页脚 `<footer>` 及其紧邻的 `About the author(s)` 标题与 `<hr>`、清理 `div.wp-caption` 固定宽度内联 `style`，仅在正文无配图时并发（`pMap` 并发 `5` + `cache.tryGet`）抓取文章页 `meta[property="og:image"]` 作为封面并补全作者。
  - 修复 `radar[].target` 为 `'/blogs/:category?'`，补充 `'aws.amazon.com/blogs'` 首页匹配并移除冗余的 `supportRadar` 字段。
- **`rss-site` 清洗与入库修复（分支 `feat/clean-aws-blog-content`，基于 `master` `4ae962f`）**：
  - [shared/openai-content.ts](../../shared/openai-content.ts)：在 `cleanFeedArticleHtml` 中增加 `cleanAwsBlogContent`，面向 `aws.amazon.com` `/blogs/` 文章剥离包含 `blog-author-box` 的 `<footer>` 及其紧邻的 `About the author(s)` 标题与 `<hr>`（既用于采集期写入，也用于 [article-content.ts](../../apps/web/lib/article-content.ts) 阅读期渲染存量文章）。
  - [server/api/src/ingestion/feed.ts](../../server/api/src/ingestion/feed.ts)：让 `firstImageUrl` 从已执行 `cleanFeedArticleHtml` 的正文/摘要中提取兜底封面，优先消费 `<enclosure>` 图片（如 `RSSHub` 补全的 `og:image`）。
  - 新增单元测试：[server/api/src/ingestion/feed.test.ts](../../server/api/src/ingestion/feed.test.ts) 与 [apps/web/lib/article-content.test.ts](../../apps/web/lib/article-content.test.ts)。

## Out of scope

- 不改动 `aws-ml` 源 ID、`rsshubPath`（`/amazon/blogs/machine-learning`）、Cron 调度、`deploy/server/business-jobs.json` 及 PostgreSQL 迁移文件。
- 不修改现有 `@rss-site/signals` 其余来源或全局排版/广告/阅读器视觉样式。
- 不由工具直接向 `DIYgod/RSSHub` 提交上游 Pull Request。

## Acceptance criteria

- `RSSHub` `lib/routes/amazon/blogs.tsx` 在最新 `upstream/master` 上通过 `oxfmt --check`、`oxlint --type-aware --config=oxlint.ci.config.ts --deny-warnings`、`eslint`、`tsc --noEmit`、`lizard -l typescript -C 10 -w` 与 `pnpm run build:docs`（`0` 错误 `0` 警告）；真实请求 `/amazon/blogs/machine-learning?limit=100&format=json`（`20` 条）、`/amazon/blogs/security?format=json`（`20` 条）、`/amazon/blogs/containers?format=json`（`10` 条）与 `/amazon/blogs?limit=5&format=json`（`5` 条）均返回 HTTP `200`，`blog-author-box` 与 `<footer>` 残留为 `0`，全部条目均有非头像正文图或 `og:image` 封面，合著作者完整保留。
- 将 `RSSHub` 实抓 XML 接入 `rss-site` `ingestSignal` + `renderArticleContent`：`machine-learning`（`20/20`）与 `security`（`20/20`）入库及渲染 `authorBoxes = 0`、`renderedFooterText = 0`、`badCovers = 0`。
- `rss-site` 全仓 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build` 全部通过。

## Feasibility

- **向后兼容存量 PostgreSQL 正文**：[renderArticleContent](../../apps/web/lib/article-content.ts#L42-L45) 每次渲染均调用 `cleanFeedArticleHtml(html, originalUrl)`，因此新增 `cleanAwsBlogContent` 后，库内已有的 `aws-ml` 文章在部署后即可去除末尾作者页脚展示；`RSSHub` 自建 `master` 更新后，下一次例行 Cron 采集会通过 `onConflictDoUpdate` 自动刷新合著作者与 `og:image` 封面。
- **正则与 ReDoS 防护**：`cleanAwsBlogContent` 使用单次 `matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)` 逐块检查是否包含 `blog-author-box`，再对切片末尾迭代剥离 `About the author(s)` 与 `<hr>`，避免跨 `<footer>` 误删与回溯风险。

## Implementation

- **Reused review decisions**: 沿用 [fix-ecs-unverified-feeds.md](fix-ecs-unverified-feeds.md) 与 [sierra-source.md](sierra-source.md) 的 `RSSHub` -> `rss-site` 双仓协同交付规范。
- [shared/openai-content.ts](../../shared/openai-content.ts)：实现 `cleanAwsBlogContent`、`stripTrailingAwsAuthorChrome` 与 `isAwsBlogUrl` 并接入 `cleanFeedArticleHtml`。
- [server/api/src/ingestion/feed.ts](../../server/api/src/ingestion/feed.ts)：复用清洗结果 `cleanedDescription` / `cleanedContent` 传给 `firstImageUrl` 与摘要生成。
- [apps/web/lib/article-content.test.ts](../../apps/web/lib/article-content.test.ts) 与 [server/api/src/ingestion/feed.test.ts](../../server/api/src/ingestion/feed.test.ts)：补充 AWS 作者页脚清理、头像不误选及 `<enclosure>` 封面优先测试。

## Verification

- **`RSSHub` 校验（`feat/amazon-blogs` @ `4f989466a9` 基于 `upstream/master` `b8dbcf0c08`，并同步至自建 `master`）**：
  - `pnpm exec oxfmt --check lib/routes/amazon/blogs.tsx`、`pnpm exec oxlint --type-aware --config=oxlint.ci.config.ts --deny-warnings lib/routes/amazon/blogs.tsx`（`Found 0 warnings and 0 errors`，`607` rules）、`pnpm exec eslint lib/routes/amazon/blogs.tsx`、`pnpm typecheck`、`uvx --from lizard lizard -l typescript -C 10 -w lib/routes/amazon/blogs.tsx`、`pnpm run build:docs` 及 `prek` 全项检查全部通过。
  - `gpt-6.2-sol`（`reasoning effort: high`）Codex review 闭环修复：有正文章节图但缺失内联作者框时（如 `compute` 的 Lambda Durable Functions 3 位合著作者）照常并发补抓页面元数据（传入 `publicOnly: true` 防护私网跳转）；保留上游 `video/mp4` / `audio/mpeg` `<enclosure>`；规范化作者空白字符（消除 `Dr.\u00a0Jens Kohl` 重复）且仅在缺失显式作者时回退 `dc:creator`（消除 `Zach Jacobson` / `Zachary Jacobson`、`Abrom Douglas` / `Abrom Douglas III` 重复）；在提取正文首图前清理 `<footer>`、独立 `.blog-author-box` 与孤立/表格/段落形式的 `About the author(s)` / `About Author(s)` / `Author Bio(s)` 区块并保留后续 `References`、`Related resources` 与 `ol.blog-footnotes`。
  - 真实 `app.request` 实测：`contact-center`（`200`、`20/20`、`headshotCovers: 0`、保留 `References: 2` / `Related resources: 2` / `footnotes: 1`）、`awsmarketplace`（`200`、`20/20`）、`machine-learning?limit=100`（`200`、`20/20`、`4` 个 `video/mp4` 与 `audio/mpeg` `<enclosure>` 保留）、`compute`（`200`、`20/20`）、`storage`（`200`、`20/20`、`orphanHeads: 0`）、`containers`（`200`、`10/10`）、`security`（`200`、`20/20`）与 `aws?limit=5`（`200`、`5/5`）全部通过，错误参数与不存在分类返回 `503`。
- **端到端采集与渲染校验**：将最新 `RSSHub` XML（`ml.xml` `535,477` B、`sec.xml` `649,205` B、`storage.xml` `645,185` B、`cc.xml` `556,390` B）输入 `parseSignalFeed` + `renderArticleContent`：四组均 `20/20`、`emptyBodies: 0`、`authorBoxes: 0`、`renderedFooterText: 0`、`badCovers: 0`（`sec`/`storage`/`cc` 均 `20/20` 封面；`ml` 为 `19/20` 封面，余下 1 篇为正文无图且保留 `video/mp4` 原生 `<enclosure>` 的视频文章）。
- **`rss-site` `gpt-6.2-sol` Codex review 与全仓校验**：
  - 修复 Codex `[P2]`（被 `cleanFeedArticleHtml` 移除的作者头像若出现在 `<enclosure>` 中，在 `parseSignalFeed` 中过滤掉再选封面）与 `[P3]`（`stripTrailingAwsHeading` 支持剥离带 `<strong>` 等内联标签以及无 `<footer>` 孤立的 `About the author(s)` / `About Author(s)` / `Author Bio(s)` 尾部标题），并在 `article-content.test.ts`（`8` 项）与 `feed.test.ts`（`2` 项）补测通过。
  - 更新 `AGENTS.md` 与 `.agents/skills/develop-with-pr/SKILL.md`，固化单轮 `gpt-6.2-sol` Codex review 与强制输出中英文双语上游 PR 文案规范。
  - 将在本轮最终编辑完成后重新执行全仓 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build` 并核对 PR #107 CI。

## Review

- 按仓库规范与 `gpt-6.2-sol` Codex review 结论完成双向闭环：阻塞与非阻塞（`P2`/`P3`）发现均已修复并由单元与端到端实测验证，无遗留阻塞项，不创建空 roadmap。

## Risks

- 若公网 `https://rss.ljhboard.cn` 在当前 Vercel `master` 上未同步更新为新实现，线上新抓取条目仍会包含旧 RSSHub 路由产出的首图与单作者；但即便在同步前，阅读页与入库清洗层已能屏蔽作者页脚与头像误选。
