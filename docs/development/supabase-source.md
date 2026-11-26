# 科技专区接入 Supabase Blog

## 背景

`Supabase Blog`（`https://supabase.com/blog`）官方 RSS（`https://supabase.com/rss.xml`）仅返回约 `90–160` 字符的纯文本摘要、缺少正文、分类标签、作者与封面图；且部分文章的基准图表（如 DBArena）和控制台截图由客户端 Hydration 注入、CodeHike 代码块包含行号占位与内联样式，直接抓取无法在独立阅读器或站内文章页完整呈现。

## 范围

- **自建 `RSSHub`（分支 `feat/supabase-blog` @ `645db354f3`，基于 `upstream/master` `df3330830a`）**：
  - 新增 `lib/routes/supabase/`（`namespace.ts`、`blog.ts`、`utils.ts`、`templates/description.tsx`），以官方 `-0700` 时区 `rss.xml` 作为候选条目池，并发拉取 SSR HTML 与官方 `.md` 接口，按原文顺序还原 Hydration 图表/截图、解包 `/_next/image` 封面图、将 CodeHike 代码块规范化为标准 `<pre><code>`、补全 `<video>`/`<iframe>` 媒体并剥离标题复制锚点图标及装饰性 `aria-hidden` `<svg>`。
  - 已 cherry-pick 至自建 `RSSHub` `master`（`0651d708fc`）并上线 Vercel（`https://rss.ljhboard.cn/supabase/blog?limit=1` 与默认 `/supabase/blog` 实测均返回 HTTP `200`）。
- **`rss-site`（分支 `feat/supabase-source`，基于 `master` `e0b214a`）**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts) & [index.test.ts](../../packages/signals/src/index.test.ts)：在 `technologySources`（`41 -> 42`，全站 `125 -> 126`）注册 `supabase`（`code: 'SB'`、`rsshubPath: '/supabase/blog'`、`itemLimit: 15`、`cronSchedule: '49 4,10,16,22 * * *'`、`cronJobName: 'signal-ingest-supabase'`）。
  - [apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx) & [apps/web/lib/site-messages.ts](../../apps/web/lib/site-messages.ts)：接入官方品牌图标 `SiSupabase`（`#3ecf8e` / `#171717`）并补齐来源描述的中英文双语映射。
  - 新增迁移 [024-supabase-source.sql](../../deploy/postgres/migrations/024-supabase-source.sql)（将 [023-restofworld-semafor-sources.sql](../../deploy/postgres/migrations/023-restofworld-semafor-sources.sql) 置为 `-- Superseded` 占位），同步更新 [baseline.sql](../../deploy/postgres/baseline.sql)、[business-jobs.json](../../deploy/server/business-jobs.json)（`129` 项任务）与 [verify-release-runtime](../../deploy/server/verify-release-runtime)（含 `'supabase'` 重放夹具，`129` / `131`）。

## 验收与验证

- 真实 `fetchSignalFeed` + `ingestSignal` + `renderArticleContent` 核验（`https://rss.ljhboard.cn/supabase/blog`，[证据文件](evidence/supabase-20261126.json)）：
  - `15/15` 入库有效、`uniqueUrls: 15`、`renderedNonEmpty: 15`、`dates: 15`、`namedAuthors: 15`、`coverImages: 15`、`badImageUrls: 0`、`maxRenderedHtmlBytes: 12,949 B`。
- 仓库门禁：`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`verify-release-runtime` 语法校验与 `test-release-packaging.py` 均在最终提交前复跑验证。
