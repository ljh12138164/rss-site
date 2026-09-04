# 热点更新

一个通过 RSSHub 汇总社区热点的轻量阅读站。当前包含科技区的掘金周榜：首页展示前五条，
`/technology/juejin` 展示完整榜单。数据约每五小时由 Hono 服务采集一次，并以 Supabase
作为前后端之间唯一的数据中转。

## Architecture

```text
Supabase Cron → Hono on Vercel → RSSHub
                    ↓ Drizzle
                 Supabase
                    ↑ public RLS read
                Next.js web
```

- `apps/web`：Next.js 16、React 19、Tailwind CSS 4、shadcn/ui。
- `server/api`：Hono 的 Vercel Function，通过 Drizzle ORM 写入 PostgreSQL。
- `supabase`：数据库迁移、RLS 测试和 `pg_cron`/`pg_net` 调度脚本。

浏览器和 Next.js 前端不会请求 Hono；Hono 只接收 Supabase Cron 的受保护采集请求。

## Local development

要求 Node.js 24+ 与 pnpm 11：

```bash
pnpm install
pnpm dev
```

也可以分别运行。API 本地开发需要预先全局安装 Vercel CLI：

```bash
pnpm --filter @rss-site/web dev
pnpm --filter @rss-site/api dev
```

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
4. 在 Supabase Vault 中保存 API URL 和相同的 Cron 密钥：

   ```sql
   select vault.create_secret(
     'https://your-api.vercel.app/cron/juejin',
     'juejin_ingest_url'
   );
   select vault.create_secret('replace-with-a-random-secret', 'juejin_cron_secret');
   ```

5. 执行 `supabase/cron/setup.sql`。计划表达式为 `0 */5 * * *`，即 UTC 每五小时触发一次。
6. 手动发起一次受保护请求，确认 `hot_items` 与 `source_status` 已有数据后再发布前端。

RLS 仅允许匿名及登录用户读取 `hot_items` 和 `source_status`；客户端不能写数据，也不能读取
`ingestion_runs` 中的内部错误。

## Vercel deployment

创建两个 Vercel 项目并连接同一个仓库：

- Web 项目的 Root Directory 为 `apps/web`。
- API 项目的 Root Directory 为 `server/api`。

分别配置上述环境变量。API 健康检查为 `GET /health`，采集端点为
`POST /cron/juejin`。生产配置完成前，不要执行 Cron 脚本，以免保存无效部署地址。

更详细的设计与实施记录见 [开发文档](docs/development/juejin-hot-feed.md)。
