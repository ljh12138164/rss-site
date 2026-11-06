# 热点更新

一个通过 RSSHub 与官方 RSS 汇总热点的轻量阅读站。科技区包含 GitHub Trending、GitHub Blog、Hacker News、
掘金、IT之家和 36氪；国内新闻区包含新华社、央视国内、中新网、澎湃热榜、界面中国和百度热搜；AI
平台区包含 OpenAI、ChatGPT、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini 和 Qwen；另有六路社交热点与
五路财经、五路游戏信号。首页以 AI 为主展示三十五路摘要，各分区总览与 `[source]` 路由展示独立列表。
AI 每 2 小时、其他分区每 6 小时错峰采集。迁移目标是单个 Next 服务承载业务入口，使用服务器 PostgreSQL 18；生产切换状态见[迁移开发文档](docs/development/business-postgres-migration.md)。

## Architecture

```text
PostgreSQL pg_cron + pg_net → Next /cron → RSSHub / official RSS
                         ↓ Drizzle
                  PostgreSQL 18 + Redis
                         ↑
                   Next pages / API / MCP
                         ↑ authenticated internal API
                    ai-base agent-service
```

- `apps/web`：Next.js 16、React 19、采集与维护入口、业务查询、MCP 和日报仓库
- `server/api`：由 Next 复用的 Hono、Drizzle schema 和采集模块，不单独部署 API Worker
- `compose.yaml`：Web、Redis、PostgreSQL 18；数据库只在内部网络开放给 Web
- Supabase：保留 Auth 和私有备份桶；历史业务迁移位于 `supabase/migrations`

应用层只有 Next 直连业务数据库，ai-base 使用鉴权内部接口。列表页由服务端动态渲染并使用 Redis 缓存，文章详情保留 ISR。MCP 地址为 `https://news.ljhboard.cn/api/mcp`。

## 本地开发

需要 Node.js 24+ 与 pnpm 11。克隆仓库后先安装依赖：

```bash
pnpm install
```

### 启动 Next

首次配置且 `apps/web/.env.local` 不存在时，复制示例：

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

填写业务 PostgreSQL 的 `DATABASE_URL`、采集用 `CRON_SECRET` 和现有 Supabase Auth 公开配置。开发数据库需要与生产隔离，应用连接使用普通业务角色。

```bash
pnpm --filter @rss-site/web dev
```

访问 [本地站点](http://localhost:3000)。页面、采集和内部 API 均由同一个 Next 实例提供。

### RSS 订阅

本站也提供六个专区级 RSS 2.0 订阅：

| 专区 | 地址 |
| --- | --- |
| AI | `/feeds/ai.xml` |
| 科技 | `/feeds/technology.xml` |
| 国内新闻 | `/feeds/news.xml` |
| 社交热点 | `/feeds/social.xml` |
| 财经 | `/feeds/finance.xml` |
| 游戏 | `/feeds/games.xml` |

部署后把地址前缀替换为站点域名即可添加到 RSS 阅读器。每个订阅按平台依次收录当前最多十条内容，保留
各平台自己的原始顺序；条目会直接跳转原文。订阅内容来自业务 PostgreSQL 中最近一次成功采集的当前快照，不是
历史归档。上游没有提供发布时间时，RSS 条目也不会补造 `pubDate`。

### 手动采集与数据库查看

Next 启动后，可以向同一个服务提交采集：

```powershell
curl.exe -X POST http://localhost:3000/cron/signals/xinhua -H "Authorization: Bearer <CRON_SECRET>"
```

成功响应包含 `batchId` 和 `itemCount`。`401` 表示密钥不匹配，`502` 表示上游 Feed 或数据库操作失败。不要把生产密钥直接写入可提交的脚本。

`pnpm db:studio` 使用 `server/api/.env` 中的运维连接，仅监听 `127.0.0.1:4983`。它直接操作所连接的数据库，不需要额外 API 进程。生产 PostgreSQL 不发布公网端口。

### 代码检查

完整验证：

```bash
pnpm format:check
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

运行 `pnpm format` 可使用 Biome 统一格式化代码。`pnpm install` 会安装
simple-git-hooks 的 pre-commit 钩子；提交前会格式化并校验暂存文件、重新暂存修复结果，
随后执行类型检查。

## Environment variables

Web 运行时配置见 `deploy/runtime.env.example`；开发配置见 `apps/web/.env.example`。

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 复用现有 Auth 公开配置 |
| `SITE_URL` | 复用站点规范地址 |
| `DATABASE_URL` | 普通应用角色的业务 PostgreSQL 连接，仅 Next 使用 |
| `CRON_SECRET` / `REVALIDATE_SECRET` | 迁入原 API 的采集和发布密钥 |
| `AGENT_SERVICE_TOKEN` | 复用现有 agent-service 共享密钥，保护内部仓库接口 |
| `VERCEL_API_TOKEN` | 迁入原 API 的 RSSHub Cookie 发布凭据 |
| `MAINTENANCE_ENCRYPTION_KEY` | 迁移生成的 Cookie 状态加密密钥，须独立保管 |

Compose 提供 `REDIS_URL`。RSSHub 地址保留现有默认值，Vercel 项目和团队 ID 固定在维护模块中，不新增配置变量。

备份密钥放在独立文件；备份凭据配置仅含 `SUPABASE_STORAGE_KEY`，复用 runtime.env 中的 Supabase URL，固定使用私有桶 `postgres-backups`。它不需要放入 Web 生产环境。所有服务端凭据均不得使用 `NEXT_PUBLIC_*` 前缀或提交到仓库。

## 部署与定时任务

[PostgreSQL 部署与备份说明](deploy/postgres/README.md)描述 PostgreSQL 18 卷挂载、普通应用角色、加密备份和独立恢复验证。首次切换必须冻结所有旧写入、导入最终快照并验证，之后才能由根 Compose 接管数据库。

`deploy/server/business-jobs.json` 是启用来源的配置。迁移保留线上原有 44 个来源，未在线启用的 ChatGPT 不自动增加。新增来源仍需先验证真实上游、部署依赖和迁移，再通过生产数据门禁。

在已注入现有 `SITE_URL` 和 `CRON_SECRET` 的环境运行：

```bash
pnpm setup:cron --output /protected/path/cron-verification.json
```

命令依次调用 Next 采集入口，再调用受保护的 `/cron/verify/:source`，由 Next 核对 PostgreSQL 18 中的 run、source_status、hot_items 和持久文章。CLI 不持有数据库凭据，不安装 Supabase 扩展，不修改 Vault 或调度。任一来源失败都不会生成新的验收证据。

业务调度使用 PostgreSQL `pg_cron` 与 `pg_net`。CI/CD 构建扩展镜像，并通过 `sync-business-cron` 自动应用仓库 SQL、同步任务清单；固定名称更新，不重复创建任务。新来源默认禁用；启用还要求全部配置来源验证通过、证据不超过两小时，并确认旧写入已停止，再调用 `private.activate_business_jobs(jsonb)`。维护任务分别验收后加入 verified_jobs；Cookie 维护沿用北京时间 04:00，备份为 03:00。查询计划与 HTTP 执行结果见 [Cron 运维说明](deploy/postgres/README.md)。

保留策略不变：普通文章 90 天、AI 文章 180 天；当前热点、置顶文章和 AI 事件引用不清理；采集运行记录保留 30 天。删除通知通过持久 outbox 重试。Supabase 每小时只读保活运行在 ECS，不额外保存执行日志。

历史 `supabase/cron` 与 Worker 开发文档用于旧环境审计，不能用于启用新生产调度。旧 API Worker 在替代采集、MCP 和维护入口完成验证后下线。

更详细的设计与实施记录见
[科技多来源与 React Aria 开发文档](docs/development/technology-hot-sources.md)。
国内新闻来源与页面扩展见
[中国国内新闻来源开发文档](docs/development/domestic-news-sources.md)。
AI 官方文章来源与页面扩展见
[AI 平台官方文章开发文档](docs/development/ai-platform-articles.md)。
财经来源与分区扩展见
[财经热点来源开发文档](docs/development/finance-hot-sources.md)，游戏来源见
[游戏热点来源开发文档](docs/development/game-hot-sources.md)，持久化模型见
[信号文章与 AI 事件开发文档](docs/development/signal-article-persistence.md)，后续分类顺序见
[辅助热点分区 roadmap](docs/roadmaps/additional-hot-categories.md)。
