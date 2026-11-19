# Modal Blog Source Integration (`ai`)

## Background

`Modal`（`https://modal.com/blog`）官方 Atom（`https://modal.com/blog/atom.xml`，`158` 条）不含任何摘要或正文，上游 `DIYgod/RSSHub` 也没有 `modal` 命名空间。自建 `RSSHub`（`master` @ `90cd7c7b7d`，源分支 `feat/modal-blog` @ `d3654a0b89`）已上线 `https://rss.ljhboard.cn/modal/blog`：通过 Atom 发现条目并发抓取文章页，补全分类、作者、16:9 封面与全文，并把内联 SVG 图表样式展开为显式属性。现将其接入 `rss-site` 的 `ai` 分区。

## Scope

- `packages/signals`：注册 `modal`（`ai`、`itemLimit: 20`、`rsshubPath: '/modal/blog'`、`cronSchedule: '50 5,11,17,23 * * *'`、`cronJobName: 'signal-ingest-modal'`），全站来源 `82`、`ai` 分区 `25`。
- 官方图标 `apps/web/public/source-icons/modal.svg`（取自 `https://modal.com/assets/favicon.svg`）与 `source-icon.tsx` 注册。
- 迁移 `deploy/postgres/migrations/014-modal-source.sql`（`013` 改为被 `014` 覆盖的占位）、`baseline.sql`、`deploy/server/business-jobs.json`（业务任务 `85` = `81` signal + `4` 维护，`cron.job = 87`）、`verify-release-runtime` 计数。
- 本地验证证据 `docs/development/evidence/modal-local-20261119.json`。

## Out of scope

- 不手动写生产库或提前启用 Cron；新任务保持 `verified = false`，发布后由 `sync-business-cron --activate-unverified` 自动试抓并激活。
- 不向上游 `DIYgod/RSSHub` 提交 PR。
- 不改阅读器渲染逻辑。

## Acceptance criteria

- `@rss-site/signals` 测试断言 `82` 个来源/Cron、`ai` `25`，并解析 `https://rss.ljhboard.cn/modal/blog`。
- 真实 `ingestSignal` 对线上 Feed 入库 `20` 条唯一文章，均含全文、日期、作者、封面且无动态 `social-image` 卡片。
- `biome`、`check-types`、`test`、`build`、`render-cron-sql.mjs`、`bash -n verify-release-runtime` 通过。
- 发布后自动验证并启用 `signal-ingest-modal`。

## Feasibility

自建实例 `https://rss.ljhboard.cn/modal/blog?limit=1`（HTTP `200`、`11,557` B、`1` 条）与默认（HTTP `200`、`1,246,474` B、`20` 条）无鉴权。最大单篇 `sandbox-bursting` 为 `426,886` B，低于 `524,288` B 约束。

## Implementation

- Registry/UI：`packages/signals/src/index.ts`、`index.test.ts`、`apps/web/components/source-icon.tsx`、`apps/web/public/source-icons/modal.svg`。
- DB/Cron：`014-modal-source.sql`、`013-native-feed-sources.sql`、`baseline.sql`、`business-jobs.json`、`verify-release-runtime`。

## Verification

- 真实 `ingestSignal`（[modal-local-20261119.json](evidence/modal-local-20261119.json)）：`parsedAndIngestedItems: 20`、`fullBodyMatches: 20`、`publicationDatesVerified: 20`、`namedAuthors: 20`、`coverImages: 20`、`badImageUrls: 0`、`uniqueUrls: 20`、`consecutiveRanks: true`、`maxContentHtmlBytes: 426886`。
- `biome check`（变更文件）0 错误；`pnpm check-types` `3/3`；`@rss-site/signals` `9 passed`；`render-cron-sql.mjs` 含 `signal-ingest-modal`；`bash -n deploy/server/verify-release-runtime` 退出码 `0`。
- 上游 RSSHub 路由已通过 `oxfmt`、`oxlint --type-aware`、`eslint`、`lizard -C 10`、`tsc`、`build:docs` 与 100 篇实时审计，`codex review` 无缺陷。

## Risks

- 备用实例 `ljh-project/RSSHub`（`rss1.ljhboard.cn`）尚未同步 `90cd7c7b7d`；主站消费 `rss.ljhboard.cn`，不受影响。
- 个别含大型内联 SVG 的文章体积较大，`parseSignalFeed` 对超 `512 KiB` 的正文回退为摘要，不会触发数据库约束。
