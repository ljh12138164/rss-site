# 热点更新

一个通过 RSSHub 汇总社区热点的轻量阅读站。科技区当前包含 GitHub Trending、Hacker News、
掘金、V2EX、IT之家和 36氪：首页展示每个来源的一条信号，`/technology` 展示六路总览，
`/technology/[source]` 展示独立完整榜单。数据约每五小时由 Hono 服务采集一次，并以
Supabase 作为前后端之间唯一的数据中转。

## Architecture

```text
Supabase Cron → Hono on Vercel → RSSHub
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

访问 <http://localhost:3000>，科技总览位于 <http://localhost:3000/technology>，六个来源详情
位于对应的 `/technology/[source]` URL。

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
curl.exe -X POST http://localhost:3001/cron/technology/github -H "Authorization: Bearer <CRON_SECRET>"
```

成功响应会包含 `batchId` 和 `itemCount`。刷新网页后即可看到 Supabase 中的新数据。
若返回 `401`，检查请求密钥是否与 API 环境变量一致；若返回 `502`，检查 RSSHub 地址和
Supabase 数据库连接。

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

5. 按提示输入部署后的 Hono API 域名或完整的 `/cron/technology` 地址。

该命令会幂等创建或更新 Supabase Vault 中的 API 地址和 Cron 密钥，启用 `pg_cron` 与
`pg_net`，安装六个 UTC 每五小时错峰运行的任务和 30 天运行历史清理，并立即发起一次掘金测试
采集。重复运行会更新已有同名任务。`supabase/cron/setup.sql` 保留为手动配置和审计用的备用方案。

RLS 仅允许匿名及登录用户读取 `hot_items` 和 `source_status`；客户端不能写数据，也不能读取
`ingestion_runs` 中的内部错误。

## Vercel deployment

创建两个 Vercel 项目并连接同一个仓库：

- Web 项目的 Root Directory 为 `apps/web`。
- API 项目的 Root Directory 为 `server/api`。

分别配置上述环境变量。API 健康检查为 `GET /health`，采集端点为
`POST /cron/technology/:source`；`POST /cron/juejin` 在切换期间继续兼容。生产配置完成前，
不要执行 Cron 脚本，以免保存无效部署地址。

更详细的设计与实施记录见
[科技多来源与 React Aria 开发文档](docs/development/technology-hot-sources.md)。
