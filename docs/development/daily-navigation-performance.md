# 日报日期切换性能

## Background

用户反馈在 `/daily/2026-11-27` 切换日期时，整块日报变成骨架且等待时间长。基于 `origin/master` 的 `d038471` 排查。公网三次请求该页的首字节耗时为 6.21、5.41、1.83 秒，Cloudflare 返回 `BYPASS`。生产 ECS 内直连同页两次为 110、43 毫秒，最新日报为 41 毫秒。Redis 的当期正文、最新一期、当期往期索引键均有正 TTL。

## Scope

沿用原有 `/daily` 与 `/daily/[date]`。切换日期时保留正在阅读的日报、往期导航及日历，利用站点顶部进度条反馈等待。日期页缓存渲染结果，归档链接在有交互意图时预取。

## Out of scope

日报生成与数据结构、CDN 规则、其他分区的加载状态。

## Acceptance criteria

- 桌面和手机端的站内切换保留当前内容，直到目标一期显示。进入下一期、回到最新一期和浏览器后退保持可用。
- 日期页支持首次访问后复用渲染结果。日报发布沿用 Redis、Next.js 缓存失效流程。
- 合法但未发布的日期和非法日期返回 404，读取故障仍返回 503。
- 往期列表与日历的日期链接进入视口时不批量发起预取。悬停与键盘聚焦按需预取。

## Feasibility

可行。沿用来源页已验证的按需 ISR 模式和 300 秒有效期，构建过程无需查询日报目录。日期页的状态检查保留在 Proxy，避免流式响应把 404 变成 200。公开页面只读取日报业务数据，渲染结果可跨访客复用。发布已对日报标签及 `/daily/[date]` 路由模式执行失效。

交互沿用 [日报布局](daily-report.md) 和 [顶部进度条](top-loading-bar.md) 的既有确认。读者继续阅读当前正文，等待时只出现站点原有主题色的进度条。保留桌面往期栏和手机单列、现有字体、密度及空态和错误态。已读取 UI Skills 的 Interface Design 与 Baseline UI。

## Implementation

- 移除日报路由的页面级骨架，利用 Next.js 导航过渡保留当前页面。
- 日期页按需生成并缓存。最新页继续按请求决定最新一期，使用已配置的 Redis 与 Next 数据缓存。
- 复用 `HoverPrefetchLink` 处理日报列表、日历、上下期及站内引用。生产浏览器打开该日期曾在点击前请求最新日报和站内引用的 RSC。

## Verification

- 本地 Next.js 生产构建与 PostgreSQL 18、Redis 7 联调。两份日期页均从 `MISS` 转为 `HIT`，首字节由 37–76 毫秒降到 6–7 毫秒。非法日期和合法未发布日均为 `404/noindex/no-store`。本地无效数据触发日期入口 `503/no-store`。
- Chromium 桌面 1440px、手机 390px。人为延迟目标 RSC，原日报可见，无骨架，顶部进度条显示。验证桌面键盘切换、手机日历触摸、浏览器后退、回到最新一期及初始无视口 RSC 预取。
- `pnpm check-types` 三包通过，`pnpm test` 395 项通过，含真实 PostgreSQL 和 Redis 集成。Web 生产构建 13 个静态页面通过，日期页标记为按需静态生成。应用及共享代码 Biome 通过。原始 `pnpm lint` 另扫到本地 Git 全局忽略的 Graphify 输出，报告其格式问题。

## 四个主导航入口排查

同一公网客户端访问 HTML，`/` 为 `HIT`，`/daily` 为 `BYPASS`，`/following` 和 `/reading-list` 为 `DYNAMIC`。浏览器站内导航记录到的 RSC 均为 `DYNAMIC`。四个入口已随主导航改为交互时预取，首次切换仍可能等待目标路由。鼠标按下时还有 Cloudflare Speed Brain 的文档预取，未命中可返回 503，和实际导航请求分开。参见 [Cloudflare 缓存状态](https://developers.cloudflare.com/cache/concepts/cache-responses/) 与 [Speed Brain](https://developers.cloudflare.com/speed/optimization/content/speed-brain/)。

| 入口 | ECS 直连 | 公网浏览器站内切换 | 路径分析 |
| --- | --- | --- | --- |
| 全部热点 | HTML 1.92 秒，RSC 完成 0.52–3.43 秒 | 6.67 秒 | HTML 边缘命中。RSC 仍回源，并等待热榜和六个分区的 PostgreSQL 预览等首页数据 |
| 今日日报 | HTML 48 毫秒，RSC 17 毫秒 | 2.18 秒 | 复用 Redis 正文与目录，响应按请求渲染，公网 HTML 两次首字节为 6.53、12.03 秒 |
| 我的关注 | HTML 20 毫秒，RSC 5 毫秒 | 1.38–3.54 秒 | 静态外壳，关注偏好从 localStorage 读取，选了来源后另取文章列表 |
| 稍后读 | HTML 3 毫秒，RSC 6 毫秒 | 首次 12.38 秒，再访 50 毫秒 | 静态外壳，收藏和阅读记录从 localStorage 读取，首次样本主要等待公网 RSC |

数据为不同时间的少量样本，用于定位等待阶段。公开服务端渲染、边缘网络和本机浏览器分别计时。无额外改动进入首页与两张个人页面，无 review 衍生路线图。

## Risks

首次访问尚未生成的日期页仍需要回源渲染。公网首字节也受 Cloudflare 到源站以及访客链路影响，缓存效果以上线后的外部复测为准。
