# 热点更新

一个通过 RSSHub 与官方 RSS 汇总热点的轻量阅读站。科技区包含 GitHub Trending、Hacker News、掘金、
V2EX、IT之家和 36氪；国内新闻区包含新华社、央视国内、中新网、澎湃热榜、界面中国和百度热搜；AI
平台区包含 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini 和 Qwen。首页展示十八路摘要，
`/technology`、`/news` 与 `/ai` 展示分区总览，各自的 `[source]` 路由展示独立完整列表。数据约每五小时
由 Hono 服务采集一次，并以 Supabase 作为前后端之间唯一的数据中转。

## Architecture

```text
Supabase Cron → Hono on Vercel → RSSHub / official RSS
                    ↓ Drizzle
                 Supabase
                    ↑ public RLS read
                Next.js web
```

- `apps/web`：Next.js 16、React 19、Tailwind CSS 4、React Aria Components。
- `server/api`：Hono 的 Vercel Function，通过 Drizzle ORM 写入 PostgreSQL。
- `supabase`：数据库迁移、RLS 测试和 `pg_cron`/`pg_net` 调度脚本。

浏览器和 Next.js 前端不会请求 Hono；Hono 只接收 Supabase Cron 的受保护采集请求。

## 本地开发

需要 Node.js 24+ 与 pnpm 11。克隆仓库后先安装依赖：

```bash
pnpm install
```

### 只启动前端

前端直接从 Supabase 读取已经采集的热点，不依赖本地 API。首次配置且
`apps/web/.env.local` 尚不存在时，复制示例文件：

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

填写 Supabase 项目 URL 和 Publishable Key 后启动：

```bash
pnpm --filter @rss-site/web dev
```

访问 <http://localhost:3000>，科技总览位于 <http://localhost:3000/technology>，国内新闻总览位于
<http://localhost:3000/news>，AI 平台总览位于 <http://localhost:3000/ai>，来源详情位于对应分区的
`[source]` URL。

### 启动完整开发环境

只有在本地调试 RSSHub 采集或写入 Supabase 时才需要启动 API。首次配置且
`server/api/.env` 尚不存在时，复制示例文件：

```powershell
Copy-Item server/api/.env.example server/api/.env
```

在该文件中填写 `DATABASE_URL` 和 `CRON_SECRET`。然后从仓库根目录运行：

```bash
pnpm dev
```

这会同时启动：

- Web：<http://localhost:3000>
- API：<http://localhost:3001>
- API 健康检查：<http://localhost:3001/health>

前端不会调用本地 API；两端仍然只通过 Supabase 交换数据。需要手动刷新某个来源时，另开一个
终端并把示例中的来源 ID 与密钥替换为目标值和 `server/api/.env` 内的 `CRON_SECRET`：

```powershell
curl.exe -X POST http://localhost:3001/cron/signals/xinhua -H "Authorization: Bearer <CRON_SECRET>"
```

成功响应会包含 `batchId` 和 `itemCount`。刷新网页后即可看到 Supabase 中的新数据。
若返回 `401`，检查请求密钥是否与 API 环境变量一致；若返回 `502`，检查 Feed 上游和 Supabase 数据库连接。

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

`apps/web`：

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 只受 RLS 授权的公开客户端密钥 |

`server/api`：

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler 连接串；服务端专用 |
| `CRON_SECRET` | 校验 `Authorization: Bearer …` 的随机密钥 |
| `RSSHUB_BASE_URL` | 可选，默认 `https://rsshub.app` |

不要把 `DATABASE_URL`、数据库密码或 `CRON_SECRET` 放进 `NEXT_PUBLIC_*` 变量或提交到仓库。

## Supabase setup

目标项目为 `rss-site`（ref：`pnjsrihfpyvkhyidzgfq`）。

1. 应用 `supabase/migrations` 中的迁移。
2. 可用本地 Docker 时运行 `pnpm dlx supabase test db` 验证 RLS。
3. 部署 API，并为其配置 `DATABASE_URL` 与 `CRON_SECRET`。
4. 确认 `server/api/.env` 使用相同的 `DATABASE_URL` 和 `CRON_SECRET`，然后运行：

   ```bash
   pnpm setup:cron
   ```

5. 按提示输入部署后的 Hono API 域名或完整的 `/cron/signals` 地址。

### 新增来源的云端验收门槛

新增平台时，必须先部署依赖代码和版本化迁移，再手动调用生产
`POST /cron/signals/:source` 写入已关联的云端 Supabase。确认运行成功、写入数量大于零，且
`source_status` 与 `hot_items` 中的来源、分区、标题、链接、排名和时间合理后，才允许创建或启用对应
Cron。`pnpm setup:cron` 会按这个顺序验证全部来源，任一来源失败或写入零条时不会更新 Cron。

本地 Docker/pgTAP 可以作为补充检查，但不能代替这项云端验收，也不能因为本地 Docker 未启动而跳过
云端验证。验证记录不得包含数据库连接串、Token、Vault 值或 `CRON_SECRET`。

每次上线的非敏感验证证据记录在
[`docs/development/cloud-source-validation.md`](docs/development/cloud-source-validation.md)。

该命令会幂等创建或更新 Supabase Vault 中的 API 地址和 Cron 密钥，启用 `pg_cron` 与
`pg_net`，安装十八个 UTC 每五小时错峰运行的任务和 30 天运行历史清理，并立即发起一次掘金测试
采集。重复运行会更新已有同名任务。`supabase/cron/setup.sql` 保留为手动配置和审计用的备用方案。

RLS 仅允许匿名及登录用户读取 `hot_items` 和 `source_status`；客户端不能写数据，也不能读取
`ingestion_runs` 中的内部错误。

## Vercel deployment

创建两个 Vercel 项目并连接同一个仓库：

- Web 项目的 Root Directory 为 `apps/web`。
- API 项目的 Root Directory 为 `server/api`。

分别配置上述环境变量。API 健康检查为 `GET /health`，通用采集端点为
`POST /cron/signals/:source`；`POST /cron/technology/:source` 与 `POST /cron/juejin` 在切换期间继续
兼容，新闻与 AI 来源也可分别使用 `POST /cron/news/:source` 和 `POST /cron/ai/:source`。生产配置完成前，
不要执行 Cron 脚本，以免保存无效部署地址。

更详细的设计与实施记录见
[科技多来源与 React Aria 开发文档](docs/development/technology-hot-sources.md)。
国内新闻来源与页面扩展见
[中国国内新闻来源开发文档](docs/development/domestic-news-sources.md)。
AI 官方文章来源与页面扩展见
[AI 平台官方文章开发文档](docs/development/ai-platform-articles.md)。
