# 修复 Proxy 规范化 301 重定向相对 Location 引发的生产 HTTP 500

## Background

线上排查 `news.ljhboard.cn` Nginx 与 `rss-site-web-1` 日志发现，2026-11-26 18:00 之后持续出现 2,232 次 21 字节 `HTTP 500`（`Internal Server Error`），全部落在文章详情路由 `/<section>/<source>/<long-slug>`，`rss-site-web-1` 对应抛出：

```text
TypeError: Invalid URL {
  code: 'ERR_INVALID_URL',
  input: '/news/chinanews/%E4%B8%8A%E6%B5%B7...--697ad9d0-74f5-4e44-b291-a6ca25060b62'
}
```

根因是前序变更 [normalize-article-slugs.md](normalize-article-slugs.md) 在 [`apps/web/proxy.ts`](../../apps/web/proxy.ts) 中使用 `new NextResponse(null, { status: 301, headers: { Location: '/section/source/slug' } })` 返回了**相对路径** `Location`。虽然直接调用 `proxy()` 的 Vitest 单元测试不会触发异常，但在 Next.js 16.3.4 生产运行时（`next/dist/server/web/adapter.js`）中，适配器会对中间件响应的 `Location` 头执行 `new NextURL(redirect, ...)`（要求绝对 URL），传入相对路径直接抛出 `ERR_INVALID_URL` 导致 500。

同时，Next.js 适配器在确认 `redirectURL.host === requestURL.host` 后，会自动调用 `getRelativeURL(redirectURL, requestURL)` 将对外输出的 `Location` 头重新规范为相对路径，因此在 `proxy.ts` 中使用 `NextResponse.redirect(new URL(location, request.url), ...)` 既满足运行时契约，又不会在反代环境下泄露内部回环主机名。

## Scope

- 修改 [`apps/web/proxy.ts`](../../apps/web/proxy.ts)：将 `normalized.kind === 'redirect'` 分支改为 `NextResponse.redirect(new URL(location, request.url), { status: 301, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })`。
- 更新 [`apps/web/proxy.test.ts`](../../apps/web/proxy.test.ts)：断言 301 响应的 `location` 可被 `new URL()` 解析为绝对 URL、与请求同源、目标路径正确且保留查询参数。
- 通过真实 Next.js 生产服务进程（`next start`）发送超长中文 slug 请求，端到端验证返回 `301`（无 `ERR_INVALID_URL` / `500`）且对外 `Location` 为安全的相对路径。

## Out of scope

- 不改动 `normalizeArticleSlugSegment` 截断规则与 404 处理逻辑。
- 不改动数据库、Nginx 配置或页面 UI。

## Acceptance criteria

1. `proxy()` 对多重编码与超长中文 slug 返回 `301` 响应，其 `Location` 头为合法绝对 URL（与 `request.url` 同源），保留原查询参数与 `Cache-Control: public, max-age=86400, s-maxage=86400`。
2. 真实 Next.js 生产服务接收超长中文文章 slug 与多重编码文章 slug 时，返回 `301` 而非 `500`，且对外 `Location` 不泄露回环主机名。
3. 全仓 `biome`、`check-types`、单元测试与 Next.js 生产构建全部通过。

## Feasibility

- 结论：**Feasible**。
- 复用决策：沿用 [normalize-article-slugs.md](normalize-article-slugs.md) 已确认的 slug 规范化规则、状态码 `301` 与 `s-maxage=86400` 缓存策略，无新增设计分歧，仅修正运行时 `Location` 构造方式。
- 技术核验：已核对 `next@16.3.4` 源码 `dist/server/web/adapter.js`（第 382–398 行）：
  - `new NextURL(redirect, ...)` 强制要求中间件返回绝对 `Location`；
  - 同主机重定向（`redirectURL.host === requestURL.host`）会被适配器自动通过 `getRelativeURL(redirectURL, requestURL)` 转为相对 `Location` 输出，彻底避免 Docker/Nginx 反代泄露 `127.0.0.1` / `0.0.0.0`；
  - `section` 与 `sourceId` 均已通过 `articleSource()` 白名单校验，且 `canonicalEncoded` 为 `encodeURIComponent` 输出，路径恒以 `/<section>/` 开头，无开放重定向风险。

## Implementation

- [`apps/web/proxy.ts`](../../apps/web/proxy.ts)：使用 `NextResponse.redirect(new URL(location, request.url), { status: 301, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })`。
- [`apps/web/proxy.test.ts`](../../apps/web/proxy.test.ts)：校验 `new URL(location)` 解析成功、origin/pathname/search 与缓存头。

## Verification

- `pnpm exec biome check apps server packages shared`：`363` 文件通过，`0` 错误。
- `pnpm check-types`：`3/3` 包（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）全部通过。
- `pnpm test`：
  - `@rss-site/signals`：`9 passed`
  - `@rss-site/api`：`130 passed`
  - `@rss-site/web`：`218 passed | 22 skipped`（含 `proxy.test.ts` `13/13`）
- `SITE_URL=https://news.ljhboard.cn pnpm --filter @rss-site/web build`：`137/137` 静态页 + `generate-early-hints.mjs` + `sw.js` 全部通过。
- 真实 Next.js 16.3.4 生产服务（`next start`）端到端验证：
  - 超长中文 slug（带 `?from=archive`）返回 `301`，对外 `Location: /social/coolapk/%E6%95%B0...--550e8400-e29b-41d4-a716-446655440000?from=archive`，`Cache-Control: public, max-age=86400, s-maxage=86400`；
  - 三重编码中文 slug 返回 `301`，对外 `Location: /news/baidu/%E9%82%93...--550e8400-e29b-41d4-a716-446655440000`；
  - 服务端 stderr 零 `ERR_INVALID_URL` / `500` 报错。
- 自查覆盖 `apps/web/proxy.ts` 全部重定向分支、开放重定向边界、查询参数保留与反代相对 `Location` 输出，无阻塞项或衍生 roadmap，不创建空 roadmap。

## Risks

- 极低风险：仅修复此前必然触发 500 的 301 分支；恢复正常 301 后，旧超长链接与多重编码链接将按原计划重定向至规范短链接并由边缘缓存 24 小时。
