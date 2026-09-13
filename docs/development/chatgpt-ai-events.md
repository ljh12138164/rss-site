# ChatGPT AI 事件来源

## Background

AI 分区当前以 OpenAI 综合新闻作为来源之一，并把所有 `section = 'ai'` 的文章自动同步到
`/ai/events`。OpenAI 综合新闻同时包含研究、安全和公司动态，不适合作为 ChatGPT 产品更新事件。

用户确认新增独立的 ChatGPT 来源、保留 OpenAI 综合新闻，但从 AI 事件时间轴移除 OpenAI 综合
新闻生成的自动事件。ChatGPT 更新日志才承载 OpenAI 产品侧事件。

## Scope

- 新增 `chatgpt` AI 来源，读取 RSSHub `/openai/chatgpt/release-notes`。
- 在现有 AI 来源导航、来源页、分区 RSS、首页文章流和站点地图中按既有注册表机制展示 ChatGPT。
- 保留 `/ai/openai` 及其综合新闻采集。
- 停止从 `openai` 综合新闻自动生成 AI 事件，并移除其既有自动事件；其他 AI 来源保持原行为。
- 新来源通过生产数据门禁后才启用 Supabase Cron。

## Out of scope

- 不修改或替换 OpenAI 综合新闻 Feed。
- 不改变人工编辑事件，也不删除 OpenAI 文章本身。
- 不新增页面模板、交互模式、UI 依赖或独立事件生成服务。
- 不在代码部署与云数据库迁移之前启用新 Cron。

## Acceptance criteria

- `chatgpt` 是合法 AI 信号来源，最多采集 20 条 ChatGPT 更新日志。
- `/ai/chatgpt` 复用现有来源页；AI 导航和说明包含 ChatGPT，并复用 OpenAI 图标。
- 新增 ChatGPT 文章会自动产生已发布 AI 事件。
- OpenAI 综合新闻文章仍可采集和阅读，但不会新增自动 AI 事件；既有 OpenAI 自动事件从时间轴移除。
- Anthropic、DeepSeek、GLM、Google AI 和 Qwen 等其他 AI 来源的自动事件不受影响。
- 来源约束、Cron 清单、API/Web 类型和相关测试与构建检查通过。
- 生产发布按“迁移、API/RSSHub、手动采集验证、Cron”门禁顺序完成并记录非秘密证据。

## Feasibility

结论：可行。

- `server/api/src/technology/sources.ts` 和 `apps/web/lib/technology-sources.ts` 是 API 与 Web 的来源
  注册表；增加同一 ID 即可复用现有页面、文章查询、RSS 与 sitemap。
- `public.sync_article_ai_event()` 当前对所有 `section = 'ai'` 文章生成事件。迁移可显式排除
  `source = 'openai'`，删除只由 OpenAI 文章自动生成的事件，同时保留文章和人工事件。
- 2026-09-13 无凭据探测 `https://rss.ljhboard.cn/openai/chatgpt/release-notes` 返回 HTTP 200、
  `application/xml`，路由标识为 `/openai/chatgpt/release-notes`，最新条目包含标题、正文、GUID 和
  发布时间。Feed 返回完整历史，采集端必须继续以 `itemLimit: 20` 限制写入。
- 主要交付风险是数据库 check constraint 与代码发布顺序不一致。必须先让目标云数据库接受
  `chatgpt`，再调用已部署 API；`pnpm setup:cron` 会先逐源验证、后调度，符合生产门禁。
- Feed 的条目共享同一个帮助中心 URL，但 GUID 按发布日期区分；现有唯一键为
  `(source, source_key)`，因此不会互相覆盖。

## Implementation

- UI 交付面仅为现有 `/ai` 来源导航新增 ChatGPT 项并复用 `/ai/[source]` 页面；正常、加载、空、
  错误态和桌面/手机响应式范围均沿用既有组件。
- 用户确认 ChatGPT 对应 AI 事件、OpenAI 综合新闻不再进入事件时间轴；OpenAI 来源页继续存在。
- 视觉沿用现有扁平来源导航、排版、间距、主题 token 和 `SourceIcon`，ChatGPT 复用 OpenAI SVG；
  不增加依赖。UI Skills MCP 注册表未向当前任务暴露，因此不能声称完成 UI Skills review，改用仓库
  既有设计系统与 `develop-with-pr` 的 UI quality 清单。
- 实现采用最小来源注册、Cron 清单和版本化 SQL 迁移，不创建新的事件同步路径。

## Verification

- 真实上游探测：`https://rss.ljhboard.cn/openai/chatgpt/release-notes` 无凭据返回
  HTTP 200、`application/xml`，并标记 RSSHub 路由 `/openai/chatgpt/release-notes`。
- 使用项目现有 RSS 解析器读取 20 条记录；首条标题、ChatGPT 帮助中心 URL 和发布时间均合理。
- Supabase 官方文档确认触发器由 trigger function + row trigger 组成，并建议数据库函数使用
  `security invoker`；本迁移沿用该安全模式。2026-09-13 的官方变更记录中未发现影响本迁移或
  `cron.schedule` 用法的破坏性变更。
- API 测试：64 项通过；Web 测试：154 项通过；API/Web 类型检查通过；Web 生产构建通过。
- 变更文件 Biome 检查与 `git diff --check` 通过。
- 本机 Docker Desktop 引擎不可用，因此新增 pgTAP 测试尚未在本地数据库执行；它将随迁移在
  可用的 Supabase 测试环境中运行。
- 按用户要求不再执行额外 UI 检查。此前导航适配检查已通过，不作为本轮剩余门禁。
- 生产门禁尚未执行：代码/API 与迁移需先部署，再手动调用生产采集端点并核对云端
  `source_status`、`hot_items` 和文章字段，最后才运行 `pnpm setup:cron` 启用任务。

## Review

- 规格自审：OpenAI 文章保留；只有 OpenAI 自动事件被排除和清理；ChatGPT 与其他 AI 来源仍
  自动生成事件，符合确认后的范围。
- 工程自审：新增来源复用既有注册表、页面和图标；数据库规则集中在原触发器中，没有引入新的
  页面或服务抽象。
- 未发现需要追加路线图的后续改动；生产数据门禁属于部署步骤，不在此分支提前执行。

## Risks

- 迁移会删除 OpenAI 文章对应的自动事件及其级联关联行；这是用户要求的时间轴清理，OpenAI 文章
  本身不会删除。人工事件没有 `auto_article_id`，不会受影响。
- 未完成云 Supabase 数据核验前不得启用 `signal-ingest-chatgpt` Cron。
