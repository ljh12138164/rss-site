# Sherwood News 全文来源接入

## 背景

[Sherwood News](https://sherwood.news/)（Robinhood 旗下财经与商业媒体）官方静态 `/rss.xml` 已在 `2026-08-17` 停更且仅含单句摘要；而站点基于 Next.js + Contentful 的每日财经早报 `/snacks`（[Sherwood Snacks](https://sherwood.news/snacks)）及首页 `mostRecent` / `feedResponse` 持续保持工作日日更。由于高并发详情抓取会触发上游 HTTP `429` 限流，因此在伴随 `RSSHub` 仓库实现受控并发的全文代理路由（`/sherwood/news` 与 `/sherwood/snacks`），再双路合并接入 `rss-site` 的 `finance`（财经）分区。

## 范围

- **配套 `RSSHub` 分支（`feat/sherwood` @ `6bba48a12b`，基于 `upstream/master` `a8c0f05ace`）**：
  - 新增 `lib/routes/sherwood/`（`namespace.ts`、`news.ts`、`snacks.ts`、`utils.ts`、`templates/description.tsx`），通过 `__NEXT_DATA__` 与轻量化 `/_next/data/<buildId>/...json` 解析完整 Contentful Rich Text、折叠续文、`assetMedia` 图表、图片来源署名与内联股票代码标注，并以 `DETAIL_CONCURRENCY = 2` + `cache.tryGet` + `retry: 2` 应对限流；**待同步推送并部署至自建 `RSSHub`（`https://rss.ljhboard.cn`）后再在生产环境开启抓取激活**。
- **`rss-site`（分支 `feat/sherwood-source`，基于 `origin/master` `76cb220`）**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)：在 `financeSources` 注册 `sherwood`（`name: 'Sherwood News'`、`code: 'SN'`、`shortName: 'Sherwood'`、`itemLimit: 30`、`feeds: [{ rsshubPath: '/sherwood/news?limit=20' }, { rsshubPath: '/sherwood/snacks?limit=10' }]`、`isArticle: true`、`cronSchedule: '23 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-sherwood'`），同步更新 [index.test.ts](../../packages/signals/src/index.test.ts)（`7` 分区、`123` 源、`123` 任务、`finance` `13` 源）。
  - 抓取官网 [apple-touch-icon.png](https://cdn.robinhood.com/assets/sherwood/favicon/apple-touch-icon.png) 并无损/高质压缩为 [sherwood.webp](../../apps/web/public/source-icons/sherwood.webp)（`180x180`，`7,609 B -> 3,464 B`），在 [source-icon.tsx](../../apps/web/components/source-icon.tsx) 注册图标。
  - 新增迁移 [022-sherwood-source.sql](../../deploy/postgres/migrations/022-sherwood-source.sql) 与 [baseline.sql](../../deploy/postgres/baseline.sql) 四表 CHECK 约束，同步 [business-jobs.json](../../deploy/server/business-jobs.json)（`126` 项任务）与 [verify-release-runtime](../../deploy/server/verify-release-runtime)（`126` / `128`）。

## 验收与验证

- 基于本地实跑的 `http://localhost:1200/sherwood/news?limit=20` 与 `/sherwood/snacks?limit=10` 通过真实 `ingestSignal` + `renderArticleContent` 校验（[证据文件](evidence/sherwood-local-20261125.json)）：
  - `parsedAndIngestedItems = 30`、`uniqueUrls = 30`、`renderedNonEmpty = 30`、`publicationDatesVerified = 30`、`namedAuthors = 20`、`coverImages = 30`、`badImageUrls = 0`、`maxContentHtmlBytes = 23,672`、`maxRenderedHtmlBytes = 27,948`。
- `rss-site` 全仓检查：`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`test-release-packaging.py` 与 `bash -n deploy/server/verify-release-runtime` 均在最终提交前复跑验证。

## 生产发布顺序提醒

- 合并本 PR 到 `rss-site` `master` 前（或正式激活 `signal-ingest-sherwood` 前），需先将 `RSSHub` 分支 `feat/sherwood` 合并/Cherry-pick 至自建 `RSSHub` `master` 并完成 `https://rss.ljhboard.cn` 部署；若 `rss-site` 先发布，`sync-business-cron --activate-unverified` 会仅将该新任务保持未激活状态（`verified = false`），待 `RSSHub` 上线后再次增量验证即可激活。
