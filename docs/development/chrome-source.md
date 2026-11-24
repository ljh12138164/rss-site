# Chrome for Developers Blog 全文来源

## 背景

[Chrome for Developers Blog](https://developer.chrome.com/blog)（`developer.chrome.com/blog`）官网静态 `/blog/feed.xml` 停留在 `2026-10-07` 且仅输出 `10` 条短摘要（约 `119` 字符 / `16` words）；实际网站通过 DevSite 动态接口 `POST https://developer.chrome.com/_d/dynamic_content` 持续发布最新全文文章，包含 Chrome 发布说明、Web 平台指南、DevTools 更新与端侧 AI 实践。此前北京生产 ECS 直连 Google CDN IP（`173.194.203.*`）亦存在 `25s` 超时风险，适合经由自建 `RSSHub` 提供全文代理路由，再接入 `rss-site` 的 `technology` 分区。

## 范围

- **自建 `RSSHub`**：分支 `feat/chrome-developer-blog`（`b5a8f2a87d`，基于 `upstream/master` `0bff31a319`）新增 `lib/routes/chrome/namespace.ts` 与 `lib/routes/chrome/blog.tsx`，暴露 `/chrome/blog/:lang?`（默认 `en`），已 cherry-pick 至自建 `master` @ `05d98dd64a` 并部署上线 `https://rss.ljhboard.cn/chrome/blog`。
- **`rss-site`**（分支 `feat/chrome-source`，基于 `origin/master` `c963150`）：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)：在 `technologySources` 注册 `chrome`（`name: 'Chrome Developers'`、`code: 'CR'`、`shortName: 'Chrome'`、`itemLimit: 20`、`rsshubPath: '/chrome/blog'`、`isArticle: true`、`cronSchedule: '48 4,16 * * *'`、`cronJobName: 'signal-ingest-chrome'`），同步更新 [index.test.ts](../../packages/signals/src/index.test.ts)（`7` 分区、`102` 源、`102` 抓取任务、`technology` `41` 源/`40` 文章源）。
  - 下载 Chrome 官方多色矢量徽标至 [chrome.svg](../../apps/web/public/source-icons/chrome.svg)（`1,744` B），在 [source-icon.tsx](../../apps/web/components/source-icon.tsx) 注册 `chrome` 文件图标。
  - 新增检查约束迁移 [020-chrome-source.sql](../../deploy/postgres/migrations/020-chrome-source.sql)（标明 [019-native-tech-feeds.sql](../../deploy/postgres/migrations/019-native-tech-feeds.sql) 已被覆盖），同步更新 [baseline.sql](../../deploy/postgres/baseline.sql)、[business-jobs.json](../../deploy/server/business-jobs.json)（共 `105` 项业务任务）与 [verify-release-runtime](../../deploy/server/verify-release-runtime)（`105` / `107`）。

## 验收标准

- 自建 `RSSHub` 本地全量审计 `/chrome/blog?limit=100`（`100/100`）、默认 `/chrome/blog`（`20/20`）、`?limit=1`、`zh-CN`/`bn`/`nl`/`fa`/`ru` 及非法语言错误响应（`503`）全部通过，零 `<style>`/`.dcc-authors`/`.wd-pubdates` 泄漏，YouTube 嵌入保留 `referrerpolicy="strict-origin-when-cross-origin"`，且区分 `pubDate` 与 `updated`。
- 公网 `https://rss.ljhboard.cn/chrome/blog?limit=1`、`https://rss.ljhboard.cn/chrome/blog` 与 `https://rss.ljhboard.cn/chrome/blog?limit=5&format=atom` 均返回 HTTP `200`。
- 基于公网 Feed `https://rss.ljhboard.cn/chrome/blog` 运行 `parseSignalFeed` + `renderArticleContent` 稳定解析 `20/20` 篇文章（[证据文件](evidence/chrome-local-20261124.json)），正文体积上限符合 PostgreSQL `524,288` B 约束。
- `rss-site` 全仓格式、lint、类型检查、单元测试、Next 构建、`render-cron-sql.mjs` 与发布包单测全部通过；PR 不开启自动合并，由现有发布门禁在合并后增量试抓激活。

## 可行性

复用既有 `technology` 分区单源接入架构（与 `rust-blog`、`cloudflare-blog`、`arm` 一致），无需改动前端分页路由、阅读器白名单或 `deploy/feed-relay/index.ts`。关键风险与应对如下：
- **静态 RSS 滞后于官网**：官网 `/blog/feed.xml` 滞后逾一个月，`RSSHub` 路由改为调用 DevSite 官方 `POST /_d/dynamic_content` 接口获取实时列表。
- **正文内联样式与作者卡片污染封面**：文章 `.devsite-article-body` 首部自带 `<style>`、`.dcc-authors` 头像和 `.wd-pubdates`；`RSSHub` 路由先提取作者及发布/更新时间再剥离头部噪声，避免作者头像误作文章封面，且入库正文均低于 `512 KiB`。

## 实现

- **`RSSHub`**：分支 `feat/chrome-developer-blog` @ `b5a8f2a87d`（基于 `upstream/master` `0bff31a319`），已同步自建 `master` @ `05d98dd64a` 上线 `https://rss.ljhboard.cn/chrome/blog`。
- **`rss-site`**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)、[packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)
  - [apps/web/public/source-icons/chrome.svg](../../apps/web/public/source-icons/chrome.svg)、[apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx)
  - [deploy/postgres/migrations/020-chrome-source.sql](../../deploy/postgres/migrations/020-chrome-source.sql)、[019-native-tech-feeds.sql](../../deploy/postgres/migrations/019-native-tech-feeds.sql)、[baseline.sql](../../deploy/postgres/baseline.sql)
  - [deploy/server/business-jobs.json](../../deploy/server/business-jobs.json)、[deploy/server/verify-release-runtime](../../deploy/server/verify-release-runtime)
  - [chrome-local-20261124.json](evidence/chrome-local-20261124.json)、[rsshub-route-candidates-and-workflow.md](../research/rsshub-route-candidates-and-workflow.md)、[HERMES.md](../../HERMES.md)

## 验证

- **`RSSHub` 与公网实测**：
  - `oxfmt --check`、`oxlint --type-aware --config=oxlint.ci.config.ts --deny-warnings`（`0/0`）、`eslint`、`tsc --noEmit`、`lizard -l typescript -C 10 -w`、`pnpm run build:docs` 与 `gpt-6.2-sol` Codex review（修复 `renderYoutube` `referrerpolicy`、修订时间戳缓存键、`pubDate`/`updated` 分离及全部 `22` 个支持语言后重测通过）；`RSSHub-docs` 本地双语文档与 `localhost:1200` 经浏览器预览验收。
  - 公网 `https://rss.ljhboard.cn/chrome/blog?limit=1`（`16,894` B）、`/chrome/blog`（`474,367` B）与 `/chrome/blog?limit=5&format=atom`（`137,951` B）均返回 HTTP `200`（Vercel 部署 `05d98dd64a` `success`）。
- **`rss-site` 端到端与仓库门禁**：
  - 真实 XML 输入 `parseSignalFeed` + `renderArticleContent`（[chrome-local-20261124.json](evidence/chrome-local-20261124.json)）：`parsedAndIngestedItems = 20`、`fullBodyMatches = 20`、`renderedNonEmpty = 20`、`publicationDatesVerified = 20`、`namedAuthors = 17`、`coverImages = 19`、`badImageUrls = 0`、`maxContentHtmlBytes = 46,249`、`uniqueUrls = 20`（其中 `3` 篇版本说明官方无个人作者，`1` 篇策略公告无配图）。
  - 全仓门禁已复跑通过：`pnpm lint`（`biome check .`，`379` 个文件）、`pnpm check-types`（`3/3`）、`pnpm test`（`signals` `9/9`、`api` `126/126`、`web` `196 passed | 22 env-gated skipped`）、`pnpm build`（`113/113` 静态页）、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py`（`8/8`）。

## 风险

- `developer.chrome.com/_d/dynamic_content` 为 DevSite 前端动态接口，若后续请求格式或列索引变更需同步调整 `lib/routes/chrome/blog.tsx` 映射。
- `deploy/postgres/migrations/020-chrome-source.sql` 覆盖 `019-native-tech-feeds.sql` 检查约束；若后续需下线 `chrome`，应通过前向迁移而非回滚旧约束处理。
- 备用实例 `rss1.ljhboard.cn`（`ljh-project/RSSHub`）待同步 `Sync fork`，主站目前走主实例 `https://rss.ljhboard.cn` 不受影响。
