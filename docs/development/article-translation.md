# 文章本地翻译

## Background

文章详情页需要在不依赖收费 API 的前提下提供英文到中文的按需翻译。用户指定直接在 Next 服务端使用 [MTranServer](https://github.com/xxnuo/MTranServer) npm 包，并让打包后的 Next standalone 服务由 Bun 运行；接口层使用 Hono 和 RPC 类型推导。

## Scope

- 只支持英文文章翻译为简体中文。
- 英文文章详情和英文 AI 事件详情按需触发，保留原文/中文切换、加载、失败和重试状态。
- Hono 挂载在 Next App Router 的 Node.js Route Handler 中，前端使用 `hc<AppType>`。
- 服务端根据文章 ID 和来源重新读取文章；客户端不能提交任意待翻译文本。
- 事件翻译只提交事件 slug，由服务端重新读取已发布事件；时间轴列表不增加逐项翻译按钮。
- Next 进程内复用一个 MTran 实例和 `en_zh` 模型，重复的同文章请求共用任务。
- 原始 HTML 在送译前清洗，译文返回前再次清洗。
- standalone 容器使用 Bun 启动，并把模型目录挂载到持久卷。

## Out of scope

- Vercel、Cloudflare Workers 等无持久磁盘的 serverless 部署。
- 独立 MTranServer HTTP 服务、多语言、自动预翻译、数据库译文缓存、逐段双语排版和时间轴列表逐项翻译。
- 本轮不改 Supabase schema、采集任务或 Cron。

## Acceptance criteria

1. 英文文章详情和英文 AI 事件详情显示“翻译为中文”，中文内容不显示；翻译完成后能切换原文和译文。
2. Hono RPC 同时推导请求和各状态响应类型，Next route 固定为 Node.js runtime。
3. 首次调用初始化并下载模型，后续调用复用；初始化失败后允许重试。
4. 只翻译服务端查询到的文章，限制并发中的不同文章数，同文章请求去重。
5. 危险或超限 HTML 不进入模型，模型输出不能绕过既有 HTML/URL 白名单。
6. Docker 运行阶段由 Bun 启动 standalone，模型目录对非 root 用户可写且由 Compose volume 持久化。
7. 单元测试、类型检查、格式检查、生产构建及可行的 Bun/Docker smoke test 通过。

## Feasibility and decisions

结论为单实例自托管环境可行。MTranServer 包要求 Node.js 18+，但实现依赖文件系统、WASM 资产和本地模型文件，因此不适合当前需求下的无状态 serverless。Next 配置把 `mtranserver` 作为外部服务端包，避免打包器改写其资产定位；standalone tracing 仍需在构建产物中验证相关文件存在。

Hono 官方 Next.js 适配使用 `app/api/[[...route]]/route.ts` 和 `hono/vercel` 的 `handle()`。RPC 通过导出 Hono app 的 `typeof` 并在客户端传给 `hc` 推导输入输出；Web 与 API TypeScript 配置均已启用 strict。

本轮不落库译文，避免引入 schema 与失效策略。模型缓存由命名卷持久化；翻译结果只保留在当前页面状态，刷新后需要再次推理。

事件详情沿用文章详情已经确认的单按钮交互、语义色、44px 触控高度和响应式正文宽度。加载文案统一为“正在翻译中”，不展示实现技术或模型来源。UI Skills registry 未暴露给当前任务，因此按仓库 UI quality 清单和现有 React Aria/Tailwind 组件完成，不声称经过 UI Skills registry 评审。

## Risks

- CI 容器修复：准备脚本不属于 Next 路由追踪入口，镜像显式安装并复制 MTranServer 4.0.33 完整运行依赖，通过应用目录链接供脚本和路由解析；构建阶段以 bun 用户验证导入。首次模型下载的健康检查宽限和 CI 等待调整为 300 秒。本地 Docker daemon 不可连接，尚未完成 Linux 镜像实测，需 CI 验证。

- 2026-09-12 实测 RSSHub `/openai/news?limit=1`：正文完整，Loading… 来自 `data-read-aloud-ui` 朗读组件。采集与阅读清洗共享该组件移除规则；未修改线上 RSSHub 或历史数据库摘要。
- 新增 `pnpm --filter @rss-site/web translation:prepare`，使用 Bun 提前下载并执行翻译校验；容器在该步骤成功后启动 Next。本地下载完成，真实翻译校验通过，命令退出码 0。该独立准备进程只预下载磁盘文件，Next 进程仍需自行加载 WASM。
- 本轮 API 64/64、Web 153/153 和双方类型检查通过，完整 build 53/53 通过。规范/需求审查确认修改限于已识别朗读控件和模型准备步骤。

- 首次请求需要下载模型，耗时取决于服务器到模型源的网络；UI 必须明确提示。
- 2 核/1 GiB 容器翻译长文时可能有 CPU/内存压力，因此不同文章最多同时执行两个任务，且 MTran 引擎内部仍会排队。
- Bun 对 Next standalone 和 MTranServer 的 Node/WASM 兼容性必须以实际构建与启动测试为准；若失败，不能仅凭类型检查宣称可发布。

## Verification

- `pnpm check-types`：API 与 Web 两个 workspace 均通过。
- `pnpm test`：API 63/63、Web 152/152 通过；新增文章/事件语言判定、双重 HTML 清洗、Hono 输入/成功/404、事件入口及 SEO 环境降级测试。
- 修改文件 Biome 检查通过。全仓 `pnpm lint` 仍被既有 CRLF 格式问题阻断（172 errors、165 warnings），未批量修改无关文件。
- `next build --experimental-build-mode compile` 通过，并生成 `/api/[[...route]]`；standalone tracing 中确认存在 MTranServer 包和 Bergamot WASM。
- 未设置 `SITE_URL` 的完整 `pnpm --filter @rss-site/web build` 通过，生成 53/53 个静态页面和 early-hints。`robots.txt` 在缺少站点域名时省略 sitemap，sitemap 路由返回 404；配置正式域名后仍输出并严格校验绝对 URL。回归首轮曾在 `/finance` 与 `/ai/google-ai` 遇到既有 Supabase 超时，第二轮成功，确认不是本次改动导致。
- Bun 1.3.14 直接导入 MTranServer、复用下载完成的约 52 MB `en_zh-Hans` 模型并完成 HTML 英译中；标签结构保留且输出可再次清洗。
- 本地真实英文 OpenAI 文章通过 Hono `POST /api/articles/translate` 返回 200（开发日志 5.0 秒）；桌面暗色界面确认加载态、中文标题/正文、模型说明及原文/译文切换正常。
- 本地真实英文 AI 事件通过 Hono `POST /api/events/translate` 返回 200（开发日志 5.1 秒）；桌面检查确认按钮位置、唯一加载文案“正在翻译中”、中文标题/摘要和原文切换，且不显示模型来源说明。
- `docker compose config --no-interpolate` 通过并确认 `mtran-data` 挂载。Docker Desktop daemon 未运行，未执行 Linux 镜像构建；Windows 上直接启动 standalone 时 Bun 无法读取 pnpm 生成的链接（EPERM），因此容器内 Bun standalone 仍需由 CI 镜像验证。
