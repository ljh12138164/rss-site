# 专区 RSS 订阅输出

## 背景

站点已经把六个专区的当前热点快照写入 Supabase，但目前只能通过网页阅读。本期让本站同时成为 RSS
提供者，用户可以在阅读器中订阅整个专区，而不必分别寻找各平台的原始 Feed。

## 范围

- 提供 AI、科技、国内新闻、社交热点、财经和游戏六个 RSS 2.0 订阅地址。
- 每个专区按来源注册表顺序输出，每个来源最多十条，并保留来源内部的原始位置。
- 条目链接直接指向原文，`category` 标明来源平台。
- 只在上游提供真实发布时间时输出条目 `pubDate`；没有发布时间的榜单条目不补造时间。
- 复用 Web 端现有的 Supabase 公共只读查询，不新增数据库对象、密钥、写权限或 Cron。
- README 记录稳定订阅地址和数据口径。

## 不在本期

- 单个平台的独立 RSS、用户自定义订阅、全文代理、翻译、跨来源热度评分或历史归档 Feed。
- 修改当前页面布局、导航、站点部署配置或生产采集计划。
- 重新请求 RSSHub 或其他上游；订阅端只读取已经通过采集门禁写入 Supabase 的数据。

## 验收标准

- `/feeds/ai.xml`、`/feeds/technology.xml`、`/feeds/news.xml`、`/feeds/social.xml`、
  `/feeds/finance.xml` 和 `/feeds/games.xml` 返回 `application/rss+xml`。
- XML 含 RSS 2.0 必需的频道标题、页面链接和说明，并提供稳定的条目 GUID。
- 标题、摘要、URL、GUID 和来源名称经过 XML 转义；非法 XML 控制字符不会破坏整个订阅。
- 混合成功与失败时仍输出健康来源；六路查询都失败时返回 503，未知订阅名返回 404。
- 响应允许共享缓存，避免阅读器轮询直接放大 Supabase 查询次数。
- 单元测试、类型检查、lint、格式检查和生产构建通过。

## 可行性与设计

RSS 2.0 允许一个频道包含任意数量的 `item`，且条目的 `pubDate` 为可选字段。因此当前
`hot_items` 快照可以直接映射为专区频道，Steam 等没有真实发布时间的来源也无需伪造数据。

生成器不做跨来源排序：依次遍历专区来源注册表，再输出每个来源按 `position` 排列的前十条。这样同一
平台的榜单语义不会被不同平台不可比较的排名打乱。频道 `lastBuildDate` 取健康来源状态中最新的成功时间，
仅用于订阅客户端判断频道是否更新。

路由使用请求自身的 origin 生成频道页面地址和 Atom self link，不新增站点 URL 环境变量。成功响应采用
短时 HTTP 共享缓存；数据仍由现有公共 Supabase 客户端在服务端读取，继续受既有 SELECT-only RLS 约束。

## 实施记录

- [x] 增加专区配置、查询适配和 RSS 2.0 XML 生成器。
- [x] 增加动态 XML Route Handler 与错误响应。
- [x] 覆盖转义、顺序、可选时间、状态码和缓存头测试。
- [x] 更新 README 订阅说明。

实现采用一个受白名单约束的 `/feeds/[feed]` Route Handler，仅接受六个固定 `.xml` 名称。成功响应声明
`application/rss+xml`，浏览器缓存五分钟、共享缓存三十分钟；404 与 503 不缓存。所有专区共用纯 XML
生成器，没有引入 RSS 依赖或新的环境变量。

Supabase 2026-09-05 changelog 检查没有发现影响现有公共 SELECT 查询的变化。本期继续使用仓库已固定的
`@supabase/supabase-js` 2.115.0；没有创建或暴露新表，也没有改变现有 RLS。

## 验证记录

- `pnpm --filter @rss-site/web exec biome check lib/rss-feed.ts lib/rss-feed.test.ts
  "app/feeds/[feed]/route.ts" "app/feeds/[feed]/route.test.ts"`：通过。
- `pnpm test`：通过，API 54 项与 Web 51 项测试全部成功。
- `pnpm check-types`：通过。
- `pnpm build`：通过，Next.js 生产构建将 `/feeds/[feed]` 识别为按请求动态渲染的 Route Handler。
- `pnpm format:check`：仓库基线未通过；Biome 报告 55 个既有 Web 文件为 CRLF、期望 LF。本期四个新增
  TypeScript 文件的独立格式与 lint 检查通过，未批量改写无关页面。
- 2026-09-05 23:12（Asia/Shanghai）使用本地 Next Route Handler 只读连接现有云端 Supabase：六个固定
  地址均返回 HTTP 200、`application/rss+xml` 且通过 .NET XML 解析。当前快照分别输出 AI 60、科技 57、
  国内新闻 60、社交 60、财经 20、游戏 0 条；前四区覆盖 6 个来源，财经当前覆盖 2 个来源，游戏仍为空。
  未写入数据库、未触发采集，也未输出任何 Key。未知 `/feeds/unknown.xml` 返回 404 与 `no-store`。

## Review

- Standards：复核了公开数据权限、异常隔离、缓存、主机 URL、XML 1.0 字符范围、字段转义、稳定 GUID 和
  Next.js 16 Route Handler 约束；没有阻断项。
- Spec：六个专区地址、每来源十条上限、注册表顺序、原文链接、来源分类、真实可选发布时间与 README
  文档均已实现；没有阻断项。
- 本次没有需要进入独立 roadmap 的评审后续。页面中的 RSS 入口与 HTML autodiscovery 属于后续 UI 整合，
  在当前订阅端点功能中不是必需项。

## 风险

- 阅读器轮询频率不可控；通过共享缓存降低重复查询，但不能替代上游采集的错峰计划。
- `hot_items` 是当前榜单快照，不是完整历史。条目从当前榜单消失后也会从后续 RSS 响应消失。
- 单个来源状态异常时不会拖垮整个专区；全专区查询异常则显式返回 503，避免客户端把故障误判为空频道。
