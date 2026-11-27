# Web 性能优化、`imgproxy` WebP 缩略图压缩、安全头与首页缓存失效闭环

## Background

2026-11-27 对线上 `https://news.ljhboard.cn/` 执行 Lighthouse 13.5.0 桌面审计与线上响应头核查后，定位出 6 项真实存在且影响性能、Best Practices 与安全性的代码/部署问题（Cloudflare 面板 `Web Analytics` 自动注入已先通过 Cloudflare API 在全账号删除清零）：

1. **百度统计拖累 Best Practices（73 分）**：`apps/web/components/google-scripts.tsx` 中挂载的 `hm.baidu.com/hm.js` 写入 11 个第三方 Cookie，并在 Chromium 158 触发 `Permissions policy violation: unload is not allowed in this document.` 控制台报错（站内已有自建 Umami 统计）。
2. **缩略图直出超大原图**：`CoverImage` 将上游原图直接塞进 `88px–120px` 缩略图槽位（例如澎湃新闻 `1024×629` JPG 达 `685.6 KiB`，占首屏 60% 流量）。
3. **首页 `Cache-Control: no-store` 阻塞 bfcache 且缺少热榜/日报清缓存**：`apps/web/app/page.tsx` 因 `force-dynamic` 输出 `private, no-cache, no-store, max-age=0, must-revalidate`；同时 `hot-ranking.ts` 发布热榜快照与 `revalidate-paths.ts` 发布日报时均未触发首页 `/` 的 `revalidatePath('/')` 与 Cloudflare `purge_cache`。
4. **灯箱 JS/CSS 首屏静态打入**：`CoverImage` 顶部静态导入 `yet-another-react-lightbox` 及其 `styles.css`，首屏即加载未点击使用的 JS 与独立 `.yarl__*` CSS chunk（`05lfx66_vp4vj.css`），且 `generate-early-hints.mjs` 将所有 CSS chunk 都放进全局 `Link` preload。
5. **安全响应头缺失与重复 `Link` 头**：`apps/web/next.config.ts` 缺少 `Content-Security-Policy`、`Cross-Origin-Opener-Policy`、`Strict-Transport-Security`（含 `includeSubDomains`）及 `poweredByHeader: false`。
6. **旧浏览器 Polyfill 冗余（13.6 KiB）**：`apps/web/package.json` 未声明现代 `browserslist`，Next.js 16 默认向客户端包打入 `Array.prototype.at/flat/flatMap`、`Object.fromEntries/hasOwn`、`String.prototype.trimStart/trimEnd`。

## Scope

1. 移除 [google-scripts.tsx](../../apps/web/components/google-scripts.tsx) 中的百度统计脚本，保留自建 Umami 与 `layout.tsx` 站长验证 meta。
2. 在 [compose.yaml](../../compose.yaml)、[.github/workflows/ci-deploy.yml](../../.github/workflows/ci-deploy.yml)、[deploy/server/deploy-rss-site](../../deploy/server/deploy-rss-site) 与 [deploy/server/test-release-packaging.py](../../deploy/server/test-release-packaging.py) 接入独立轻量 `darthsim/imgproxy:v4.0.25` 容器（仅内网访问、`mem_limit: 192m`、强制 WebP 压缩与私网 SSRF 拦截），并新增签名代理接口 [apps/web/app/api/img/route.ts](../../apps/web/app/api/img/route.ts) 与签名工具 [apps/web/lib/image-proxy.ts](../../apps/web/lib/image-proxy.ts)，在服务端数据层为热榜/列表封面生成签名 WebP 缩略图地址，前端 `CoverImage` 保留 `onError` 自动回退原始 URL 并在灯箱预览时使用原图。
3. 补齐首页 `/` 缓存失效闭环：在 [revalidate-paths.ts](../../apps/web/lib/revalidate-paths.ts) 与 [hono-app.ts](../../apps/web/lib/hono-app.ts) 支持日报更新与独立 `home` 范围触发 `revalidatePath('/')` + Cloudflare `purge_cache`；在 [hot-ranking.ts](../../apps/web/lib/hot-ranking.ts) 每次热榜发布后自动刷新首页缓存；并在响应头移除首页 `no-store` 以恢复 bfcache 与支持短期边缘缓存。
4. 将 `yet-another-react-lightbox` 及其 CSS 拆至按需动态加载组件 [cover-image-lightbox.tsx](../../apps/web/components/cover-image-lightbox.tsx)，更新 [generate-early-hints.mjs](../../apps/web/scripts/generate-early-hints.mjs) 跳过仅含 `.yarl__` 的延迟加载 CSS chunk。
5. 在 [next.config.ts](../../apps/web/next.config.ts) 补齐 `poweredByHeader: false`、`Strict-Transport-Security`、`Cross-Origin-Opener-Policy` 与兼容现有站内功能（Next.js 水合、Umami、Supabase、CCTV HLS 播放、外部图床、Service Worker）的 `Content-Security-Policy`。
6. 在 [apps/web/package.json](../../apps/web/package.json) 补充现代 `browserslist` 目标。

## Out of scope

- 将固定路径页（`/`、`/ai` 等）改为 `force-static`（避免破坏无数据库环境的 CI `next build`）。
- 对文章详情页正文内嵌的第三方图片做强制代理改写（正文图片仍走既有安全清洗与延迟加载）。
- 引入基于每次请求动态 nonce 的 Strict CSP（会强制所有按需 ISR 页退化为动态渲染，与边缘缓存架构冲突）。

## Acceptance criteria

1. 首页及全站渲染 HTML 不再包含 `hm.baidu.com/hm.js`，自建 Umami 仍正常工作。
2. `darthsim/imgproxy:v4.0.25` 通过 CI 离线镜像包随发布同步到 ECS，不暴露宿主机端口；`/api/img` 严格校验 HMAC 签名、固定尺寸白名单与私网/环回 SSRF 拦截，命中合法请求时调用 `imgproxy` 输出 `image/webp` 并附带长效 `Cache-Control: public, max-age=604800, s-maxage=2592000, immutable`；代理失败或本地未启 `imgproxy` 时 `CoverImage` 自动回退原始 `src`，点击预览仍展示高清原图。
3. 日报发布（`dailyReportDate`）与热榜发布（`refreshHotRanking`）均触发 `revalidatePath('/')` 与 Cloudflare `purge_cache`（`https://news.ljhboard.cn/`）；首页响应头不含 `no-store`，支持浏览器 bfcache。
4. 首屏静态 bundle 与 Early Hints `Link` 头不再包含 `yet-another-react-lightbox` JS 或 `.yarl__` CSS；仅用户点击缩略图预览时按需加载。
5. 响应头包含 `Strict-Transport-Security: max-age=31536000; includeSubDomains`、`Cross-Origin-Opener-Policy: same-origin`、`Content-Security-Policy` 且不含 `X-Powered-By`。
6. `apps/web/package.json` 声明现代 `browserslist`，全仓 `biome check`、`check-types`、`pnpm test`、`pnpm --filter @rss-site/web build`、`test-release-packaging.py`、`test-postgres-backup.py` 与真实 `next start` 响应头验证全部通过。

## Feasibility

- **可行性结论**：完全可行（Feasible）。
- **关键架构瓶颈与对策**：
  - **ECS 离线镜像分发**：北京生产 ECS 无稳定 Docker Hub 直连，既有发布流水线（[ci-deploy.yml](../../.github/workflows/ci-deploy.yml)）在 GitHub Actions 拉取第三方镜像并打包进 `image.tar`，ECS 上使用 `--pull never`。将 `darthsim/imgproxy:v4.0.25` 纳入同一打包清单即可零额外运维上线；`web` 通过 `depends_on: imgproxy: condition: service_healthy` 确保常规升级与回滚到旧版 `compose.yaml` 均无缝衔接。
  - **零新增 ECS 手动密钥**：`/api/img` 的 HMAC 签名密钥优先读 `IMGPROXY_SIGNING_SECRET`，未显式配置时自动派生自现有 `runtime.env` 必配密钥（`REVALIDATE_SECRET` 或 `MAINTENANCE_ENCRYPTION_KEY`），避免上线前手动修改服务器 `.env`。
  - **客户端分页与服务端签名边界**：`HotList` 被 `'use client'` 组件 `HomeArticleList` 引用，不可在组件内导入 `node:crypto`；统一在服务端数据层（`hot-ranking.ts`、`home-articles.ts`、`hot-feed.ts`）读取并跳过 Redis 持久化字段后即时附加 `thumbnailUrl`，同时覆盖 SSR 与客户端无限滚动。
  - **后台定时器调用 `revalidatePath` 约束**：`startHotRankingMaintenance` 在 `setInterval` 中运行，位于 Next.js 请求上下文之外，直接调用 `revalidatePath('/')` 会抛出 `static generation store missing`。在 `POST /api/revalidate` 扩展 `{ home: true }` 范围，由 `refreshHotRanking()` 通过本地回环请求 `/api/revalidate`（携带 `REVALIDATE_SECRET`）在合法请求上下文内同步完成 `revalidatePath('/')` + Cloudflare `purge_cache`，测试环境无服务器监听时安全降级为 `publishContent(['/'])`。
  - **Next.js 16 首页 `Cache-Control` 覆盖**：需通过真实 `next build && next start` 实测确认 `/` 实际响应头是否移除 `no-store` 并保留安全头。

## Implementation

- **移除百度统计**：[apps/web/components/google-scripts.tsx](../../apps/web/components/google-scripts.tsx) 移除 `baidu-tongji`（`hm.baidu.com/hm.js`），保留自建 Umami；前置通过 Cloudflare API 删除全账号下仅有的 `ljhboard.cn` Web Analytics 自动注入（`site_tag: c1cce350c83e4acc8a927394a5651495`）。
- **`imgproxy` 独立容器与签名 WebP 缩略图代理**：
  - [compose.yaml](../../compose.yaml) 新增内网 `darthsim/imgproxy:v4.0.25` 服务（`pull_policy: never`、`mem_limit: 192m`、无宿主机端口、`IMGPROXY_CONCURRENCY=4`、`IMGPROXY_MAX_SRC_RESOLUTION=25`、禁止回环/私网地址），并为 `web` 注入 `IMGPROXY_URL: http://imgproxy:8080` 与 `depends_on: imgproxy: condition: service_healthy`。
  - [.github/workflows/ci-deploy.yml](../../.github/workflows/ci-deploy.yml)、[deploy/server/deploy-rss-site](../../deploy/server/deploy-rss-site) 与 [deploy/server/test-release-packaging.py](../../deploy/server/test-release-packaging.py) 将 `darthsim/imgproxy:v4.0.25` 纳入离线 `image.tar` 打包与启动前检查。
  - 新增 [apps/web/lib/image-proxy.ts](../../apps/web/lib/image-proxy.ts)、[apps/web/app/api/img/route.ts](../../apps/web/app/api/img/route.ts) 与单测 [apps/web/lib/image-proxy.test.ts](../../apps/web/lib/image-proxy.test.ts)：实现 HMAC-SHA256 签名（优先 `IMGPROXY_SIGNING_SECRET`，回退派生自 `REVALIDATE_SECRET` / `MAINTENANCE_ENCRYPTION_KEY`）、固定尺寸白名单（`320x200`）、私网/本地/SVG 拦截与 `rs:fill:320:200/q:80/f:webp` 转码；合法响应输出 `Cache-Control: public, max-age=604800, s-maxage=2592000, immutable`，上游失败返回 `502 no-store`。
  - 在 [shared/hot-ranking.ts](../../shared/hot-ranking.ts)、[apps/web/lib/hot-ranking.ts](../../apps/web/lib/hot-ranking.ts)、[apps/web/lib/home-articles.ts](../../apps/web/lib/home-articles.ts)、[apps/web/lib/hot-feed.ts](../../apps/web/lib/hot-feed.ts)、[apps/web/components/home-hot-ranking.tsx](../../apps/web/components/home-hot-ranking.tsx) 与 [apps/web/components/hot-list.tsx](../../apps/web/components/hot-list.tsx) 服务端透传可选 `thumbnailUrl`，并在 [apps/web/components/cover-image.tsx](../../apps/web/components/cover-image.tsx) 保留 `thumbSrc -> src -> fallbackSrc -> defaultCover` 链式回退，灯箱预览使用高清原图。
- **首页缓存与失效闭环**：
  - [apps/web/lib/revalidate-paths.ts](../../apps/web/lib/revalidate-paths.ts) 与 [apps/web/lib/hono-app.ts](../../apps/web/lib/hono-app.ts) 将 `'/'` 纳入 `dailyReportDate` 发布路径并新增 `{ home: true }` 校验与失效范围；[apps/web/lib/hot-ranking.ts](../../apps/web/lib/hot-ranking.ts) 在每次热榜发布后通过回环 `POST /api/revalidate`（及降级直清）触发 `revalidatePath('/')` + Cloudflare `purge_cache`；同步更新 [apps/web/lib/content-update.test.ts](../../apps/web/lib/content-update.test.ts) 与 [apps/web/app/api/revalidate/route.test.ts](../../apps/web/app/api/revalidate/route.test.ts)。
  - [apps/web/next.config.ts](../../apps/web/next.config.ts) 为 `/` 输出 `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`，移除 `no-store` 恢复 bfcache。
- **灯箱懒加载、安全头与现代 `browserslist`**：
  - 拆分 [apps/web/components/cover-image-lightbox.tsx](../../apps/web/components/cover-image-lightbox.tsx) 并通过 `next/dynamic(..., { ssr: false })` 按需挂载，更新 [apps/web/scripts/generate-early-hints.mjs](../../apps/web/scripts/generate-early-hints.mjs) 过滤含 `.yarl__` 的延迟 CSS chunk。
  - [apps/web/next.config.ts](../../apps/web/next.config.ts) 补齐 `poweredByHeader: false`、`Strict-Transport-Security: max-age=31536000; includeSubDomains`、`Cross-Origin-Opener-Policy: same-origin` 与 `Content-Security-Policy`（`connect-src 'self' https:` 以兼容 CCTV 动态 HLS CDN）；[apps/web/package.json](../../apps/web/package.json) 补充现代 `browserslist`（`Chrome >= 111`, `Edge >= 111`, `Safari >= 16.4`, `Firefox >= 111`）。

## Verification

- `pnpm exec biome check .`：`409` 个文件，0 错误 0 警告。
- `pnpm check-types`：`@rss-site/signals`、`@rss-site/api`、`@rss-site/web` `3/3` 包通过。
- `pnpm test`：`@rss-site/signals` `9/9`、`@rss-site/api` `131/131`、`@rss-site/web` `49 passed | 5 skipped (54)`、`229 passed | 24 skipped (253)`（含新增 `lib/image-proxy.test.ts` 与首页/日报失效单测）。
- `pnpm --filter @rss-site/web build`：`13/13` 静态页 + `early-hints`（仅发现主样式 `0nj2fciffcjg_.css`，已自动剔除 `.yarl__` 灯箱样式）+ `sw.js` 构建通过，`/api/img` 路由注册正常。
- 发布脚本校验（WSL Ubuntu）：`deploy/server/test-release-packaging.py`（`8/8 OK`，验证 `redis:7.4-alpine` 与 `darthsim/imgproxy:v4.0.25` 均拉取并打包进 `image.tar`）、`deploy/server/test-postgres-backup.py`（`7/7 OK`）、`bash -n deploy/server/deploy-rss-site` 通过。
- 真实 standalone 服务端到端验证（`apps/web/.next/standalone/apps/web/server.js`）：`GET /` 返回 `200`，`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`、`Cross-Origin-Opener-Policy: same-origin`、`Strict-Transport-Security: max-age=31536000; includeSubDomains`、`Content-Security-Policy` 生效、无 `X-Powered-By`、HTML 无 `hm.baidu.com` 与灯箱 CSS chunk。
- 无接受的后续代码待办（无阻塞项），不单独创建 roadmap。

## Risks

- **防盗链图床抓取失败**：部分国内媒体（如微信、微博、部分新闻源）可能对服务端抓取返回 `403`。已通过 `/api/img` 返回 `502` + `Cache-Control: no-store` 与 `CoverImage` 的 `onError` 链式回退到浏览器直连原始 `src` 兜底，不会导致原本可见的图片变裂图。
- **CSP 兼容性**：`Content-Security-Policy` 放行 `script-src 'self' 'unsafe-inline'`、`style-src 'self' 'unsafe-inline'`、`img-src 'self' https: data: blob:`、`media-src 'self' https: blob:`、`connect-src 'self' https://*.supabase.co https://vdn.apps.cntv.cn https://*.cntv.cn https://*.cctv.com https://*.cctvpic.com` 与 `worker-src 'self' blob:`；若未来新增第三方脚本/接口域名需同步更新 `next.config.ts`。
- **ECS 内存余量**：`imgproxy` 为 Go + libvips 实现，空闲内存约 20–30 MiB，限制 `mem_limit: 192m`、`IMGPROXY_CONCURRENCY=4` 与 `IMGPROXY_MAX_SRC_RESOLUTION=25`，并由 Cloudflare 边缘缓存 30 天，避免与 `web`（`1g`）争抢内存。
