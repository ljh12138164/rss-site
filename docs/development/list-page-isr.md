# 列表页 ISR 与采集后失效

## Background

用户要求优先启用既有 roadmap 中的 ISR，暂停 React Query 迁移。复用 [SEO roadmap P3](../roadmaps/seo-cache-and-indexing.md) 已确认决策，继续当前分支；沿用跳过测试、构建和部署的约定。

## Scope

- 首页及六个分区、全部来源列表启用 ISR，保留服务端首屏 HTML。
- 首页与 AI 列表 revalidate=7200；其他分区列表 revalidate=21600。
- 新增 Bearer REVALIDATE_SECRET 保护的 POST /api/revalidate。
- 采集事务完成后通知 Web 刷新首页、来源所属分区及来源页。

## Out of scope

React Query、新闻详情缓存及硬 404/410、AI 事件详情、sitemap、Cloudflare purge、部署和密钥配置。

## Acceptance criteria

列表页面使用静态生成与周期再生；数据库读取错误向外抛出，不将错误空态写入成功页面缓存；滚动分页 API 继续动态读取；刷新接口只接受已知且匹配的 section/source；发布失败不回滚采集，也不记录成采集失败。

## Feasibility

阅读当前安装 Next 16.3.4 的 ISR 指南。项目未启用 Cache Components，适用 route-level revalidate。使用 force-static 与数值字面量 revalidate；来源路由沿用白名单 generateStaticParams。无需引入浏览器请求库。

ISR 再生失败时 Next 保留之前成功缓存。为避免把临时错误缓存 2–6 小时，移除服务端首页和 PaginatedArticleFeed 的 catch-to-empty，交给现有 error.tsx 处理首次失败；有旧缓存时由 Next 保留旧页。首次构建需要数据库可达，失败不伪造静态空页。

## Implementation

- 首页采用 AI 的 2 小时周期，避免 AI 更新被混合首页延迟到 6 小时。
- /api/articles 保留 no-store，游标携带首屏 snapshot；浏览器预取不会关闭页面 ISR。
- /api/revalidate 只接受 JSON `{section, source}`，section 不带斜杠；拒绝任意 path/URL 字段及来源分区不匹配。未配置密钥返回 503，鉴权失败 401，参数错误 400。
- Web 配置服务端 REVALIDATE_SECRET，API 配置 WEB_APP_URL 与相同 REVALIDATE_SECRET。均未实际写入配置或输出密钥。
- API 通知最多等待 5 秒，禁止重定向，返回并记录 publication=revalidated/failed/disabled，日志仅含来源、batch ID 和结果。无配置时仍按周期 ISR 工作。
- revalidatePath 使下一次访问重新生成，接口返回成功不表示已提前生成 HTML；不会推送更新到已打开的浏览器。

## Verification

遵照用户要求未运行测试、类型检查、构建及生产缓存验证。仅静态阅读并格式化本次文件，因此不宣称 ISR 命中或实际按需失效已验证。

上线验收：next build && next start 下检查重复访问的缓存命中与数据库请求量；确认刷新请求后三条路径重新生成；验证错误密钥/未知来源被拒绝，模拟数据库再生失败保留旧页，通知失败仍返回成功采集结果。

## Risks

尚未配置生产通知或部署。P3 目前只实现现有列表这一部分，未达到完整生产完成信号；新闻详情、事件、sitemap 及 Cloudflare 仍由原 roadmap 跟踪。ISR 需 Next Node 服务，不能使用静态导出；单实例缓存与后续部署边界沿用 production-launch roadmap。
