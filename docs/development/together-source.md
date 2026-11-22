# Together AI Blog 全文来源

## 背景

[Together AI Blog](https://www.together.ai/blog) 官方提供 Webflow RSS Feed（`https://www.together.ai/blog/rss.xml`，固定返回最近 `100` 篇），但 Feed 仅包含短摘要（早期探测实测约 `229` 字符 / `43` words），无分类/作者与正文媒体，且部分最新条目在官方 XML 中存在 `<title/>` 为空的问题（全量实测 `10/100` 篇）。正文全文、团队头像与作者、模型对比表格、代码块、自定义音频播放器（`[data-howler-src]`）、视频与 YouTube 嵌入及每篇独立 `og:image` 封面均完整存在于文章 HTML 页面（`www.together.ai/blog/*`）。

按工作流在自建 `RSSHub` 实现并上线 `/together/blog` 全文路由，并将默认路由接入 `rss-site` 的 AI 分区。

## 范围

- 自建 `RSSHub`（分支 `feat/together-blog` @ `52e78a140d`，基于 `upstream/master` `c31bc27991`；已 cherry-pick 至 `master` @ `9c942d4f77` 并部署至 `https://rss.ljhboard.cn/together/blog`）新增 `lib/routes/together/namespace.ts`、`lib/routes/together/blog.ts` 与 `lib/routes/together/templates/description.tsx`，暴露 `/together/blog`。
- `rss-site`（分支 `feat/together-source`，基于 `origin/master` `d126961`）在 `packages/signals/src/index.ts` 的 `aiSources` 注册 `together`（`name: 'Together AI'`、`code: 'TA'`、`shortName: 'Together'`、`itemLimit: 20`、`rsshubPath: '/together/blog'`、`isArticle: true`、`cronSchedule: '10 0,6,12,18 * * *'`、`cronJobName: 'signal-ingest-together'`），同步更新 `packages/signals/src/index.test.ts`（总源 `86`、Cron 任务 `86`、AI 分区 `29`）。
- 提取官网同款三圆徽标至 `apps/web/public/source-icons/together.svg`，并在 `apps/web/components/source-icon.tsx` 注册 `together` 文件图标。
- 新增 PostgreSQL 检查约束迁移 `deploy/postgres/migrations/018-together-source.sql`（标注 `017-apple-ml-source.sql` 已被覆盖），同步更新 `deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json`（总计 `89` 项任务）与 `deploy/server/verify-release-runtime` 预期计数（`89` / `91`）。

## 验收标准

- 自建 `RSSHub` 本地全量审计 `/together/blog?limit=100`（`100/100`）、默认 `/together/blog` 与 `/together/blog?limit=5&format=atom` 全部返回 HTTP `200`，零空正文、零重复主图、完整保留音频/视频/YouTube 嵌入且空 `<title/>` 条目全数由页面 `<h1>` / JSON-LD `headline` 恢复。
- 自建公网 `https://rss.ljhboard.cn/together/blog?limit=1`、`https://rss.ljhboard.cn/together/blog` 与 `https://rss.ljhboard.cn/together/blog?limit=5&format=atom` 均返回 HTTP `200`。
- 针对公网 Feed `https://rss.ljhboard.cn/together/blog` 运行 `ingestSignal` + `renderArticleContent` 稳定生成 `20` 条唯一文章（[验证证据](evidence/together-local-20261122.json)），正文体积低于数据库 `524,288` 字节限制。
- 全仓代码检查、类型检查、单元测试、Next 构建、`render-cron-sql.mjs` 与发布包单测全部通过。

## 可行性

复用现有 AI 分区单源接入架构（与 Modal、ElevenLabs、Sierra、Apple ML 保持一致），不新增前端路由，结论为**可行**。实证排查出的关键细节与处理方式如下：

- **空标题与作者括号逗号解析**：官方 RSS 存在 `10/100` 篇空 `<title/>` 条目，且团队多作者文本可能含角色括号内逗号（如 `(SVP of Research, AI Systems)`）；详情页解析统一通过 JSON-LD `headline` 与页面 `<h1>` 恢复标题（遵循 RSSHub 规范不手动 `.trim()`），优先读取 JSON-LD / 元作者名并用正文作者作为兜底。
- **Webflow 富媒体与封面去重**：5 篇文章含 `[data-howler-src]` 音频播放器，转为标准 `<audio controls>`；17 篇含 `<video>` 并补全 `controls`；2 篇含 3 个 YouTube `<iframe>` 嵌入并附观看外链。正文存在 `figure.blog-detail_main-img img` 时不额外重复插入封面，否则通过 JSX `renderDescription` 模板在正文首部补入独立文章封面（兼顾 Atom Feed 输出封面，实测 `?limit=100` `withImages = 100`、`dupHeroImgs = 0`、`totalAudio = 18`、`totalVideo = 22`、`totalIframe = 3`）。
- **单篇瞬时故障容错**：在 `cleanBodyHtml` 返回空正文时于 `cache.tryGet` 内部抛错，由外层 `buildFallbackDetail` 回退到 RSS 摘要，避免将临时空壳页面写入持久缓存。

## 实现

- **`RSSHub`**：分支 `feat/together-blog` 提交 `52e78a140d`（已 cherry-pick 至自建 `master` @ `9c942d4f77` 并部署上线 `https://rss.ljhboard.cn/together/blog`）。
- **`rss-site`**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)、[packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)
  - [apps/web/public/source-icons/together.svg](../../apps/web/public/source-icons/together.svg)、[apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx)
  - [deploy/postgres/migrations/018-together-source.sql](../../deploy/postgres/migrations/018-together-source.sql)、[017-apple-ml-source.sql](../../deploy/postgres/migrations/017-apple-ml-source.sql)、[baseline.sql](../../deploy/postgres/baseline.sql)
  - [deploy/server/business-jobs.json](../../deploy/server/business-jobs.json)、[deploy/server/verify-release-runtime](../../deploy/server/verify-release-runtime)
  - [docs/development/evidence/together-local-20261122.json](evidence/together-local-20261122.json)、[docs/research/rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md)、[HERMES.md](../../HERMES.md)

## 验证

- **RSSHub 本地与公网验证**：
  - `oxfmt --check lib/routes/together`、`oxlint --type-aware --config=oxlint.ci.config.ts --deny-warnings lib/routes/together`（`0` 警告 `0` 错误）、`uvx --from lizard lizard -l typescript -C 10 -w lib/routes/together`（`0` 告警）、`eslint`、`tsc --noEmit`、`pnpm run build:docs`、`test-together-edge-cases.mts` 边界断言以及单轮 `codex review --uncommitted`（`gpt-6.2-sol` + `high`）指出 `3` 条建议均已闭环修复并重验通过。
  - 本地实时审计：`/together/blog?limit=100&format=json`（`100/100`，`uniqueUrls = 100`、`withAuthors = 98`、`withTags = 100`、`withImages = 100`、`dupHeroImgs = 0`、`minDesc = 2758`、`maxDesc = 54306`、`totalAudio = 18`、`totalVideo = 22`、`totalIframe = 3`、`problemsCount = 0`）与 `?limit=5&format=atom`（`atomHasCovers: true`）均返回 `200`。
  - 公网 `https://rss.ljhboard.cn` 实测：`/together/blog?limit=1`（`5,019 B`）、`/together/blog`（`375,772 B`）与 `/together/blog?limit=5&format=atom`（`64,268 B`）均返回 `200`。
- **`rss-site` 采集与仓库门禁**：
  - `ingestSignal` + `renderArticleContent` 实测（[together-local-20261122.json](evidence/together-local-20261122.json)）：`parsedAndIngestedItems = 20`、`fullBodyMatches = 20`、`renderedNonEmpty = 20`、`publicationDatesVerified = 20`、`namedAuthors = 19`、`coverImages = 20`、`badImageUrls = 0`、`maxContentHtmlBytes = 54,542`、`uniqueUrls = 20`、`consecutiveRanks = true`。
  - 工具链校验：`biome check`（变更源文件与证据 JSON 均通过）、`pnpm check-types`（`3/3`）、`pnpm test`（`@rss-site/signals` `9 passed`、`@rss-site/api` `126 passed`、`@rss-site/web` `195 passed | 22 skipped`）、`pnpm build`（`2/2`，`97/97` 静态页 + `sw.js`）、`render-cron-sql.mjs`（输出含 `'together'` 约束与 `"/cron/signals/together"` 任务配置，无顶层 `select private.activate_*`）、`wsl bash -n deploy/server/verify-release-runtime`（退出码 `0`）与 `wsl python3 -B deploy/server/test-release-packaging.py -v`（`8/8 OK`）均通过。
  - 无未决后续跟进事项，故不另建空 roadmap 文档。

## 风险

- 若 `together.ai/blog` 后续变更 Webflow 页面 DOM 结构（如 `.blog-detail_main-img`、`[data-howler-src]` 或 JSON-LD 字段），需同步调整 `RSSHub` `/together/blog` 路由选择器。
- `deploy/postgres/migrations/018-together-source.sql` 沿用仓库 `002`–`017` 单一重放约束策略（`render-cron-sql.mjs` 每次发布重放全量 `*.sql`）：发布失败回滚时自动恢复发生在 `--activate-unverified` 写入 `together` 数据之前，但一旦库中实际写入 `together` 行，直接重放旧版本 `017` 检查约束会因缺少 `'together'` 而失败，如需下线应通过前向迁移关闭而非回滚旧迁移约束。
- 备用 `RSSHub` fork（`ljh-project/RSSHub`）尚未执行 **Sync fork -> Update branch**，当前主站接入主实例 `https://rss.ljhboard.cn` 不受影响。
