# Workbox Service Worker cache

## Background

用户批准用 Google Workbox 给当前 Next.js 站点接入 Service Worker，并要求完成后讲解代码。
基于用户确认已更新的 `origin/master` (`25ab02d`) 创建 `feat/workbox-cache`。
原目录的 Next 自动生成文件改动保留在原工作区；本任务使用独立工作区。

## Scope

公开页面 HTML 网络优先、Next 静态资源缓存优先、预缓存离线兜底文档。
仅生产模式注册；本地生产验证可使用 localhost。保持当前构建和 Docker 打包方式。

## Out of scope

完整 PWA 安装、推送、图片/视频/API 缓存、私有页面离线访问、RSC 客户端导航离线支持、生产部署。
不增加来源、迁移或 Cron。

## Acceptance criteria

- 构建生成自托管的 `public/sw.js`，无需运行时访问 Google CDN。
- 只缓存成功且可公开缓存的 HTML，以及同源 Next JS/CSS/字体。
- 后台、个人页、API、非 GET、跨域及 RSC 请求不匹配运行时缓存。
- 断网普通导航访问已缓存页面可回退 HTML，未缓存公开页面显示离线兜底。
- 缓存有条数及时间上限；更新等待旧标签关闭，不强制中断阅读。
- SW 注册失败不影响正常页面；开发模式不注册。

## Feasibility

可行。已读取安装版本 Next PWA/headers 文档和 Workbox build 官方文档。
选择 `workbox-build.generateSW`，无需接入 Webpack 或改动 Turbopack。
Docker 已复制构建后的 public，因此无需改部署逻辑。
关键边界：App Router 的 RSC 与普通 HTML 不能共享缓存；先限定真实 document navigation。
Cache API 不自动执行 HTTP 缓存规则，显式拒绝 private/no-store 和非 HTML 响应。
SW 与页面代码升级不能强制抢占旧标签；保留默认 waiting 生命周期。

## Implementation

- `scripts/generate-service-worker.mjs`：Workbox 配置及构建入口，内联 Workbox runtime。
- `components/service-worker.tsx`：生产 HTTPS/localhost 注册，浏览器更新检查绕过 HTTP 缓存。
- `/sw.js` 返回 no-store；产物被 Git 忽略，构建后由现有 Docker COPY 打包。
- 页面 NetworkFirst（60 页、24 小时），静态 CacheFirst（150 项、30 天）。
- 页面缓存不会把 HTTP 500 当作断网；正常在线错误保留服务器响应。
- 仅预缓存 `/offline.html`；静态资源按需缓存，避免首访下载全站资源。
- 用户此前已接受最小离线兜底范围，复用站点报刊式衬线标题、灰白/青色主题、4px 间距基础。
  唯一新增表面是离线兜底文档：断网读者看到原因与重载按钮；手机/桌面、明暗主题、键盘焦点。
  它不依赖 React、字体下载或 CSS 资源；原生 HTML 按钮无需新 UI 库。
  已读取 UI Skills baseline-ui/interface-design，遵循简洁层级、语义按钮、可见焦点、无装饰动效。

## Verification

- 全仓测试通过：Web 250、Signals 7、API 85，共 342 项。
- Web `tsc --noEmit` 通过；变更代码 Biome 检查通过；`git diff --check` 通过。
- `generate-service-worker.mjs` 成功，无警告；预缓存 1 个 1534-byte 离线 HTML，Workbox runtime 内联于产物。
- 完整 Next 生产构建通过，62/62 页面预渲染完成。首次直接连接云端时超时；使用本机代理和 Node 环境代理后成功，
  部分来源仍有瞬时超时但自动重试成功。没有替换真实数据或关闭 TLS 校验。
- 构建后 early-hints 和 SW 两个脚本均通过，普通和 standalone routes manifest 更新成功。
- 真实 Chrome、本地隔离 HTTP 数据服务：安装/接管、NetworkFirst 在线刷新、HTML/静态脚本离线回退、未缓存兜底、
  RSC/API/admin/private/no-store/500 排除、重新联网重试、升级 waiting 保留旧 active worker 全部通过。
- Chrome 实际 Next 生产构建：根布局自动注册成功，`/sw.js` 返回 200/no-store，13 项 Next 静态资源缓存，
  在线暖缓存后首页断网刷新成功，未访问的公开路径显示兜底。
- 手机 390×844 明色、桌面 1280×800 暗色兜底截图已检查，无溢出或缺失资源。
- Windows standalone 本地启动遇到生成依赖链接 EPERM；实际浏览器测试使用 `next start`，它会提示 standalone 配置警告。
  Linux Docker 实际启动仍由既有 CI/部署流程验证；未修改现有 standalone 或容器发布配置。
- 安装锁文件供应链检查通过（797 entries）；Workbox 为构建期 devDependency，版本锁定 7.4.1。
  新增 Babel/Terser 是 Workbox 构建依赖，导致 Next/Vite 的可选 peer 快照标识相应改变；原有直接依赖版本保持不变。
  浏览器验证脚本与截图仅在本地忽略的 `.next` 下，不纳入生产代码或依赖。

## Risks

- 客户端 Link 导航和无限滚动需要网络；离线缓存仅保证已缓存 HTML 的完整导航/刷新回退。
- 首次注册之前已加载的资源不会追溯缓存；接管后的在线刷新可暖缓存。
- 浏览器可驱逐缓存；过期/超出上限的页面和资源不保证离线可用。
- Cache API 与 ISR 独立；联网始终请求新页面，离线快照可能较旧。
- 此处 24 小时是 Workbox 有界过期策略，并非服务端撤回内容即时传播机制。

## Review

已对照接受范围、仓库标准及实际请求链路评审，无阻塞项。检查了同源/GET/RSC/私有路径隔离、响应可缓存条件、
有界清理、等待升级、失败降级、构建产物打包和开发模式边界。无接受的新增实现后续事项，因此不创建空 roadmap。
发布后验证 Linux 容器启动及真实域名 SW 属于常规交付验收；没有声称已经部署。

## Code walkthrough

SW 是浏览器为站点运行的独立脚本，可以在页面发出请求时选择从网络或 Cache Storage 返回响应。
它不会访问 React 状态或 DOM；注册组件只负责让浏览器安装它，真正缓存逻辑在生成的 `/sw.js` 中。

1. `ServiceWorker` 在根布局挂载。`useEffect` 只在浏览器执行；生产、支持 SW 且安全上下文时注册 `/sw.js`。
   `updateViaCache: 'none'` 让更新检查不读 HTTP 缓存，失败仅记录控制台警告。
2. `generate-service-worker.mjs` 在 `next build` 后执行。`generateSW` 把配置和 Workbox 实现打包成普通 JS。
   开发者维护这里的配置，不直接修改生成文件。回调必须独立：生成时会被序列化，不能引用文件外的变量。
3. 安装阶段把 `offline.html` 放入预缓存；激活后 `clientsClaim` 接管页面。初次接管以前的请求不会追溯缓存。
4. 请求进入时先看 `urlPattern`：公开 document navigation 才走页面策略；同源 `/_next/static/` JS/CSS/字体才走静态策略。
   不匹配的请求交还浏览器正常联网，不会自动获得离线能力。
5. `NetworkFirst` 先请求最新 HTML，再用 `cachePublicHtml` 检查 200、HTML 和非 private/no-store。
   网络失败则查缓存；缓存也不存在时由 `precacheFallback` 返回离线文档。
6. `CacheFirst` 先查静态缓存，命中直接返回；未命中才联网并保存。Next 的资源 URL 带内容哈希，代码改变时 URL 改变。
7. `expiration` 管理最大条数和年龄，避免缓存无限增长。它只管理该策略的运行时缓存，不管理 Next 服务端 ISR。
8. 新脚本下载后先安装，再等待旧 SW 控制的标签页退出；`skipWaiting: false` 不强制抢占。
   新 SW 激活后使用新的策略。当前固定 v1 运行时缓存继续按 URL、容量和年龄维护；`cleanupOutdatedCaches` 清理不兼容的预缓存，
   并不自动删除全部运行时缓存。

本地体验需要生产构建和 `next start`（或 standalone）；`next dev` 不注册。
浏览器开发者工具 Application → Service Workers 查看状态，Cache Storage 查看条目；
在线刷新暖缓存后，在 Network 切换 Offline，再直接刷新已访问的公开 URL 或访问一个未缓存公开 URL。
若同一 localhost 端口以前安装过生产 SW，调试 dev 前在开发者工具注销旧 SW，避免它继续控制开发页面。

## Delivery

功能提交 `41e855b` 已推送至 `origin/feat/workbox-cache`，基线/PR 目标为 `master`。
仓库规则要求由用户创建和合并 PR；本任务没有创建 PR、修改生产环境或发布站点。
