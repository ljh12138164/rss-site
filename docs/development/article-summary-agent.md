# Cloudflare 文章总结 Agent

## Background
用户要求参考 DeepAgentsJS，在 ai-base Nest 服务提供文章总结，并接入 rss-site 文章详情页。模型使用 Cloudflare Workers AI 的 @cf/qwen/qwen3-30b-a3b-fp8，通过 ChatOpenAI 的自定义 baseURL 连接。

## Scope
- Nest 新增 POST /v1/agents/article-summary/invoke，Zod Pipe 严格校验 UUID，仅接收 {id}，拒绝多余参数，Bearer 服务鉴权。
- DeepAgentsJS + ChatOpenAI Chat Completions；中文概述和 3–5 条要点，服务端验证输出。
- rss-site POST /api/articles/summarize 只接收 ID 并中转，Nest 用 Drizzle 直接读取 Supabase 既有 signal_articles 表；正文优先，来源摘要回退并明确标注。
- 手动触发详情页 AI 总结，生成中、成功、失败重试；30 天 Redis 缓存、同内容任务去重、并发上限。
- 用户后续确认：使用 idb 包保存浏览器本地总结，30 天有效，刷新恢复、正文/版本变化失效，存储异常降级。

## Out of scope
不新增采集来源、数据库迁移、Cron、自动预生成、任意 URL 抓取或聊天功能。按用户确认移除 assistant 示例模块及孤立 agent/model 代码和测试，gemini-edge 仍为独立项目。

## Acceptance criteria
1. Cloudflare 配置与 Gemini 独立；Token 仅存在服务端，未配置返回可控错误。
2. 无效/超限输入不调用模型；失败、空输出、无效要点不缓存，不泄露模型或密钥错误。
3. 同一内容并发去重；文章修改缓存失效；Redis 故障不阻止生成。
4. 用户确认的现有详情页内嵌面板，明暗主题、桌面/手机、键盘可用；页面加载不触发生成。
5. 双仓测试、类型、lint、构建及可行的浏览器交互验证通过。
6. IndexedDB 使用 idb Promise API，持久保存并校验总结；本地命中不调用总结接口，首次生成保持手动，SSR 不打开数据库。

## Feasibility
可行。Node >=24、Nest 12、LangChain 1 和 DeepAgentsJS 1.14.2 可兼容。Cloudflare 官方确认所选 Qwen 支持函数调用，32,768 tokens 上限。
使用 ToolStrategy 而非 OpenAI 原生 JSON Schema/Responses API；基于 UTF-8 字节保守限制输入，为默认工具提示与输出留空间，不静默截断正文。
内存 StateBackend 不接本地磁盘、命令或网络工具；总超时、递归上限、并发上限约束资源。真实账户端到端调用仍需 Workers AI Token；模拟 HTTP 验证不能替代真实模型质量验收。
浏览器缓存可行：idb 8.0.4 支持 TypeScript、Promise 与 get/put/delete；沿用 Next 的 Server/Client 边界，在服务端生成内容指纹，在 Client Component 的 effect/事件中调用本地缓存。fake-indexeddb 6.2.5 仅作测试依赖。无需页面、数据库迁移或 UI 库变更；现有 UI 确认继续适用。
参考 https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/ 、https://docs.langchain.com/oss/javascript/integrations/chat/openai 、https://github.com/langchain-ai/deepagentsjs 。

## Implementation
- 两仓均从 fetch 后 origin/master 创建 feat/article-summary-agent。
- 复用文章翻译的 Hono RPC、ActionButton 和 Redis 工具；既有 docs/development/article-translation.md、redis-ai-cache.md 支持这些决策。
- 按用户后续要求把共享 AI 结果缓存（总结和翻译）从 7 天调为 30 天，即 2592000 秒；缓存键包含模型/提示词版本、文章 ID、标题、提取正文与正文/摘要依据。idb 命中跳过 Nest 调用，Nest Redis 命中跳过 AI 调用；同内容进程内请求合并，最多同时生成两篇不同文章。内容变化重新生成，失败不缓存；Redis 不可用时沿用既有降级行为。既有键不主动续期，新写入结果使用新 TTL。
- 本地总结使用 idb 数据库 rss-site-ai-summary，summaries store 按来源、文章 ID、共享总结版本、标题/清洗正文/来源摘要的 SHA-256 指纹索引。保存校验后的结果和 expiresAt，读取不续期；过期或损坏的记录读取时删除。打开失败允许下次重试，数据库升级时关闭旧连接，异常终止后可重新打开。
- 详情页 effect 只恢复本地总结，不主动调用接口；点击先等待同一次恢复读取，未命中才请求后端。成功结果先展示，再异步保存；存储异常不影响展示。React key 随内容指纹变化，清理旧 effect，避免不同文章状态串用。两仓版本同步为 v2，旧本地结果失效。
- DeepAgentsJS 1.14.2 的空 subagents 仍会安装默认委派工具；使用公开 createMiddleware 接口按内置名称替换 subAgentMiddleware，测试验证上游 tools 无 task。其余文件工具使用内存 StateBackend，无本地文件、命令或外部网络能力。
- 用户已确认：现有文章详情页按钮和内嵌要点，生成/结果/错误重试，桌面与手机明暗主题，不新增页面或 UI 库。
- UI guidance 已读取 dammyjay93/interface-design 和 ibelick/baseline-ui。React Aria 1.17、Tailwind 4、React 19 / Next 16 沿用项目版本。
- UI brief：读者先扫要点再读全文；文章标题和正文仍为主，摘要为标题与正文之间的阅读辅助。白/墨色正文、灰色元信息、蓝色操作、边框与 muted 表面，继承现有字体，4px 网格、16px 内边距、自然换行。无渐变、光晕、额外动画或仪表盘布局。

## Folo research
核对公开 dev commit 3c6e6bba4c0ce6b24c260b2f5b4043fd4f29f5ea 与官方 SDK @follow-app/client-sdk 0.3.96：
- summary/store.ts 调用 ai.summary({ id, language, target })，已有摘要直接复用，pendingPromises 合并同文章/语言/目标请求；完成后写本地摘要表。
- summary/hooks.ts 使用 TanStack Query，staleTime 为一天（客户端查询新鲜度，不代表服务端 TTL）。
- entry-content/components/AISummary.tsx 根据阅读模式成功状态选 content/readabilityContent。
- database/services/summary.ts 按 entryId+language upsert summary/readabilitySummary，保留非空旧结果。
- SDK src/modules/ai/index.ts：GET /ai/summary，返回 data: string|null；区别于 POST /ai/chat 流式聊天。
- 未在公开客户端仓库找到模型选择、服务端提示词、长文分段或服务端缓存 TTL；不推断这些细节。不复制 Folo 源码，只借鉴分工与状态模式。
证据：
https://github.com/RSSNext/Folo/blob/3c6e6bba4c0ce6b24c260b2f5b4043fd4f29f5ea/packages/internal/store/src/modules/summary/store.ts
https://github.com/RSSNext/Folo/blob/3c6e6bba4c0ce6b24c260b2f5b4043fd4f29f5ea/packages/internal/store/src/modules/summary/hooks.ts
https://github.com/RSSNext/Folo/blob/3c6e6bba4c0ce6b24c260b2f5b4043fd4f29f5ea/apps/desktop/layer/renderer/src/modules/entry-content/components/AISummary.tsx
https://github.com/RSSNext/Folo/blob/3c6e6bba4c0ce6b24c260b2f5b4043fd4f29f5ea/packages/internal/database/src/services/summary.ts
https://www.npmjs.com/package/@follow-app/client-sdk/v/0.3.96

## Plan
1. 测试 Cloudflare 请求、工具结构化响应、输入校验/鉴权和错误，新增 Nest summary module/service/controller/DTO；按用户确认移除 assistant 示例。
2. 测试并实现 rss-site 内容提取、后端调用、输出校验、缓存/去重/并发，接 Hono ID-only 路由。
3. 详情页加入已确认的手动按钮/要点区；验证没有自动调用、加载、成功与重试、响应式和主题。
4. 全仓校验、独立审查、关闭阻塞问题，更新本文；用户要求 PR 地址，提交并推送两仓 feat 分支。遵循 rss-site AGENTS 的交付规则，由用户创建并合并到 master 的 PR。

## Verification
- Nest 先验证新增接口不存在时测试失败，再实现并通过；真实 DeepAgentsJS、ChatOpenAI 与 Nest HTTP 请求连接模拟 Cloudflare 响应。5 项新增测试覆盖官方 URL/模型/鉴权、工具结构化输出、无 task 委派工具、Zod 字节上限、缺失配置、脱敏错误、无效结果以及客户端断开中止请求。pnpm exec turbo run test check-types lint build 全部 8 项任务成功，agent-service 19 项测试通过，既有 Worker 15 项测试及 dry-run 构建复用缓存；新增 Nest 文件 Prettier 检查通过。
- rss-site 全仓 pnpm test：signals 7、API 100、Web 294，共 401 项通过；pnpm check-types 通过。新增服务测试验证正文清洗/摘要回退、服务端鉴权协议、Redis 命中与内容失效、并发合并、失败重试和不同文章并发上限；路由测试验证 ID 查库、错误状态和脱敏。
- 变更文件 Biome 检查通过。Web 生产构建生成 62 页，TypeScript、Early Hints 和 Service Worker 产物生成通过。
- 浏览器使用实际 ArticleReader 和临时本地文章夹具验证桌面深色、390px 手机浅色、手动按钮不自动请求、生成中禁用、成功概述与要点、键盘折叠/展开不重复请求、503 错误及重试、摘要回退标注。仅模拟 summary RPC 响应；临时页面和浏览器拦截已移除。
- 独立代码审查提出的默认委派工具、非法结构化输出与取消测试建议已完成，无接受但未处理的后续事项；不创建空路线图。
- 未执行真实 Cloudflare 推理或生产部署；模型测试使用模拟 HTTP。
- 后续 30 天 TTL 调整：先将 Redis SET EX 测试改为 2592000 秒，确认原 604800 秒实现失败；调整共享常量后，Redis、文章翻译、文章总结及总结路由四个文件共 33 项测试通过，缓存变更文件 Biome 检查通过。原全仓与构建证据对应此前七天 TTL 的实现。
- idb 扩展 red/green：先确认持久化恢复测试返回 null、文章内容失效测试没有 cacheKey 时失败，再完成实现。7 项 idb 测试使用真实 idb 与 fake-indexeddb，覆盖模块重载后的持久化、内容键隔离、30 天边界及读取不续期、损坏数据、非法结果不写入、无 IndexedDB 和打开失败后恢复；另 1 项 ArticleReader 测试验证标题/正文/正文回退变化使键失效、lastSeenAt 变化不失效。
- idb 最终校验：pnpm test 全仓 409 项通过（Web 302、API 100、signals 7），Web 类型检查与 9 个变更文件 Biome 检查通过；生产构建生成 62 页，Early Hints 与 Service Worker 产物脚本成功。无阻塞审查项或接受但未处理的后续事项。
- idb 浏览器验证：实际 ArticleReader 配本地文章夹具，仅模拟首次总结 RPC 响应；刷新后自动恢复、折叠/展开、切换到修改正文再回到原文均验证通过，首次生成后没有新增总结接口请求。使用浏览器真实 IndexedDB；临时验证页面、开发服务、请求拦截与测试标签页已清理。

## 2026-10-13 后续调整与验证
- 用户确认短文门槛：清洗正文去空白后少于 200 个 Unicode 字符隐藏入口，标题不计入；无正文才回退摘要。UI 与 Nest 均执行门槛，链接 URL 不计入字数，过长内容明确拒绝。
- 浏览器 {id} → Web Hono {id} → Nest Drizzle/Supabase → Redis → Cloudflare。数据库标题与正文一起交给模型；客户端无法替换文章内容。Drizzle 0.45.2/postgres-js 3.4.9 仅映射既有列；prepare:false，连接和 SQL 超时 10 秒，最多 2 个连接，关闭释放。
- Redis 成功结果与并发合并迁至 Nest，TTL 2592000 秒，输出经 Zod 验证；失败不缓存。一名等待者断开不影响其他人，最后一名断开才中止上游；单进程最多同时生成两篇不同文章。两仓版本同步 v2，idb 30 天恢复/损坏清理/存储降级保留。
- Nest 18 项测试、类型、Oxlint、构建通过；Web 300 项测试、类型、变更文件 Biome、62 页生产构建通过。覆盖参数化 Drizzle SQL、数据库标题、199/200 字与长链接边界、Redis EX/故障、内容失效、失败重试、共享取消与容量；Hono 测试断言不查库/不接受正文与来源。
- 实际 Supabase Drizzle 只读连接通过，抽查 10 条记录，存在符合门槛的文章。Nest 忽略的本地 .env 已复用现有 RSS 数据库连接，未打印密钥，仅查询，未修改生产数据。
- 独立审查发现 UI 默认转换将链接地址计入字数；已统一 ignoreHref 并添加回归。没有其他阻塞项或接受但未处理的后续事项，不创建空路线图。历史证据对应此前实现分工；本节为当前结果。
- 页面布局/idb 手动交互沿用此前浏览器验证，新长度规则由服务端渲染边界测试验证。真实 Cloudflare 推理和部署仍未执行。
- [Cloudflare 官方计费](https://developers.cloudflare.com/workers-ai/platform/pricing/)：Free 每日免费 10000 Neurons，超额请求失败；Workers Paid 超额 $0.011/1000 Neurons，北京时间 08:00 重置。同账户各项目共享，未核实用户实际套餐。
- [Supabase Drizzle 官方接入](https://supabase.com/docs/guides/database/drizzle)。其他 RSS 功能依赖的 PostgREST 不变。
- 实际后端 PR：[ai-base #1](https://github.com/ljh12138164/ai-base/pull/1)；rss-site 仍由用户通过下方创建链接创建 PR，分支 feat/article-summary-agent，base master。

## Integration and delivery
- Nest：设置 CLOUDFLARE_ACCOUNT_ID=24d22867b0eba3cae0de0cc8890fcfd5、CLOUDFLARE_API_TOKEN 和 AGENT_SERVICE_TOKEN；文章总结无需 Gemini 配置。
- Web：在服务端环境（生产为 runtime.env）配置 AGENT_SERVICE_URL 与相同 AGENT_SERVICE_TOKEN。URL 为容器/服务器可访问的 Nest HTTP(S) 根地址；127.0.0.1 仅适用于服务在同一主机网络的本地开发。凭据不使用 NEXT_PUBLIC_ 前缀。
- Nest 配置 DATABASE_URL 和 REDIS_URL，Web Redis 继续用于翻译；Nest 需加入现有 Redis 私有容器网络或使用可达私有地址，容器 localhost 不能指代其他容器。不开放公网 Redis，无数据库迁移。
- 两仓分支 feat/article-summary-agent，base master。用户先明确调研，随后确认 idb 本地缓存的实现，并要求提供 PR 地址；已完成实现与验证，按最新要求提交并推送两仓分支。根据 rss-site AGENTS，由用户创建和合并 PR；本轮不部署。
- PR 创建链接：[ai-base](https://github.com/ljh12138164/ai-base/compare/master...feat/article-summary-agent?expand=1)、[rss-site](https://github.com/ljh12138164/rss-site/compare/master...feat/article-summary-agent?expand=1)。后端新增 Cloudflare 总结接口，前端提供短文隐藏的手动入口与 idb 本地恢复，Nest 查库并保存 Redis 30 天结果；两仓需协调合并，并配置上述环境变量后验证真实模型调用。

## Risks
- 没有实际 Workers AI Token 时仅能验证协议与错误处理，需明确报告真实模型调用未验证。
- 免费额度由同一账户共享；模型工具循环受递归与超时约束。
- Redis 故障允许生成；去重与并发限制只在单进程内有效。
- 超长文章明确拒绝，不把局部内容包装成全文摘要。
- 浏览器本地缓存属于当前站点/浏览器，不能跨设备同步；过期记录按读取时清理，浏览器可能提前回收存储，缓存缺失时仍可手动请求后端。

