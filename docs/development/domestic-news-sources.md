# 中国国内新闻来源

## Background

在六来源科技信号台尚未合并的同一功能分支中，继续增加中国国内综合新闻入口。来源可行性已基于
RSSHub 官方文档、当前本地源码和自建实例验证，完整证据见
[国内新闻 RSSHub 来源调研](../research/domestic-news-rsshub-sources.md)。

## Scope

用户已确认以下 UI 与来源范围：

- 首页新增“02 / 国内新闻”摘要，每个来源展示一条。
- 新增 `/news` 六来源总览和 `/news/[source]` 完整来源列表。
- 主导航增加“新闻”；离站中转页安全地返回来路分区。
- 首批来源拟定为新华社、央视国内、中国新闻网、澎湃热榜、界面中国和百度热搜。
- 将服务端来源模型泛化为科技与新闻两个分区，新增按新闻来源采集与错峰 Cron。
- 扩展 Supabase 来源和 `section` 白名单；保持公开表只读和单来源失败隔离。

## Out of scope

- 把国内新闻混入 `/technology` 或构造跨媒体综合排名。
- 网易新闻、人民网、观察者网、今日头条、微博、腾讯新闻和财新首批接入。
- 登录、Cookie、Puppeteer 或付费全文能力。
- 搜索、推荐、内容改写、自动摘要或立场判断。
- 本次工作中部署生产环境、应用线上迁移或写入密钥。

## Acceptance criteria

- `/news` 独立展示六个来源各自的前三条，`/news/[source]` 展示该来源完整列表。
- 首页科技与新闻分区职责清晰，每个新闻来源只显示一条摘要。
- 未知新闻来源返回真实 HTTP 404；新闻外链继续经过 `/out`，且可返回新闻分区。
- 任一新闻源为空、超时或失败时不影响其余来源，也不清除该源最后一次成功数据。
- 每次采集最多保留来源前 30 条，控制央视等大列表的数据库写入与页面负载。
- 新闻来源不需要任何 Cookie、Token 或浏览器运行时；数据库仅接受确认过的来源和分区。
- 新 Cron 与科技来源错峰，单次 HTTP 采集不超过现有 45 秒数据库请求上限。
- 既有桌面、移动、明暗主题、键盘焦点和无横向溢出验收继续成立。
- Biome、TypeScript、Vitest、生产构建和生产服务器状态码检查通过。

## Feasibility

结论：推荐方案可行，且 UI 路由和首批来源已由用户确认。

- 六条推荐路由均不需要秘密，当前自建实例匿名请求返回 200 和 20–100 个非空 RSS 条目。
- 推荐路线最慢实测约 13.4 秒，低于 API 的 30 秒 RSSHub 超时；网易 24 小时榜约 22.7 秒，余量不足，
  因此后移。
- 央视返回 80 条、新华社返回 100 条；在采集边界截取前 30 条，避免大批量事务和无必要正文存储。
- 当前数据库 `section` 约束只允许 `technology`，需要在尚未应用的本分支扩展迁移中加入 `news`；
  RLS 和公开读取授权无需放宽。
- 当前 Cron 六个来源集中在每五小时窗口的一个小时内。新闻任务可放在窗口的下一小时并继续错峰，
  不增加同一时刻的并发作业，符合 Supabase Cron 避免高并发任务的建议。
- UI Skills MCP 注册表仍未在当前环境暴露，因此不声明完成 UI Skills 审查；复用已确认的 React Aria、
  语义 HTML、来源频段条、响应式断点和现有视觉 token。

## Implementation

- 页面仍服务快速浏览热点的读者；主动作是从分区总览进入单一来源，再通过受控中转访问原文。
- 复用平面信息带、信号橙、系统中文字体与等宽数据标签，不新增卡片、渐变、阴影或动画。
- 新闻页面具有 loading、ready、empty、source error 和 404 状态；桌面 1440px、移动 390px、键盘与
  触摸输入纳入验证。
- 保持来源自己的列表语义：新华社、央视、中新网、界面是栏目顺序，澎湃是热榜，百度是热搜；页面
  不把它们描述成同一种算法或统一名次。
- API 与 Web 各自保留面向自身职责的来源注册表，统一把科技和新闻建模为 `SignalSource`；新闻来源 ID
  固定为 `xinhua`、`cctv`、`chinanews`、`thepaper`、`jiemian` 和 `baidu`。
- RSSHub 路由分别为 `/news/xhsxw?limit=30`、`/cctv/china`、`/chinanews?limit=30`、
  `/thepaper/sidebar/hotNews`、`/jiemian/lists/71` 和 `/baidu/top/realtime`；解析后再次统一截取前 30 条。
- 受保护采集入口统一为 `/cron/signals/:source`，并保留分区入口 `/cron/technology/:source`、
  `/cron/news/:source` 与旧 `/cron/juejin` 兼容入口。鉴权先于来源校验，避免未授权请求探测白名单。
- 十二个 Cron 共用 `signal_ingest_base_url` 与 `signal_cron_secret`，科技来源在每五小时窗口的第一个小时
  错峰，新闻来源在下一小时错峰；每个来源仍是独立 HTTP 请求和独立事务。
- 数据库使用来源与分区的组合约束，阻止新闻来源写入 `technology` 或科技来源写入 `news`；现有只读
  RLS 和授权保持不变。
- `/out` 只接受 `/technology` 与 `/news` 两个返回路径，其他输入回退到 `/technology`，不开放任意站内跳转。

## Verification

已完成：

- API Vitest：33 项通过；Web Vitest：22 项通过。Biome 格式检查与 lint、TypeScript 类型检查、生产构建均通过。
- 生产构建包含 `/`、`/news`、`/news/[source]`、`/out`、`/technology` 和 `/technology/[source]`；
  生产服务器复核 `/news` 与 `/news/xinhua` 返回 200，`/news/nope` 与跨分区 `/news/github` 返回 404。
- 实现阶段用当前通用解析器匿名读取六条 RSSHub 路由，分别解析出新华社 100、央视 80、中新网 50、
  澎湃 20、界面 20、百度 51 条；写入边界按来源截取至最多 30 条。收尾复测时公共实例发生连接超时，
  因此保留该项为上游可用性风险，不以生产环境代测。
- 浏览器验收覆盖 1440px 与 390px、浅色与深色主题、首页双分区、新闻总览、新华社详情和未知来源 404。
  桌面来源区为双列、移动端为单列且频段条为 3×2；两种视口均无横向溢出，键盘焦点有 1.6px 信号橙
  描边，控制台无 warning/error。
- Supabase pgTAP 计划扩展为 21 项，覆盖合法新闻写入与来源/分区错配拒绝。本机 Docker Desktop 未运行，
  `supabase test db` 需由 CI 或有 Docker 的环境执行；未用线上数据库代测，也未应用生产迁移或 Cron。

## Review

- Standards：鉴权顺序、服务端来源白名单、外链返回路径白名单、公开表只读与单来源失败隔离均保持成立；
  没有把 RSSHub 或数据库秘密暴露给浏览器。
- Spec：六个来源、独立新闻路由、首页摘要、30 条上限、错峰 Cron、真实 404 与响应式状态均有对应测试或
  浏览器证据，未发现未解决阻塞项。
- Rejected：未引入跨媒体综合排名、登录态抓取、正文改写或新的 UI 组件库，避免扩张到未确认范围。
- Accepted follow-up：来源契约防漂移与按真实运行质量调整采集节奏继续记录在
  [科技多来源热点 roadmap](../roadmaps/technology-hot-sources.md)。

## Risks

- RSSHub 路由依赖上游 HTML、JSONP 或公开接口结构，没有 SLA；失败必须按来源隔离。
- 新闻列表更新较快，但本期沿用约五小时窗口，先观察稳定性再讨论更高频率。
- `section` 与来源 ID 目前分散在 Web、API 和 SQL，新增时存在漂移风险；沿用既有 roadmap 的契约
  防漂移后续项。
