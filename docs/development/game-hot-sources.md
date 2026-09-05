# 游戏热点来源

## Background

游戏是辅助热点分类 roadmap 中财经之后的第二优先级。匿名探测已经确认 3DM、机核、游民星空、游侠网、
indienova 与 Steam 六路可读；页面继续复用现有 React Aria 信号台，不引入新组件库或假数据。

Roadmap：[辅助热点分区 roadmap](../roadmaps/additional-hot-categories.md)。

## Scope

- 注册六路游戏来源并新增 `/games`、`/games/[source]`、首页入口、导航和安全离站返回。
- 新增通用 Hono 分区入口、数据库白名单、pgTAP 覆盖与 6 小时错峰 Cron。
- 新闻来源显示真实发布时间；Steam 明确为商店热销榜快照，只显示采集状态，不伪造发布时间。
- 部署后按仓库生产门禁逐来源验证云端 Supabase，全部通过后才启用 Cron。

## Out of scope

- 跨平台游戏热度分数、评论情绪、商店价格追踪和用户个性化。
- 修复未通过匿名探测的 Xbox、任天堂或其他 RSSHub 路由。
- 为 Steam 或缺图文章生成封面、发布时间或摘要。

## Acceptance criteria

- 六路来源通过同一解析与存储链路进入 `games` 分区，错分区和未知来源返回 404。
- `/games` 与六个详情路由只读取真实 Supabase 数据，并正确呈现 ready/empty/error。
- 首页仍以 AI 为第一分区，游戏仅作为辅助信息；移动端导航无横向溢出且键盘可达。
- 游戏来源每 6 小时运行一次，与全部既有来源至少错开 5 分钟。
- API、Web、迁移、Cron 与云端验证使用同一来源白名单。

## Feasibility

结论：可行。

- 四路新闻共 80 条、全部带发布时间且 78 条带图；indienova 部分条目有时间；Steam 无发布时间。
- 通用解析器允许 `published_at` 为空，现有来源状态可真实表达 Steam 的榜单采集时间，无需伪造字段。
- 新增六路后总计 36 路：AI 每日 72 次，30 路辅助来源每日 120 次，共 192 次；游戏可安排在
  UTC 03:00–03:25 起始并每 6 小时重复，不与现有窗口冲突。
- 第六个导航入口会挤压移动端单行空间；移动端将导航换为原生可访问的第二行紧凑布局，桌面端保留单行，
  不增加只能依赖 JavaScript 打开的菜单。
- UI Skills registry 当前未暴露；复用已接受的信号台视觉、现有 token 和仓库 UI 质量清单，不声明外部
  UI Skills 审查。

## Implementation

- 注册 3DM、机核、游民星空、游侠网、indienova 与 Steam，并接入 `/games`、六个静态来源参数详情、
  首页第六分区、主导航和安全离站返回路径。
- 游戏复用通用来源频段、榜单卡片、图片懒加载和加载失败占位；Steam 详情文案明确区分榜单采集时间与文章
  发布时间。
- Hono 增加 `/cron/games/:source`；数据库、RLS 测试和 Cron 使用同一六路白名单。六路按 UTC
  03:00–03:25 起始，每 6 小时运行一次。
- 移动端主导航使用原生两行布局容纳六个分区，桌面端保持单行；不增加依赖 JavaScript 的折叠菜单。

## Verification

- 2026-09-05 19:25 CST 对 `https://rss.ljhboard.cn` 匿名复探：六路均为 HTTP 200 与 RSS XML；3DM、机核、
  游民星空和游侠网各 20 条，indienova 12 条，Steam 50 条。
- 本地 API 52 项与 Web 42 项 Vitest 全部通过；`pnpm lint`、`pnpm typecheck` 和 `pnpm build` 通过。
- 生产构建生成 `/games` 与六个 `/games/[source]` 参数页面；没有加入模拟条目、占位发布时间或生成封面。
- pgTAP 已扩展到 51 项；云端迁移、真实批次数据与 Cron active 状态等待合并部署后执行并回填。

## Review

- Standards：游戏来源沿用统一解析、存储、RLS 和生产数据门禁，没有复制新的抓取框架；API 与页面均拒绝
  未注册来源和错分区组合。
- Spec：六路来源、`/games` 路由、6 小时错峰与 Steam 快照语义均已覆盖；首页仍以 AI 为首要分区。
- UI：移动端导航改为原生第二行，所有链接保持最小触控高度，卡片图片继续使用通用懒加载与失败占位。
  遵照用户要求未操控桌面浏览器，本轮以 SSR、语义结构和生产构建审查为准。
- Rejected：没有伪造 Steam 发布时间、跨平台热度分数、价格追踪、假图片或未探测成功的平台。
- Accepted follow-up：生产部署后的六路抓取质量、图片可用率和 Cron 执行记录。

## Risks

- Steam 是当下商店榜单，不是发布时间线；UI、结构化数据与后续 SEO 不得把采集时间称作发布时间。
- 游戏媒体图片由上游托管，仍可能热链失效；使用现有懒加载和失败占位兜底。
- 上游来源无 SLA，必须在部署后重新匿名探测并逐来源写入云端 Supabase。
