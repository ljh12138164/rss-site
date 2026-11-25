# Sherwood News 全文来源接入

## 背景

[Sherwood News](https://sherwood.news/)（Robinhood 旗下财经与商业媒体）官方静态 `/rss.xml` 已在 `2026-08-17` 停更且仅含单句摘要；而站点基于 Next.js + Contentful 的每日财经早报 `/snacks`（[Sherwood Snacks](https://sherwood.news/snacks)）及首页 `mostRecent` / `feedResponse` 持续保持工作日日更。由于高并发详情抓取会触发上游 HTTP `429` 限流，因此在伴随 `RSSHub` 仓库实现受控并发的全文代理路由（`/sherwood/news` 与 `/sherwood/snacks`），再双路合并接入 `rss-site` 的 `finance`（财经）分区。

## 范围

- **配套 `RSSHub` 分支（`feat/sherwood` @ `9d63848970`，基于 `upstream/master` `a8c0f05ace`）**：
  - 新增 `lib/routes/sherwood/`（`namespace.ts`、`news.ts`、`snacks.ts`、`utils.ts`、`templates/description.tsx`），通过 `__NEXT_DATA__` 与轻量化 `/_next/data/<buildId>/...json` 解析完整 Contentful Rich Text、折叠续文、`assetMedia` 图表、图片来源署名与内联股票代码标注，并以 `DETAIL_CONCURRENCY = 2` + `cache.tryGet` + `retry: 2` 应对限流。
  - 已 cherry-pick 至自建 `RSSHub` `master` `@ 4b2494df50` 并通过 Vercel 部署上线 `https://rss.ljhboard.cn/sherwood/news` 与 `/sherwood/snacks`；上游 PR 已提交至 [`DIYgod/RSSHub#24027`](https://github.com/DIYgod/RSSHub/pull/24027)（提交 `9d63848970` 移除 `utils.ts` 内 11 个冗余 `export` 后 `Lint`/`Knip`/`oxlint`/`CodeFactor` 通过）。
- **`rss-site`（[PR #118](https://github.com/ljh12138164/rss-site/pull/118)，已合入 `master` `@ ff14530`）**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)：在 `financeSources` 注册 `sherwood`（`name: 'Sherwood News'`、`code: 'SN'`、`shortName: 'Sherwood'`、`itemLimit: 30`、`feeds: [{ rsshubPath: '/sherwood/news?limit=20' }, { rsshubPath: '/sherwood/snacks?limit=10' }]`、`isArticle: true`、`cronSchedule: '23 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-sherwood'`），同步更新 [index.test.ts](../../packages/signals/src/index.test.ts)（`7` 分区、`123` 源、`123` 任务、`finance` `13` 源）。
  - 抓取官网 [apple-touch-icon.png](https://cdn.robinhood.com/assets/sherwood/favicon/apple-touch-icon.png) 并无损/高质压缩为 [sherwood.webp](../../apps/web/public/source-icons/sherwood.webp)（`180x180`，`7,609 B -> 3,464 B`），在 [source-icon.tsx](../../apps/web/components/source-icon.tsx) 注册图标。
  - 新增迁移 [022-sherwood-source.sql](../../deploy/postgres/migrations/022-sherwood-source.sql) 与 [baseline.sql](../../deploy/postgres/baseline.sql) 四表 CHECK 约束，同步 [business-jobs.json](../../deploy/server/business-jobs.json)（`126` 项任务）与 [verify-release-runtime](../../deploy/server/verify-release-runtime)（`126` / `128`）。

## 验收与验证

- 基于本地实跑的 `http://localhost:1200/sherwood/news?limit=20` 与 `/sherwood/snacks?limit=10` 通过真实 `ingestSignal` + `renderArticleContent` 校验（[证据文件](evidence/sherwood-local-20261125.json)）：
  - `parsedAndIngestedItems = 30`、`uniqueUrls = 30`、`renderedNonEmpty = 30`、`publicationDatesVerified = 30`、`namedAuthors = 20`、`coverImages = 30`、`badImageUrls = 0`、`maxContentHtmlBytes = 23,672`、`maxRenderedHtmlBytes = 27,948`。
- `rss-site` 全仓检查：`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`test-release-packaging.py` 与 `bash -n deploy/server/verify-release-runtime` 均在最终提交前复跑验证。

## 生产发布与线上验证（2026-11-25）

- **自建 `RSSHub`（`master` `@ 4b2494df50`）**：Vercel 部署完成（`Deployment has completed`），公网实测：
  - `GET https://rss.ljhboard.cn/sherwood/snacks?limit=1`：HTTP `200`（`15,987` B，`1` 条）
  - `GET https://rss.ljhboard.cn/sherwood/news?limit=1`：HTTP `200`（`24,135` B，`1` 条）
- **`rss-site` 生产发布（CI Run `#45538179899`，`sha-ff14530b72a269ea38bfcc27a5a4350772825790`）**：
  - `verify` 与 `deploy` 均成功；发布日志确认 `PostgreSQL Cron configuration synchronized` -> `Automatically verified and activated 1 PostgreSQL Cron job(s)`（`signal-ingest-sherwood` 自动通过试抓与校验激活）、`listPrewarm` `128/128` 全部成功。
- **公开生产页面实测**：
  - `GET https://news.ljhboard.cn/finance/sherwood`：HTTP `200`（`204,046` B，已展示 `Sherwood News` 与最新一期内容）
  - `GET https://news.ljhboard.cn/finance`：HTTP `200`（`183,805` B，财经分区已包含 `Sherwood` 卡片）
- **上游 `RSSHub` PR**：[`DIYgod/RSSHub#24027`](https://github.com/DIYgod/RSSHub/pull/24027)（分支 `feat/sherwood` `@ 9d63848970`），`Lint`（含 `Knip`/`Typecheck`、`1m30s`）、`oxlint`、`CodeFactor`、`Build radar and maintainer`、`Scan` 与 `Vitest Playwright` 均已通过，待上游审阅合入；备用实例 `rss1.ljhboard.cn`（`ljh-project/RSSHub`）后续可按需同步分叉。
