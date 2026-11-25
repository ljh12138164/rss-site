# 新闻、社交、财经与游戏分区 20 路原生全文直连来源

## 背景

`rss-site` 的 `news`（原 `6` 路）、`social`（原 `6` 路）、`finance`（原 `5` 路）与 `games`（原 `13` 路）此前主要依赖有限的国内来源及 `RSSHub` 路由。为避免给主备 Vercel `RSSHub` 实例（`rss.ljhboard.cn` / `rss1.ljhboard.cn`）增加 Active CPU 消耗，先从官方原生 RSS/Atom 全文源中筛选高质活跃媒体直连入库，扩充四个相对薄弱的阅读分区；待后续再按需评估 `RSSHub` 路由类来源。

## 范围

- **[packages/signals/src/index.ts](../../packages/signals/src/index.ts)** & **[index.test.ts](../../packages/signals/src/index.test.ts)**：
  - 新增 `20` 路原生直连（`feedUrl`）全文来源（均设为 `itemLimit: 20`、`isArticle: true`，每 6 小时于 UTC `5,11,17,23` 空闲分钟 `1–14, 16–19, 21–22` 错峰触发，全站更新为 `122` 个源 / `122` 个 `SIGNAL_CRON_JOBS`）：
    - **新闻 `news`（`6 -> 8`）**：`propublica`、`grist`
    - **社交 `social`（`6 -> 12`）**：`ifanr`、`appinn`、`solidot`、`lifehacker`、`torrentfreak`、`daring-fireball`
    - **财经 `finance`（`5 -> 12`）**：`fortune`、`dl-news`、`marginal-revolution`、`ritholtz`、`abnormal-returns`、`of-dollars-and-data`、`unchained`
    - **游戏 `games`（`13 -> 18`）**：`aftermath`、`ars-gaming`、`rpgfan`、`playstation-lifestyle`、`overkill`
  - 同步更新 `news`、`social`、`finance`、`games` 分区说明描述，不改动既有页面路径、标题与抓取管道。
- **[apps/web/components/source-icon.tsx](../../apps/web/components/source-icon.tsx)** & **[apps/web/public/source-icons/](../../apps/web/public/source-icons/)**：顺带补齐并统一抓取全站此前缺失的 `59` 路官方品牌/站点图标（新增 `react-icons/si`：`SiVercel`、`SiLinear`、`SiArstechnica`、`SiIgn`、`SiPlaystation` 与 Rust 品牌橙色 `SiRust`，并将 `bun`、`torrentfreak`、`rust-blog`、`this-week-in-rust` 等升级为官方彩色标识；其余来源匹配官网 SVG/PNG/ICO/WebP 图标，并将全目录 `53` 个 PNG 统一压缩转为 WebP，`632,754 B -> 87,272 B`），实现全站 `122/122` 来源 `100%` 图标覆盖。
- **[deploy/postgres/migrations/021-direct-section-feeds.sql](../../deploy/postgres/migrations/021-direct-section-feeds.sql)**（覆盖 [020-chrome-source.sql](../../deploy/postgres/migrations/020-chrome-source.sql)）与 **[baseline.sql](../../deploy/postgres/baseline.sql)**：同步 4 张表的来源与分区 CHECK 约束。
- **[deploy/server/business-jobs.json](../../deploy/server/business-jobs.json)** & **[verify-release-runtime](../../deploy/server/verify-release-runtime)**：新增 `20` 项 `signal-ingest-*` 任务（业务任务合计 `125` 项，`cron.job` 合计 `127` 项），合并部署后由 `sync-business-cron --activate-unverified` 增量验证并逐项启用。

## 验收标准

- 所有 `20` 路直连源均在北京生产 ECS（`rss-site-web-1`）实测返回 HTTP `200`（跳过超时或 `403`/断更的 `Axios`、`Vox`、`The Intercept`、`The Conversation`、`MIT News`、`The Atlantic`、`V2EX` 直连、`Kottke`、`Siliconera`、`Destructoid`、`Global Voices`、`Blockworks`、`TouchArcade` 等）。
- 基于真实原生 Feed 运行 `ingestSignal` + `renderArticleContent` 稳定解析入库 `20/20` 源、共 `313` 篇文章（[证据文件](evidence/direct-section-feeds-20261125.json)），渲染 HTML `100%` 非空且均小于 `524,288` B 约束。
- 全仓格式化/lint、类型检查、单元测试、Next 构建、`render-cron-sql.mjs` 与发布包单测全部通过，不修改 `RSSHub` 或 `deploy/feed-relay/index.ts`。

## 验证

- **北京生产 ECS（`i-2ze77shgsxr3nwn6ghra`、`rss-site-web-1`）直连实测**（`15s` 超时）：
  - `20` 个入选来源全部直连返回 HTTP `200`，耗时 `406ms–6,053ms`（`ifanr` `406ms`、`fortune` `678ms`、`solidot` `790ms`、`appinn` `815ms`、`ritholtz` `836ms`、`torrentfreak` `861ms`、`marginal-revolution` `886ms`、`daring-fireball` `2,093ms`、`propublica` `1,657ms`、`dl-news` `1,981ms`、`lifehacker` `1,279ms`、`unchained` `1,917ms`、`aftermath` `2,806ms`、`abnormal-returns` `2,919ms`、`of-dollars-and-data` `3,601ms`、`ars-gaming` `4,818ms`、`grist` `4,832ms`、`playstation-lifestyle` `1,500ms`、`overkill` `2,101ms`、`rpgfan` `6,053ms`）。
- **真实 Feed `ingestSignal` + `renderArticleContent` 核验**（[direct-section-feeds-20261125.json](evidence/direct-section-feeds-20261125.json)）：
  - `sourceCount = 20`、`totalIngestedItems = 313`、`allValid = true`；全部 `313` 条目渲染非空且含合法日期、`badImageUrls = 0`，单篇最大正文 `320,983` B（`grist`）。
- **仓库门禁**：`pnpm lint`（`biome check .`，`380` 个文件）、`pnpm check-types`（`3/3`）、`pnpm test`（`signals` `9/9`、`api` `129/129`、`web` `196 passed | 22 env-gated skipped`）、`pnpm build`（`133/133` 静态页）、`render-cron-sql.mjs`、`bash -n deploy/server/verify-release-runtime` 与 `test-release-packaging.py`（`8/8`）全部通过。
