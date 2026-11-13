# 品牌图标重设计、广告清理与全站 UI 细节统一（feat/transit-icon-redesign）

## Background

在 `feat/transit-ui-redesign` 合入 `master`（`9faaba9`）后，针对桌面端（PC）界面细节、品牌识别与广告干扰进行了实机排查，发现四类待解决体验问题：

1. **品牌图标与本地 `.ico` 缓存问题**：旧版 `TransitMark` 在小尺寸下对比度弱、`icon.svg` 风格平淡；且 `master` 先前移除了 `favicon.ico`，导致本地开发及浏览器标签页请求 `/favicon.ico` 时退化或命中旧缓存图标。
2. **悬浮广告弹窗干扰顶栏**：`apps/web/components/monetag-script.tsx` 注入的 Monetag In-Page Push 广告在桌面端右上角弹出悬浮通知（带 `"Ad"` 角标），遮挡顶部实用工具栏。
3. **原生表单/标签控件割裂**：站内仍混用原生 `<select>`、`<input type="checkbox">`、`<input type="radio">`、`<input type="url">`、`<textarea>`、`<details>` 及手写 `<fieldset>/<button>` 分段开关，缺少统一的 `react-aria-components` 焦点环、键盘导航与弹出层层叠管理。
4. **PC 端 UI 细节瑕疵**：顶栏频道圆点在未激活与激活态存在灰圈光晕，`热门交汇` 标题前缀蓝色实心圆点、右栏宽屏（`xl`）重复 `今日日报 →` 链接、禁用态主按钮 `disabled:opacity-50` 对比度偏低，以及 `/following`、`/reading-list`、`/out`、`/skills/[...skillId]` 与错误页和主壳层视觉未完全对齐。

## Scope

- **品牌图标与 Favicon 体系**：
  - `apps/web/components/transit-mark.tsx` & `apps/web/public/icon.svg`：重设计 32×32「午夜蓝搪瓷轨迹徽标」（Midnight Blue Enamel `#0b1224` / `#243866`，双线交汇轨 `#3b82f6` + `#10b981`，中心换乘环 `#f8fafc`）。
  - `apps/web/public/favicon.ico`：补充多尺寸（16×16 / 32×32 / 48×48 RGBA PNG-in-ICO，1723 字节）实体图标文件。
  - `apps/web/app/layout.tsx`：移除 `MonetagScript`，配置 `?v=2` 版本化 `shortcut icon` / `icon` SVG 与 ICO 链接。
- **去除桌面悬浮推送广告**：
  - 删除 `apps/web/components/monetag-script.tsx` 并从根布局移除挂载。
- **统一 React Aria 组件库层（`apps/web/components/ui/`）与页面迁移**：
  - 新增 `select.tsx`（`UiSelect`，支持空字符串 `''` 全量选项哨兵映射）、`radio-group.tsx`（`UiRadioGroup`）、`checkbox.tsx`（`UiCheckbox`、`UiCheckboxGroup`）、`text-field.tsx`（`UiTextField`、`UiTextArea`）、`segmented-group.tsx`（`UiSegmentedGroup`）及交互测试 `ui-controls.interaction.test.tsx`。
  - 迁移消费者：`rss-subscription.tsx`、`article-search.tsx`、`article-translation.tsx`（同步更新 `article-translation.interaction.test.tsx`）、`event-translation.tsx`、`leaderboard/model-leaderboard.tsx`、`skill-leaderboard.tsx`、`article-editor.tsx`、`article-reading-tools.tsx`、`app/following/page.tsx`、`app/reading-list/page.tsx`（新增 `app/reading-list/layout.tsx` 补齐 `noindex` 元数据）。
- **PC 端视觉与子页细节统一**：
  - `action-styles.ts`（`primary` 禁用态使用可读的 `border-border bg-muted text-muted-foreground`）、`site-header.tsx`（以 `var(--rail)` 消除频道圆点光晕）、`home-hot-ranking.tsx`（改为中性 `<GitMerge />` 图标）、`home-digest.tsx`（`xl:hidden` 隐藏重复 `今日日报 →`）、`source-icon.tsx`（`rounded-sm` 与 `10px` 占位字号）、`article-loading.tsx`、`article-reader.tsx`、`app/error.tsx`、`app/daily/error.tsx`、`app/skills/[...skillId]/error.tsx`、`app/skills/[...skillId]/page.tsx`、`app/out/page.tsx`。

## Out of scope

- 不修改 `/admin` 页面及 `IngestionDashboard` 后台管理界面与数据库写入逻辑。
- 不改动 `apps/web/components/google-scripts.tsx`（GA4 / AdSense），亦保留 `apps/web/scripts/generate-service-worker.mjs` 中的 `MONETAG_SW_SNIPPET`。
- 不新增或修改数据库表结构、Cron 任务及 RSSHub 信源路由。
- 不拆分旧路线图 [transit-ui-redesign roadmap](../roadmaps/transit-ui-redesign.md) 中的 `/archive/*`、`/ai/events/*` 等历史重构项（本分支顺带完成了其中 `skills/[...skillId]` 与 `article-loading` 的圆角/卡片/面包屑对齐，剩余跨文件碎片提取仍留在原路线图跟踪）。

## Acceptance criteria

- [x] 新版 32×32 SVG/ICO 品牌图标与 `?v=2` 缓存破坏参数落地，`GET /favicon.ico` 返回 `200 image/x-icon`（1723B），`GET /icon.svg?v=2` 返回 `200 image/svg+xml`。
- [x] 页面不再加载或渲染 Monetag In-Page Push 悬浮广告脚本。
- [x] 所有前台原生下拉框、单选框、复选框、文本框/文本域、折叠面板、标签页与分段开关均切换至 `react-aria-components` / `apps/web/components/ui/` 封装，支持键盘操作与深浅主题一致样式。
- [x] PC 端顶栏圆点光晕、`热门交汇` 圆点、`xl` 端重复 `今日日报 →`、禁用按钮低对比度及错误页/外链确认页/关注页/稍后读页样式统一完成，无 `/admin` 改动。
- [x] 无新增 lint、TypeScript 或 UI 反模式违规，工作区构建与非数据库单测全部通过。

## Feasibility

- **组件库兼容**：项目已安装 `react-aria-components@1.17.0`，无需引入额外 UI 库，可直接包装出符合项目 Design Token 的无障碍基础控件。
- **空值选项适配**：React Aria `ListBoxItem` 的 `Key` 不能直接安全区分空字符串筛选值与未选态，`UiSelect` 通过内部哨兵键映射保留对外 `value=""` 的原有契约并经单测覆盖。
- **离线构建安全**：本分支未改动服务端数据获取签名；在本地无 Postgres/Redis 实例环境下，`next build` 与静态页预生成可正常完成（4 个集成测试文件按既有环境守卫跳过）。
- **UI 审查工具降级声明（`ui-quality.md`）**：当前会话未挂载 `ui-skills`（`interface-design` / `baseline-ui`）MCP 服务；界面规范核查严格依据仓库 `.impeccable/DESIGN.md`、`impeccable` 规范、`impeccable` 机械检测脚本（`detect.mjs --json`）与真实无头浏览器（Playwright / `browser` 子代理，`1028px` 桌面可视区深浅双主题截图）实测兜底，未虚构外部 MCP 结论。

## Implementation

1. **品牌资产重构**：重构 `TransitMark` 与 `public/icon.svg`，生成 16/32/48 多尺寸 `public/favicon.ico`，并在 `app/layout.tsx` 写入 `?v=2` favicon metadata 链接及清理 `MonetagScript`。
2. **UI 原语层抽象与迁移**：在 `apps/web/components/ui/` 下封装 `UiSelect`、`UiRadioGroup`、`UiCheckbox`、`UiCheckboxGroup`、`UiTextField`、`UiTextArea`、`UiSegmentedGroup`；迁移搜索筛选、RSS 订阅弹框、文章/事件翻译阅读模式、模型/Skill 榜单视图切换、文章编辑器工具栏与表单、文章目录、关注页与稍后读标签页。
3. **PC 与子页体验收敛**：清理频道指示点背景与 `boxShadow` 环偏移，统一主按钮禁用对比度，修正 `HomeHotRanking` 前缀图标与 `HomeDigestView` 响应式去重；统一 `/following`、`/reading-list`、`/out`、`/skills/[...skillId]` 及各 `error.tsx` 卡片与错误边界语义（移除 `app/error.tsx` 内嵌套 `<main>`）。

## Verification

### 构建与测试（最后一次代码改动后实测）

- `pnpm check-types`（`turbo run check-types`）：`3 successful, 3 total`（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` 均 exit 0）。
- `pnpm --filter @rss-site/web build`（`next build && node scripts/generate-early-hints.mjs && node scripts/generate-service-worker.mjs`）：通过，59/59 静态页面生成完成，生成 Early Hints 与 `sw.js`（1 precached file, 1534 bytes），exit 0。
- `pnpm test`（`turbo run test`）：`3 successful, 3 total`：
  - `@rss-site/signals`：`1 passed (1)` 测试文件，`8 passed (8)` 用例；
  - `@rss-site/api`：`15 passed (15)` 测试文件，`114 passed (114)` 用例；
  - `@rss-site/web`：`42 passed | 4 skipped (46)` 测试文件，`192 passed | 22 skipped (214)` 用例（含新增 `ui-controls.interaction.test.tsx` 3 项及更新后的 `article-translation.interaction.test.tsx` 1 项；4 个数据库/Redis 集成测试文件共 22 项用例因本地未连接 Postgres/Redis 服务按既有守卫跳过）。
- **代码规范检查**：
  - `pnpm exec biome check apps/web/app apps/web/components apps/web/public/icon.svg`：`Checked 150 files. No fixes applied.`（exit 0）。
  - `pnpm exec biome lint .`：`Checked 446 files. Found 2 warnings.`（0 lint error；仅 2 条既有超出 1 MiB 体积阈值的 `graphify-out` 文件警告）。注：Windows 下执行全仓 `biome check .` 会在未改动的 CRLF 检出文件上报告换行符格式差异（Linux Git/CI 默认为 LF）。
- **UI 机械反模式检查（`impeccable detect.mjs --json`）**：对本分支改动/新增 UI 文件共检出 0 条新增告警，仅存在 2 条既有 `side-tab` `border-l-2` 提示（`article-translation.tsx` 与 `article-editor.tsx`）。

### 真实浏览器与本地服务实测

- `http://localhost:3199`（Next dev 实测）：`<head>` 正确输出 `<link rel="shortcut icon" href="/favicon.ico?v=2"/>`、`<link rel="icon" href="/icon.svg?v=2" type="image/svg+xml"/>`、`<link rel="icon" href="/favicon.ico?v=2" sizes="32x32"/>`；`/favicon.ico` 返回 `200 image/x-icon`（1723 字节），`/icon.svg?v=2` 返回 `200 image/svg+xml`（520 字节）。
- 桌面端浏览器（`1028px` 可视区，浅色/深色双主题）：验证 Monetag 悬浮广告已消失、左侧频道圆点无灰圈光晕、`热门交汇` 使用中性 `<GitMerge />`、`RSS 订阅` 弹窗中的 `UiRadioGroup` / `UiSelect`（`按频道筛选` 下拉菜单于弹窗上方完整展开无裁切）/ `UiCheckboxGroup` 及禁用态 `复制` 按钮可读性均正常。

### 审查与收敛结论

- 已核对全部分支改动范围，确认未改动 `/admin` 与后端数据库/Cron 逻辑，无 `next-env.d.ts` 等开发期临时文件污染，无阻塞（Blocking）遗留项。
- **Accepted follow-ups**：本分支无独立新增的 Accepted follow-up 遗留项，不新建空路线图。

## Risks

- **浏览器强缓存延迟**：旧标签页或收藏夹在浏览器本地图标缓存过期前仍可能短时显示旧图标，已通过 `?v=2` 查询串降低主流浏览器命中旧缓存概率，必要时可通过硬刷新或新开标签页生效。
- **本地未连库覆盖边界**：本地无真实 Postgres/Redis 实例，4 个数据库/Redis 集成测试文件（22 项用例）处于跳过状态；CI/合并前需依赖 GitHub Actions 集成环境完成全量确认。
- **桌面特定视口宽度补充验证**：当前深浅主题真实浏览器截屏主要覆盖 `1028px` 桌面可视区（处于 `lg` 与 `xl` 断点交界），建议在 CI 或部署预发环境按 `1440×900` 再做一次快速目视抽检 `xl:hidden` 效果。
