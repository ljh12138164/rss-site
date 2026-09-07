# 列表迁移 React Query

## Background

用户要求继续 React Query 迁移。复用 SEO roadmap P5 已确认的浏览器缓存边界，保留前一轮 ISR 和滚动加载需求；继续当前分支，跳过测试和构建。

## Scope

首页、六个分区及来源列表使用 TanStack React Query 5.102.8，固定依赖版本并更新锁文件。搜索弹窗仍使用既有实现，不扩大范围。

## Acceptance criteria

首屏仍由服务端生成 HTML 并经 HydrationBoundary 注入缓存；列表使用 useInfiniteQuery 与 fetchNextPage；后台预取一页，触底复用同一缓存或请求；页面返回可复用已加载的分页；分区/来源缓存隔离，保留去重、失败重试和手动加载。

## Feasibility

已阅读 TanStack 官方 Advanced SSR 指南，并核对安装包 useInfiniteQuery 类型声明。新增根 QueryProvider，服务端每次创建隔离 QueryClient，浏览器持有稳定实例。React Query 不引入 cookies/headers 动态读取，不修改 route revalidate 或服务器数据权限。

## Implementation

- 服务端读取首屏后以 pages/pageParams 结构写入独立 QueryClient，再 dehydrate，经 HydrationBoundary 交给客户端。
- 列表缓存 key 包含 section/source；单页预取缓存另外包含游标。useInfiniteQuery 的 queryFn 复用 QueryClient.fetchQuery，预取使用 prefetchQuery，避免同页重复请求。
- 每次仅预取当前可见数据后的一个游标；不把预取结果立即追加，因此不会自动抓取全部文章。
- staleTime 5 分钟、gcTime 30 分钟；关闭挂载、聚焦和重连自动刷新，避免缓存的 ISR 首屏触发立即重复请求。单页最多自动重试一次；列表层不叠加重试。
- 单页请求允许在页面卸载后完成并进入缓存，避免手动取消嵌套查询使无限列表留下错误状态；触底使用 cancelRefetch:false 防止重复触发互相取消。
- ISR 更新后的新服务端 hydration 数据可替换较旧的浏览器数据；已经打开的列表不自动轮询。

## Verification

依赖安装成功。按用户要求未运行测试、类型检查、构建或浏览器验收；仅静态阅读与格式化，更新既有首页测试的 Provider 外壳但未执行。不能据此声称 hydration、缓存命中和滚动请求已运行验证。

## Risks

新增客户端依赖会增加 JS 体积，未运行构建故未测量。P5 的运行完成信号待验收，SSR/ISR 验收仍以生产模式为准。浏览器返回时可能复用旧列表，这是显式关闭自动刷新后的行为；刷新页面读取新的服务端版本。

## Review

后续 P1–P5 工作已扩展至搜索弹窗和 AI 时间轴，见 [实施记录](roadmap-p1-p5.md)。本文件的原始 Scope 描述保留为当时交付范围。

范围限于列表请求；没有迁移搜索或引入额外 UI 库。无新接受的功能性跟进，沿用原 roadmap 的运行验收项。
