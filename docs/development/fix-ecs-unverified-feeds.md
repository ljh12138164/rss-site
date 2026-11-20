# 修复北京 ECS 4 个未激活来源的采集链路

## Background

在 [候选来源原生 Feed 采集](native-feed-ingestion.md) 合并上线后，通过 `alibabacloud-workbench-cli` 检查北京 ECS（`i-2ze77shgsxr3nwn6ghra`，`cn-beijing`）生产调度发现：`private.business_cron_jobs` 共 `87` 项中 `83` 项已验证激活，仅 `aws-ml`（`jobid: 1612`）、`import-ai`（`jobid: 1615`）、`dwarkesh`（`jobid: 1617`）、`chinatalk`（`jobid: 1619`）4 个任务持续处于 `verified = false`、`cron.job.active = false`。

在生产 `rss-site-web-1` 容器内实测 DNS 与 `fetch` 确认：这 4 个直连 `feedUrl` 的域名在北京 ECS 节点遭到 DNS 污染（`aws.amazon.com` 解析到 `127.0.0.2` / `2003::f11`；`www.chinatalk.media`、`importai.substack.com`、`www.dwarkesh.com` 解析到受阻 IP / `face:b00c`），导致每次发布试抓（`sync-business-cron --activate-unverified`）连续 3 次返回 `ECONNREFUSED` 或超时，而同容器请求自建 Vercel RSSHub（`https://rss.ljhboard.cn`）可正常返回 `200`。

## Scope

- 在自建 `RSSHub` 新增通用 AWS 分类博客路由 `/amazon/blogs/:category?`（`lib/routes/amazon/blogs.ts` 与 `lib/routes/amazon/templates/description.tsx`，基于官方分类 RSS `aws.amazon.com/blogs/<category>/feed/`，保留全文 HTML、作者、发布时间、分类与首图，支持通用 `limit`），并在自建 `master` 上线 `https://rss.ljhboard.cn/amazon/blogs/machine-learning`。
- 将 `rss-site` 的 [packages/signals/src/index.ts](../../packages/signals/src/index.ts) 中 4 个受阻源由直连 `feedUrl` 切换为自建 RSSHub `rsshubPath`：
  - `chinatalk`：`/substack/subscribe/chinatalk`
  - `aws-ml`：`/amazon/blogs/machine-learning`
  - `import-ai`：`/substack/subscribe/importai`
  - `dwarkesh`：`/substack/subscribe/dwarkesh`
- 在 [packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts) 增加上述 4 个来源的 `resolveSignalFeedUrl` 单元测试断言。
- 留存本地 `ingestSignal` 验证证据 [fix-ecs-unverified-feeds-local-20261120.json](evidence/fix-ecs-unverified-feeds-local-20261120.json)，更新 `HERMES.md` 与 [候选来源与工作流文档](../research/rsshub-route-candidates-and-workflow.md)。

## Out of scope

- 不改动 `source` ID、所属分区、`itemLimit`、Cron 调度时间、`deploy/server/business-jobs.json`、PostgreSQL 表结构及迁移文件，不在本地手动写生产数据库或提前启用 `pg_cron` 任务（待 PR 合并部署后由 `sync-business-cron --activate-unverified` 自动试抓激活）。
- 不修改其余 `80` 个已验证信号源配置或文章阅读器 UI/渲染逻辑。
- 不由工具直接向上游 `DIYgod/RSSHub` 提交 PR（仅保留自建上线与独立分支 `feat/amazon-blogs` 供用户提交上游 PR）。

## Acceptance criteria

- 自建 `RSSHub` `/amazon/blogs/machine-learning` 在默认、`?limit=1`、`?limit=100&format=json` 与 `/amazon/blogs?limit=1` 下均返回 HTTP `200`，通过 `build:docs`、`oxfmt`、`oxlint --type-aware --config=.oxlintrc.ci.json --deny-warnings`、`eslint`、`typecheck`、`lizard -C 10`、`RSSHub-docs` 构建与 `codex review`。
- 在北京 ECS `rss-site-web-1` 容器内实测 4 条新 RSSHub 地址均返回 HTTP `200`（`20` 条/源）。
- 本地真实调用 `ingestSignal` + `renderArticleContent` 校验 4 个来源均稳定入库 `20/20` 篇唯一文章，正文均在 `512 KiB` 以内、发布时间与作者完整、无异常图片 URL。
- `rss-site` 全仓 `biome`、`pnpm check-types`、`pnpm test`、`pnpm build`、`render-cron-sql.mjs`、`test-release-packaging.py` 与 `verify-release-runtime` 语法校验通过。

## Feasibility

- **Substack 3 个源（`chinatalk` / `import-ai` / `dwarkesh`）**：上游 `RSSHub` 已有 `/substack/subscribe/:user` 路由，实测 `dwarkesh` 对应 Substack 用户名为 `dwarkesh`（`dwarkeshpatel` 为空返回 `503`），3 条路径在 `https://rss.ljhboard.cn` 均直接返回完整正文 XML。
- **AWS ML Blog（`aws-ml`）**：上游现有 `/amazon/awsblogs/:locale?` 混杂全站博客且仅含 `postExcerpt` 截断摘要，因此新建 `/amazon/blogs/:category?` 消费官方分类全文 RSS（`https://aws.amazon.com/blogs/machine-learning/feed/` 等），实测全部 `20` 篇均含 `15,228`–`55,192` 字符正文、作者、日期与正文图片。
- **数据契约与激活链路**：`001-business-cron.sql` 中 `private.business_cron_jobs` 保留 `verified = false` 直到路径或验证通过；本次 4 个源 `path`（`/cron/signals/<source>`）不变，PR 合并部署后 `sync-business-cron --activate-unverified` 会自动对当前 4 个 `not verified` 任务逐项试抓、调用 `/cron/verify/:source` 并激活。

## Implementation

- **自建 `RSSHub`（分支 `feat/amazon-blogs` @ `1f86843ede`，基于 `upstream/master` `79a6bed886`；cherry-pick 至自建 `master` @ `67971cd6c5`）**：
  - 新增 `lib/routes/amazon/blogs.ts`（`path: '/blogs/:category?'`，默认 `aws`，正则校验 `^[a-z0-9-]+$` 并拒绝非法分类，单分类 `'blog'`，支持通用 `limit`，JSX 回退摘要，不调用 `.trim()` 处理 `title`，不使用 `allowEmpty: true`）。
  - 新增 `lib/routes/amazon/templates/description.tsx`（JSX `renderToString` 兜底渲染）。
- **`rss-site`（分支 `feat/fix-ecs-unverified-feeds`，基于 `origin/master` `3aafdbf`）**：
  - [packages/signals/src/index.ts](../../packages/signals/src/index.ts)：将 `chinatalk`、`aws-ml`、`import-ai`、`dwarkesh` 的 `feedUrl` 替换为 `rsshubPath`。
  - [packages/signals/src/index.test.ts](../../packages/signals/src/index.test.ts)：补充上述 4 个来源的 `resolveSignalFeedUrl` 断言。

## Verification

- **RSSHub 校验与上线**：
  - `pnpm run build:docs`、`oxfmt --check`、`oxlint --type-aware --config=.oxlintrc.ci.json --deny-warnings`（`0` 警告 `0` 错误）、`tsc --noEmit`、`eslint`、`lizard -l typescript -C 10 -w`、`RSSHub-docs` `vitepress build` 与 `codex review`（`gpt-6.1-sol` / `high`，`No actionable defects found`）全部通过。
  - 本地与公网 `https://rss.ljhboard.cn` 验证：`/amazon/blogs/machine-learning?limit=1`（HTTP `200`、`47,687` B）、默认（HTTP `200`、`682,133` B）、`?limit=100&format=json`（HTTP `200`、`592,259` B、`20` 篇唯一链接、`minDesc = 15,228`、`maxDesc = 55,192`）及 `/amazon/blogs?limit=1`（HTTP `200`、`25,799` B）全部通过；Vercel 部署 `67971cd6c5` 状态为 `success`。
- **北京 ECS 容器只读出站验证（`i-2ze77shgsxr3nwn6ghra` / `rss-site-web-1`）**：
  - `https://rss.ljhboard.cn/substack/subscribe/chinatalk`：HTTP `200`、`653 ms`、`868,790` B、`20` items
  - `https://rss.ljhboard.cn/amazon/blogs/machine-learning`：HTTP `200`、`191 ms`、`681,041` B、`20` items
  - `https://rss.ljhboard.cn/substack/subscribe/importai`：HTTP `200`、`103 ms`、`468,162` B、`20` items
  - `https://rss.ljhboard.cn/substack/subscribe/dwarkesh`：HTTP `200`、`198 ms`、`1,584,966` B、`20` items
- **`rss-site` 采集与仓库门禁验证**：
  - 本地 `ingestSignal` + `renderArticleContent` 实测（证据文件 [fix-ecs-unverified-feeds-local-20261120.json](evidence/fix-ecs-unverified-feeds-local-20261120.json)）：
    - `chinatalk`：`20/20` 入库、`20/20` 正文经 `renderArticleContent` 非空、`20/20` 日期与作者、`19` 张封面、`0` 异常图片、`maxContentHtmlBytes = 107,818`
    - `aws-ml`：`20/20` 入库、`20/20` 正文经 `renderArticleContent` 非空、`20/20` 日期与作者、`20` 张封面、`0` 异常图片、`maxContentHtmlBytes = 55,394`
    - `import-ai`：`20/20` 入库、`20/20` 正文经 `renderArticleContent` 非空、`20/20` 日期与作者、`19` 张封面、`0` 异常图片、`maxContentHtmlBytes = 30,077`
    - `dwarkesh`：`20/20` 入库、`20/20` 正文经 `renderArticleContent` 非空、`20/20` 日期与作者、`6` 张封面、`0` 异常图片、`maxContentHtmlBytes = 171,060`
  - 全仓代码与打包校验：`pnpm lint`（`biome check .`，`370` 文件通过）、`pnpm check-types`（`3/3` 包通过）、`pnpm test`（`@rss-site/signals` `9 passed`、`@rss-site/api` `123 passed`、`@rss-site/web` `192 passed | 22 skipped`，共 `324 passed | 22 skipped`）、`pnpm build`（生成 `95/95` 静态页 + `early-hints` + `sw.js`）、`CRON_SECRET=local-verify-only node apps/web/scripts/render-cron-sql.mjs`（`316` 行 / `29,986` 字符）、`wsl python3 -B deploy/server/test-release-packaging.py -v`（`8/8 OK`）与 `wsl bash -n deploy/server/verify-release-runtime` 全部通过。

## Review

- 按仓库标准与验收标准复核：仅将受北京 ECS DNS 污染阻塞的 4 个来源切至自建 RSSHub 路由，未改动源 ID、分区、Cron 调度、DB 迁移及无关来源；未绕过生产验证门禁。无剩余阻塞项或需要拆出的后续改进项，不额外创建空 roadmap。

## Risks

- 备用分流实例 `ljh-project/RSSHub`（`rss1.ljhboard.cn`）在同步主仓库前尚不含 `/amazon/blogs/:category?`；当前这 4 个来源统一走主实例 `https://rss.ljhboard.cn`，不受影响。
- PR 合并至 `master` 并部署到 ECS 后，需观察 CI 中 `sync-business-cron --activate-unverified` 自动激活 4 项任务及公开页面渲染结果。
