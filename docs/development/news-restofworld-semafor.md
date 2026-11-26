# 新闻分区接入 Rest of World 与 Semafor

## 背景

`news`（新闻）分区此前仅 `8` 路来源，为全站最薄的内容分区。实测两个高质量国际新闻媒体存在不同的接入诉求：

- **Rest of World**（`https://restofworld.org/`）：官网 `/feed/latest/` 仅输出 `165–200` 字符的截断摘要，且在北京生产 ECS 上直连超时（`8s` 拦截）；需由 `RSSHub` 实现全文路由并提交上游 PR。
- **Semafor**（`https://www.semafor.com/rss.xml`）：官方 RSS 已在 `<content:encoded>` 输出与网页端完全一致的 `100%` 全文及配图（`270` 篇，无需再写重复 RSSHub 路由），但在北京生产 ECS 上直连同样超时（`8s` 拦截）；按仓库固定公开中继规范通过 Cloudflare Worker [deploy/feed-relay/index.ts](../../deploy/feed-relay/index.ts)（`https://feeds.ljhboard.cn/semafor`）转发。

## 范围

- **自建 `RSSHub`（分支 `feat/restofworld` @ `6f8203fe29`，基于 `upstream/master` `ea305beab7`）**：
  - 新增 `lib/routes/restofworld/`（`namespace.ts`、`latest.ts`、`utils.ts`、`templates/description.tsx`），从 `/feed/latest/` 发现条目（清理 `utm_*`），抓详情补全 `.post-content` 全文、JSON-LD 作者/发布与修订时间/分类标签、还原 `data-src` 图表与视频 `<iframe>`、并将内联 `.explainer-tag` 术语气泡及无尺寸 `<svg><use>` 清理为普通正文链接（解决独立阅读器空白占位问题）。
  - 已 cherry-pick 至自建 `RSSHub` `master` @ `fa159ab56a` 并上线 Vercel，公网 `https://rss.ljhboard.cn/restofworld/latest?limit=1` 实测 HTTP `200`（`13,784 B`）。
- **`rss-site`（分支 `feat/news-restofworld-semafor`，基于 `master` `c714de7`）**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts) & [index.test.ts](../../packages/signals/src/index.test.ts)：在 `newsSources`（`8 -> 10`，全站 `123 -> 125`）注册 `restofworld`（`rsshubPath: '/restofworld/latest'`、`24 5,11,17,23 * * *`）与 `semafor`（`feedUrl: 'https://feeds.ljhboard.cn/semafor'`、`26 5,11,17,23 * * *`）。
  - [deploy/feed-relay/index.ts](../../deploy/feed-relay/index.ts) & [feed-relay.test.ts](../../server/api/src/ingestion/feed-relay.test.ts)：新增 `/semafor -> https://www.semafor.com/rss.xml` 固定转发规则及单测（**注：需在 `deploy/feed-relay` 执行 `wrangler deploy` 部署 Worker 后，`semafor` 方可完成生产回环激活；`sync-business-cron --activate-unverified` 会在未部署前自动保持 `semafor` 为 `verified = false` 而不阻塞 `restofworld` 与发布**）。
  - 新增并压缩官方品牌图标 [restofworld.webp](../../apps/web/public/source-icons/restofworld.webp)（`180x180`，`12,035 B -> 4,682 B`）与 [semafor.webp](../../apps/web/public/source-icons/semafor.webp)（`256x256`，`15,998 B -> 2,850 B`），注册至 [source-icon.tsx](../../apps/web/components/source-icon.tsx)。
  - 新增迁移 [023-restofworld-semafor-sources.sql](../../deploy/postgres/migrations/023-restofworld-semafor-sources.sql)（将 [022-sherwood-source.sql](../../deploy/postgres/migrations/022-sherwood-source.sql) 标为 `-- Superseded` 占位），同步更新 [baseline.sql](../../deploy/postgres/baseline.sql)、[business-jobs.json](../../deploy/server/business-jobs.json)（`128` 项任务）与 [verify-release-runtime](../../deploy/server/verify-release-runtime)（含 `'restofworld'` 与 `'semafor'` 重放夹具，`128` / `130`）。

## 验收与验证

- 真实 `ingestSignal` + `relay.fetch` + `renderArticleContent` 校验（[证据文件](evidence/news-restofworld-semafor-20261126.json)）：
  - `restofworld`（`http://localhost:1200/restofworld/latest`）：`12/12` 入库有效、URL 去重 `12/12`、`dates: 12`、`namedAuthors: 12`、`coverImages: 12`、`badImageUrls: 0`、最大正文 `12,946 B`。
  - `semafor`（`relay.fetch('https://feeds.ljhboard.cn/semafor')`）：`20/20` 入库有效、URL 去重 `20/20`、`dates: 20`、`namedAuthors: 20`、`coverImages: 20`、`badImageUrls: 0`、最大正文 `8,835 B`。
- 全仓门禁：`biome` / `lint`、`check-types`、`vitest`、`next build`、`render-cron-sql.mjs`、`verify-release-runtime` 语法校验与 `test-release-packaging.py` 均在最终提交前复跑验证。
