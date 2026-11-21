# Apple Machine Learning Research 全文来源

## 背景

[Apple Machine Learning Research](https://machinelearning.apple.com/) 官方提供的 [rss.xml](https://machinelearning.apple.com/rss.xml) 仅返回最近 `10` 条且正文截断到约 `592–600` 字符的摘要，不含作者、标签、封面、全文图片/表格/代码块/公式/音视频以及论文的 arXiv / GitHub 链接。官网实际在 `/highlights`（`56` 篇工程与研究深度长文）与 `/research`（`1,194` 篇研究论文）通过 Next.js `__NEXT_DATA__` 与 SSR 页面暴露完整内容。

按工作流在自建 `RSSHub` 实现并上线 `/apple/ml-research/:category?` 全文路由（支持 `all`、`highlights`、`research`），并将默认全量路由 `/apple/ml-research` 接入 `rss-site` 的 AI 分区。

## 范围

- 自建 `RSSHub`（分支 `feat/apple-ml-research` @ `473976be15`，基于 `upstream/master` `2eb5724294`；已 cherry-pick 至 `master` @ `57cd7adafd`）新增 `lib/routes/apple/ml-research.ts` 与 `lib/routes/apple/templates/ml-research.tsx`，暴露 `/apple/ml-research/:category?`。
- `rss-site` 在 `packages/signals/src/index.ts` 的 `aiSources` 注册 `apple-ml`（`name: 'Apple ML'`、`code: 'AM'`、`itemLimit: 20`、`rsshubPath: '/apple/ml-research'`、`isArticle: true`、`cronSchedule: '5 0,6,12,18 * * *'`），同步更新 `packages/signals/src/index.test.ts`（总源 `85`、AI 分区 `28`）。
- 在 `apps/web/components/source-icon.tsx` 使用 `react-icons/si` 官方品牌图标 `SiApple`（`#000000` / `#f2f0ea` 浅底徽章）注册 `apple-ml`。
- 在 [apps/web/lib/article-content.ts](../../apps/web/lib/article-content.ts)、[apps/web/app/globals.css](../../apps/web/app/globals.css) 与 [server/api/src/ingestion/feed.ts](../../server/api/src/ingestion/feed.ts) 放行安全的 MathML 核心展示标签与块级公式滚动样式，过滤 KaTeX `.katex-html` / `<annotation>` / `<annotation-xml>` 冗余文本并脱包 `.katex` 嵌套 `<span>`，同时保留对 `<mtext><table><mglyph>` 等 mXSS 载荷的阻断。
- 新增 PostgreSQL 检查约束迁移 `deploy/postgres/migrations/017-apple-ml-source.sql`（标注 `016-sierra-source.sql` 已被覆盖），同步更新 `deploy/postgres/baseline.sql`、`deploy/server/business-jobs.json`（总计 `88` 项 Cron 任务）与 `deploy/server/verify-release-runtime` 预期计数（`88` / `90`）。

## 验收标准

- 自建 `RSSHub` 本地实测 `/apple/ml-research`（`20/20`）、`/apple/ml-research/highlights?limit=100`（`56/56`）与 `/apple/ml-research/research?limit=100`（`100/100`）全部通过，零空正文、零泛用占位封面、零重复 `<h1>`/`.katex-html`/`inner-bleed-grid` 空白框或缺失控制栏的音视频。
- 自建公网 `https://rss.ljhboard.cn/apple/ml-research?limit=1`、`https://rss.ljhboard.cn/apple/ml-research`、`https://rss.ljhboard.cn/apple/ml-research/highlights?limit=1` 与 `https://rss.ljhboard.cn/apple/ml-research/research?limit=1` 均返回 HTTP `200`。
- 针对公网 Feed `https://rss.ljhboard.cn/apple/ml-research` 运行 `ingestSignal` + `renderArticleContent` 稳定生成 `20` 条唯一文章（[验证证据](evidence/apple-ml-local-20261121.json)），正文大小低于数据库 `524,288` 字节限制。
- 全仓代码检查、类型检查、单元测试、Next 构建、`render-cron-sql.mjs` 与发布包单测全部通过。

## 可行性

复用现有 AI 分区单源接入架构（与 Modal、ElevenLabs、Sierra 保持一致），不新增路由页面，结论为**可行**。实证排查出的关键细节与处理方式如下：

- **两类内容并存且无重叠**：`/highlights`（`56` 篇 `article` / `article_legacy` 工程博客）与 `/research`（`1,194` 篇 `paper` 论文）在 `__NEXT_DATA__` 中互不重叠。路由默认 `all` 并发合并去重并按 `published` 降序截断 `limit`，同时允许通过 `:category?` 单独订阅 `highlights` 或 `research`。
- **交互式图表与多媒体兼容**：长文（如 `mlx-distributed-inference`、`large-scale-rnns`、`introducing-third-generation-of-apple-foundation-models`）包含 `#hero` 视频/大图、`<audio>` 样本、KaTeX `<math>` 与客户端空置的 `.inner-bleed-grid` / `[role="tabpanel"]` 图表占位；仅替换无静态内容/表格的空图表容器并保留 `<figcaption>` 与同图静态表格，保留 `#hero` 媒体与 `[data-testid="links"]` 外链（arXiv/GitHub），清理 `.katex-html`、`button`、`.dotnav`、`.paddlenav` 及末尾招聘横幅。
- **泛用分享图与标题空白处理**：多数论文默认 `og:image` 指向泛用 `Home_1200x630_*.png`，抓取时显式过滤，仅保留真实文章配图；不手动 `.trim()` 标题以符合 RSSHub 中间件规范。
- **单篇瞬时故障容错**：`fetchPostDetail` 在 `cache.tryGet` 外层捕获 404/超时并回退索引摘要，不向持久缓存写入降级结果。

## 实现

- **`RSSHub`**：分支 `feat/apple-ml-research` 提交 `473976be15`（已同步 `master` @ `57cd7adafd` 并部署上线 `https://rss.ljhboard.cn/apple/ml-research`）。
- **`rss-site`**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)、[packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)
  - [apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx)、[apps/web/lib/article-content.ts](../../apps/web/lib/article-content.ts)、[apps/web/lib/article-content.test.ts](../../apps/web/lib/article-content.test.ts)、[apps/web/app/globals.css](../../apps/web/app/globals.css)
  - [server/api/src/ingestion/feed.ts](../../server/api/src/ingestion/feed.ts)、[server/api/src/ingestion/feed.test.ts](../../server/api/src/ingestion/feed.test.ts)
  - [deploy/postgres/migrations/017-apple-ml-source.sql](../../deploy/postgres/migrations/017-apple-ml-source.sql)、[016-sierra-source.sql](../../deploy/postgres/migrations/016-sierra-source.sql)、[baseline.sql](../../deploy/postgres/baseline.sql)
  - [deploy/server/business-jobs.json](../../deploy/server/business-jobs.json)、[deploy/server/verify-release-runtime](../../deploy/server/verify-release-runtime)
  - [docs/development/evidence/apple-ml-local-20261121.json](evidence/apple-ml-local-20261121.json)、[docs/research/rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md)、[HERMES.md](../../HERMES.md)

## 验证

- **RSSHub 本地与公网验证**：
  - `oxfmt --check`、`oxlint --type-aware --config=oxlint.ci.config.ts --deny-warnings`（`0` 警告 `0` 错误）、`uvx --from lizard lizard -l typescript -C 10 -w`（`0` 告警）、`eslint`、`tsc --noEmit`、`pnpm run build:docs`、本地边界断言测试（单篇 404 恢复不污染缓存、仅 Hero 保留摘要、混合静态表格图表局部替换、无日期条目保留）以及单轮 `codex review --uncommitted`（`gpt-6.2-sol` + `high`）指出 4 条建议均已闭环修复并重验通过。
  - 本地实时全量审计：`/apple/ml-research`（`20/20`）、`/apple/ml-research/highlights?limit=100`（`56/56`）与 `/apple/ml-research/research?limit=100`（`100/100`）均返回 `200` 且 `problems=[]`；`RSSHub-docs`（`5174`）双语路由页 `200` 且 `/routes.json` 已收录。
  - 公网 `https://rss.ljhboard.cn` 实测：`/apple/ml-research?limit=1`（`3,351 B` / `1` 条）、`/apple/ml-research`（`116,311 B` / `20` 条）、`/apple/ml-research/highlights?limit=1`（`28,275 B` / `1` 条）与 `/apple/ml-research/research?limit=1`（`3,370 B` / `1` 条）均返回 `200`。
- **`rss-site` 采集与仓库门禁**：
  - `ingestSignal` + `renderArticleContent` 实测（[apple-ml-local-20261121.json](evidence/apple-ml-local-20261121.json)）：`parsedAndIngestedItems = 20`、`fullBodyMatches = 20`、`renderedNonEmpty = 20`、`rawMathTags = 14`、`renderedMathTags = 14`、`publicationDatesVerified = 20`、`namedAuthors = 20`、`coverImages = 2`（仅精选博客带真实配图，论文不误取泛用图）、`badImageUrls = 0`、`maxContentHtmlBytes = 31,230`、`uniqueUrls = 20`、`consecutiveRanks = true`。
  - 工具链校验：`biome check`（含新增 MathML 与迁移在内的所有变更文件通过；注：工作区原有未跟踪提交的 `apps/web/components/article-search.tsx` 末尾换行差异及部分旧文件在 Windows 下的 CRLF 检出差异触发全仓 `pnpm lint` 格式告警，本次未改动这些文件）、`pnpm check-types`（`3/3`）、`pnpm test`（`3/3`：`@rss-site/signals` `9 passed`，`@rss-site/api` `126 passed`，`@rss-site/web` `195 passed | 22 skipped` 跳过 4 个依赖 Docker DB/Redis 的集成测试文件）、`pnpm build`（`2/2`，生成 `96/96` 静态页 + `sw.js`）、`render-cron-sql.mjs`（含 `'apple-ml'` 与 `signal-ingest-apple-ml`，无顶层 `select private.activate_*`）、`wsl bash -n deploy/server/verify-release-runtime`（退出码 `0`）与 `wsl python3 -B deploy/server/test-release-packaging.py -v`（`8/8 OK`）均通过。
  - 无未决后续跟进事项，故不另建空 roadmap 文档。

## 风险

- 若 `machinelearning.apple.com` 后续调整 `__NEXT_DATA__` `pageProps.posts` 结构或 `.post-article` / `.postBody` 类名，需同步更新 `RSSHub` `/apple/ml-research` 路由选择器。
- `deploy/postgres/migrations/017-apple-ml-source.sql` 沿用仓库 `002`–`016` 单一重放约束策略（`render-cron-sql.mjs` 每次发布重放全量 `*.sql`）：发布失败时的自动回滚发生在 `--activate-unverified` 写入 `apple-ml` 数据之前（且 `rollback()` 不执行新 SQL），但一旦 `apple-ml` 实际写入数据，直接重跑旧镜像（`a057be2` 内含不含 `apple-ml` 的旧 `016` 检查约束）会被库表 `CHECK` 拒绝，后续若需下线应通过前向兼容变更/迁移关闭而非回放旧版约束。
- 备用 `RSSHub` fork（`ljh-project/RSSHub`）尚未执行 **Sync fork -> Update branch**，当前主站接入主实例 `https://rss.ljhboard.cn` 不受影响。
