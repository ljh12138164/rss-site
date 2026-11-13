# 午夜搪瓷线网中枢全站 UI 重构（feat/transit-ui-redesign）

## 1. 背景与目标

原站首页（`/`）与应用内页割裂：`/` 为长篇静态介绍页（`home.css`），与 `/latest`、分区页、榜单、日报存在不同的头部、色板与版式语言；部分界面存在暖棕底配橙红的抽象块面、空白封面占位、英文装饰标签（如 `Section`）与偏多解释性文案。

本次重构按用户选定方向 **午夜搪瓷线网中枢（`challenger-transit`）** 与 **左侧轨交路线栏布局**（定稿 PNG 参考图保留于 `.impeccable/mocks/transit-redesign/`，中间 HTML 稿与未选方案已从仓库清理）全站落地：

1. **统一视觉语言**：深色主题采用午夜蓝搪瓷底（`#0B1224`）与 6 条彩色线路编码（`AI #10B981`、`科技 #3B82F6`、`新闻 #FFC20E`、`社交 #EC4899`、`财经 #A78BFA`、`游戏 #FB7185`）；浅色主题对应地铁白瓷板（`#EEF2F7` / `#FFFFFF`、`#1E5BFF` 主色及浅色对比度调优线色），保留主题切换能力并默认深色首屏。
2. **统一信息架构**：`/` 与 `/latest` 共享实时热点阅读中枢，桌面端统一为「左线网导航栏 + 顶栏实用工具（`⌘K` 搜索 / 稍后读 / RSS / 主题切换）+ 主工作区」；移动端使用紧凑顶栏与固定底部 4 项导航 + 频道抽屉，无用户头像与登录占位。
3. **精简并去 AI 化文案**：按 `/humanizer-zh` 原则去掉多余引导语、空洞副标题、三段式套话、括号色线标签及重复状态说明，只保留事实、数字、来源、时间与直接操作标签。

## 2. 范围与非目标

### 在范围内

- `apps/web/app/globals.css`、`apps/web/app/layout.tsx`：全站色彩、字距、等宽数字、焦环、滚动条与切角按钮/指示条样式系统。
- `apps/web/components/site-shell.tsx`、`site-header.tsx`、`action-styles.ts`、`theme-toggle.tsx`：桌面左侧线网栏、顶栏、移动端底部导航与抽屉导航。
- `apps/web/app/page.tsx`、`apps/web/app/latest/*`、`latest-overview.tsx`、`home-hot-ranking.tsx`、`home-digest.tsx`：首页与 `/latest` 统一为实时热点中枢，移除 `apps/web/app/home.css` 静态介绍墙，保留根页 `JSON-LD` 结构化数据与规范元数据。
- 全站内页与通用组件统一样式与文案清理：`section-layout.tsx`、`section-overview.tsx`、`hot-list.tsx`、`cover-image.tsx`、`source-navigation.tsx`、`github-repository-row.tsx`、`event-timeline.tsx`、`skill-leaderboard.tsx`、`skill-content.tsx`、`daily-report-view.tsx`、`leaderboard/model-leaderboard.tsx`、`leaderboard/model-detail-view.tsx`、`article-reader.tsx`、`article-summary.tsx`、`article-translation.tsx`、`article-reading-tools.tsx`、`article-search.tsx`、`rss-subscription.tsx`、`outbound-dialog.tsx`、`feed-state.tsx`、`signal-skeleton.tsx`、`information-page.tsx`、`/following`、`/reading-list`、`/about`、`/privacy`、`/mcp`、`/archive/*` 与加载骨架。
- 随手更新设计契约 `.impeccable/DESIGN.md` 与界面简报。

### 不在范围内

- 不新增或修改任何 RSS/RSSHub 信源、采集管道、Cron 调度、数据库表结构或迁移脚本。
- 不引入账号登录、云端同步或个人隐私数据上传（保留本地 `localStorage` / `IndexedDB`）。
- 不修改管理后台 `apps/web/app/admin/` 逻辑与 `public/diagrams/` 图表资源。

## 3. 可行性与关键约束

1. **路由兼容与缓存刷新**：`lib/revalidate-paths.ts` 与相关测试明确检查 `/` 与 `/latest` 同时在失效路径内。因此保留 `/latest` 与 `/` 渲染同一 `HomeView` 主视图（均采用 `force-dynamic` + 现有降级机制），确保现有收藏、站点地图和集成测试无需改动后端协议即可通过。
2. **离线构建安全**：`next build` 与本地测试运行期间可能没有在线 Postgres 或 RSSHub 服务；首页右栏（日报简讯、模型 Top 片段）与各数据源读操作均需内置 `.catch(() => null)` / 空态降级，不阻塞页面构建与首屏渲染。
3. **无多余封面占位**：列表条目仅在文章自带有效 `imageUrl` 时渲染紧凑右对齐缩略图，无封面时不占左侧大面积图标方块，保持信息扫描密度与视觉整洁。
4. **工具降级声明**：当前环境 `<mcp_servers>` 仅配置了 `chrome-devtools-mcp`，未挂载 `ui-skills` MCP 服务；界面约束核验改由仓库内 Design Tokens、`impeccable` 表面简报与机械检测（`impeccable detect --json`）及真实浏览器桌面/移动端截屏审查兜底，绝不虚构外部 MCP 审查结论。

## 4. 验收标准

- [x] 深色（午夜蓝搪瓷 `#0B1224`）与浅色（地铁白瓷 `#EEF2F7`）双主题切换正常，刷新无闪烁，所有文本/控件满足可读对比度。
- [x] `/` 与 `/latest` 直接呈现线网中枢热点主界面（主榜脉冲时间脊柱+交汇节点、六线入口、右栏日报与模型快览），无静态营销问答长文。
- [x] 全站主要界面切换统一壳层，移除暖棕底、`eyebrow` 英文标签与 `border-l-4` 抽象卡片（边缘归档/详情微调已收入后续路线图）。
- [x] 页面可见中文文案经过 `/humanizer-zh` 精简：零多余解释废话、零括号色线标识、无未请求的登录/头像占位。
- [x] 未选择的 UI 设计方案（`annual`、`gallery`、`lexicon`、`timetable`、`v2-top`）及临时 HTML 稿已清理，仅保留定稿视觉参考与设计契约 `.impeccable/DESIGN.md`。
- [x] `pnpm --filter @rss-site/web check-types`、`pnpm lint`、`test`、`build` 通过；`impeccable detect --json` 返回 `[]`；桌面 `1440×900` 与移动 `390×844` 深浅双主题实测无水平溢出或遮挡。

## 5. 验证记录与后续评审

### 最终验证命令结果（均在最后一次代码改动后执行）

- `pnpm lint`（`biome check .`）：检查 `352` 个文件，通过，无错误或警告（exit 0）。
- `pnpm --filter @rss-site/web check-types`（`tsc --noEmit`）：通过（exit 0）。
- `pnpm --filter @rss-site/web test`（`vitest run`）：`41 passed | 4 skipped (45)` 测试文件、`189 passed | 22 skipped (211)` 用例（其中 `4` 个集成/数据库测试文件共 `22` 项用例因本地未配置 Postgres/Redis 服务按既有守卫跳过）。
- `pnpm --filter @rss-site/web build`（`next build && node scripts/generate-early-hints.mjs && node scripts/generate-service-worker.mjs`）：通过，`59/59` 静态页面构建完成并生成 early hints 与 `sw.js`（exit 0）。
- `impeccable.cmd detect --json apps/web/app/page.tsx apps/web/app/latest/page.tsx apps/web/components/site-shell.tsx apps/web/components/site-header.tsx apps/web/components/home-hot-ranking.tsx apps/web/components/home-digest.tsx apps/web/components/leaderboard/model-leaderboard.tsx apps/web/components/skill-leaderboard.tsx apps/web/components/source-navigation.tsx apps/web/components/mcp-client-config.tsx`：返回 `[]`（零反模式检出）。

### 真实浏览器渲染与交互核查（`chrome-devtools-mcp` / `http://localhost:3107`）

- **桌面深色（`1440×900`，`dark`）与浅色（`1440×900`，`light`）**：核查 `/` 与 `/latest`，确认背景色分别精确渲染为 `rgb(11, 18, 36)`（`#0B1224`）与 `rgb(238, 242, 247)`（`#EEF2F7`）、单页唯一 `<main>`、`h-14`（`56px`）单行顶栏、`overflowX: false`、左侧 6 条频道线路与右栏 `模型评测` 按名次 `#01–#05` 升序排列。
- **榜单、工具与阅读列表页面**：核查 `/leaderboard`（列表默认按 `rank` 升序 `#01..#05`，修复初版 `TabList` 内 `-mb-px` 引起的 `1px` 纵向裁剪后 `tablistOverflowY: false`）、`/mcp`、`/reading-list`（修复重复 `<main>` 后 `mainCount: 1`）、`/skills`、`/about`、`/following`（`Tab` 键盘焦点可见 `#10B981` 实线 `2px` 焦环且未被裁切）。注：本地 `.env.local` 未配置 `DATABASE_URL`，实测 `/ai` 触发 `error.tsx`（显示精简后的「页面加载失败」提示、`overflowX: false`），首页 `热门交汇` 显示「热点排行暂不可用」降级状态。
- **移动端（`390×844`，`2x`）**：核查 `/` 与抽屉目录展开/关闭，`scrollWidth === 390` 无横向溢出，顶部汉堡按钮/品牌/搜索/RSS/主题按钮、横向频道快切条（单行 `36px`）与底部固定 4 项导航对齐无遮挡。

### 双轴代码审查与处理结论

在收尾阶段通过独立子代理执行了 `Standards` 与 `Spec` 双轴对比审查（对比 `origin/master`）：

- **Blocking 项（已全部在本分支修复并复测通过）**：
  1. 将改动从误驻留的 `docs/rsshub-route-standards` 切换至规范功能分支 `feat/transit-ui-redesign`（基于 `origin/master` `2aa08b7`），仅纳管 UI 重构与设计文档相关文件。
  2. 移除触发 `biome check .` SVG 无标题报错的 `.impeccable/mocks/transit-redesign/*.html` 临时生成稿，保留 `.png` 参考图与 `.impeccable/DESIGN.md`。
  3. 修复 `lib/leaderboard.ts` 默认排序、`model-leaderboard.tsx` / `skill-leaderboard.tsx` / `skill-content.tsx` / `home-digest.tsx` / `source-navigation.tsx` 横向滚动容器的 `overflow-y-hidden` 与 `-mb-px` 裁剪、`mcp` / `reading-list` / `about` / `outbound-dialog` 中未定义的 `surface-1` / `border-border-strong` 类名，移除 `transit-lines.ts` 冗余 `colorHex` 与 `globals.css` 闲置 `.chamfer-clip`，并同步 `apps/web/.impeccable/surfaces/apps-web-app-page-tsx.md`。
- **Accepted follow-up 项（非阻塞，已转入路线图）**：
  - 详见 [午夜搪瓷线网中枢全站 UI 重构 roadmap](../roadmaps/transit-ui-redesign.md)（包含：重复导航栏/文章行与日期格式器提取、边缘归档与详情子页样式对齐）。
- **Rejected 项**：
  - `CoverImage` 在明确携带非空 `imageUrl` 但加载失败时保留默认 SVG 降级图（列表与卡片在缺失 `imageUrl` 时已完全不渲染封面占位，保留加载失败兜底可避免破图图标）。
