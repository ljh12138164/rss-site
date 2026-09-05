# rss-site 最终生产上线 roadmap

## Context

相关实施记录：[生产上线准备与门禁可靠性](../development/production-launch-readiness.md)。

前端上线由用户明确批准后才开始配置和发布。此前继续完成数据、SEO、ISR、缓存失效、sitemap 与索引通知；
Hono API 继续部署在 Vercel，RSSHub 与前端分离，Supabase 继续是唯一数据中转和 Cron 调度方。

目标拓扑：

```text
Supabase Cron → Hono API / Vercel → RSSHub / official RSS
      │                    │
      └──────────────→ cloud Supabase
                               ↑
Cloudflare → host Nginx → 127.0.0.1:18100 → Docker
                                              └→ pm2-runtime (1 instance)
                                                   └→ Next standalone server.js

GitHub Actions → verify → build rss-site-web:sha-<commit>
               → docker save release bundle → restricted SSH gate
               → server docker load / compose up / health check / rollback
```

参考 `D:\code\nextra-blog` 的 `.github/workflows/ci-deploy.yml`、`Dockerfile`、`compose.yaml`、
`deploy/server/deploy-blog` 与受限 gate。Next 运行与缓存依据
[Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)、
[standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) 和
[PM2 Docker integration](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/)。

## 上线不变量

- 未收到用户“可以部署”的明确指令前，不创建或启用生产前端部署任务。
- 生产镜像只在 GitHub Actions 构建；2 核 2 GB 服务器不安装 Node、不执行 `pnpm install`/`next build`、
  不访问 Docker Registry。
- 镜像标签必须是 `rss-site-web:sha-<40 位 commit>`，发布包与回滚都引用不可变标签。
- PM2 运行在容器内并使用 `pm2-runtime`；宿主只由 Docker Compose 管理容器，不再启动第二套 PM2 daemon。
- 首发严格单 Next 进程、单容器。没有共享 cache handler 前禁止 PM2 cluster 或横向扩容。
- 数据库写入成功是主结果；ISR、Cloudflare、预热与 IndexNow 失败分别记录，不能回滚真实抓取数据。
- 所有生产秘密只存在 GitHub Environment 或服务器受限环境文件，不写入镜像层、日志、发布包或仓库。

## Now

### 1. 完成云端来源门禁

- Value：确保 36 路来源和持久化文章在更新 Cron 前都能真实工作。
- Evidence：迁移和 496 条历史文章回填已通过；完整门禁被金十无链接条目阻断，Cron 尚未更改。
- Dependencies：合并并部署当前解析器与有限重试修复；随后从第一路重新运行 `pnpm setup:cron`。
- Completion signal：36 路均返回非零条数；批次、状态、热点、文章关联字段合理；Vault 使用正确秘密；36 个
  来源任务和 1 个保留任务 active，旧五小时任务不存在。

### 2. 完成公开内容与 SEO 发布链路

- Value：让最终服务器上线时已经具备稳定 URL、可索引 HTML 和可控新鲜度，而不是上线后再改缓存语义。
- Evidence：[SEO、缓存与索引发布 roadmap](seo-cache-and-indexing.md) 的 P2–P7 尚未完成；旧
  `feat/ai-event-timeline` 只基于 `hot_items`，需在新 P1 数据模型上重新整合，不能直接合并旧分支。
- Dependencies：按 P2 事件详情 → P3 ISR/按需失效 → P4 sitemap/robots → P5 必要的客户端缓存 → P6
  Cloudflare 精确清除 → P7 IndexNow 顺序实施。Google 普通文章仍只依赖 sitemap/Search Console。
- Completion signal：所有公开页面有服务端 HTML、canonical 与真实 metadata；AI 2 小时、辅助分区 6 小时
  ISR；抓取成功可精确失效 Next 和 Cloudflare；sitemap/robots/IndexNow 测试通过。

### 3. 形成发布候选基线

- Value：把功能开发与生产基础设施冻结在可重复验证的提交上。
- Evidence：当前生产构建仍是动态 SSR，尚未启用 standalone、healthz 或自托管配置。
- Dependencies：P2–P7 完成，迁移全部落云，运行时环境变量清单固定，用户确认正式域名。
- Completion signal：`pnpm install --frozen-lockfile`、format、lint、types、tests、build 全通过；没有未应用迁移、
  未处理安全 advisor 或假数据；用户明确给出“可以配置部署”。

## Next（只有用户批准部署后开始）

### 4. 构建 Next standalone + PM2 运行镜像

- Value：在 2 GB 服务器上只运行最小生产依赖，同时保留 ISR Node runtime。
- Evidence：Next 官方 standalone 会生成最小 `server.js`，但不会自动复制 `public` 与 `.next/static`。
- Dependencies：`next.config.ts` 设置 `output: 'standalone'`、monorepo tracing root、稳定 build/deployment ID；
  Docker 多阶段使用 Node 24，显式复制 public/static，精确固定 PM2 版本。
- Completion signal：容器以非 root 用户和 `pm2-runtime` 前台启动；ecosystem 为 fork/1 instance，设置合理的
  `kill_timeout`、退避和约 768 MB 内存重启阈值；`/healthz`、首页、分区页、事件页和静态资源均通过。

### 5. 建立人工批准的 GitHub Actions 镜像发布

- Value：服务器不构建、不拉 registry，并且每次发布可追溯到 commit。
- Evidence：nextra-blog 的 `docker save` + SSH stdin 发布包已经验证适合当前服务器约束。
- Dependencies：PR workflow 只验证；部署 workflow 初期仅 `workflow_dispatch`，使用 `production` Environment
  审批和 concurrency `cancel-in-progress: false`。不得在普通 push master 时自动发布。
- Completion signal：Actions 构建并启动临时镜像，验证 health/HTML/cache headers/静态资源；打包 image.tar、
  Compose、宿主 Nginx、deploy/gate/sudoers，以受限 SSH 标准输入传输。

### 6. 建立服务器受限发布与自动回滚

- Value：部署密钥无法获得任意 shell，失败版本自动恢复。
- Evidence：nextra-blog 已有强制命令 gate、flock、配置快照、Nginx `-t`、Compose health 和回滚范式。
- Dependencies：独立用户 `rss-site-deploy`、栈目录 `/opt/stacks/rss-site`、回环端口 18100；避免覆盖 blog 栈。
- Completion signal：gate 只接受 `deploy sha-<commit>`；发布前备份 image tag/Compose/Nginx/脚本/env；
  `docker load` 后 `compose up`，健康失败恢复旧快照和旧本地镜像；并发发布被锁拒绝。

### 7. 固定环境变量与缓存边界

- Value：镜像、运行时秘密和 CDN 行为互不混淆。
- Evidence：当前 Supabase publishable 配置由 `NEXT_PUBLIC_*` 在构建期读取；未来 revalidate/Cloudflare 凭据
  必须仅在运行时存在。
- Dependencies：正式域名确定后分类 build-time/public 与 runtime/server-only 变量；服务器 `.env` 权限 600；
  Cloudflare Cache Rule 排除 `/api/*`、`/out`、预览/认证与 RSC 变体，静态 hash 资源长期缓存。
- Completion signal：镜像历史与 Actions 日志不含秘密；容器重启能读取服务器环境；HTML 和 RSC 不串缓存；
  `revalidatePath`/tag 后同步精确 Purge 对应 Cloudflare URL。

## 首次上线执行单

### 8. 预发布

- 冻结 release commit，备份服务器受管配置和当前前端（如存在）。
- 确认 Supabase migrations、36+1 Cron、RLS/grants、API health 与 RSSHub health。
- 用 Actions 临时容器验证生产镜像；记录镜像大小、冷启动、空闲 RSS、首轮 ISR 峰值和 10 分钟稳定内存。
- 2 GB 主机必须至少保留约 512 MB 系统余量；不达标则先优化或增加内存，不带病上线。

### 9. 人工发布

- 用户在 GitHub Actions 选择 release ref 并批准 production Environment。
- Actions 通过受限 SSH 发布；服务器健康检查至少覆盖 `/healthz`、`/`、`/ai`、一个来源页、一个真实事件页、
  `/sitemap.xml` 和 `/robots.txt`。
- 首次请求允许 ISR 冷缓存；只预热首页、六个分区、sitemap 和本批次变化的少量事件 URL。

### 10. Cloudflare 与公开验收

- 用户负责 DNS、优选 IP 和 Dashboard Cache Rules；应用不改这些配置。
- 检查 TLS、HTTP/2/3、canonical、robots、sitemap、`CF-Cache-Status`、Cache-Control、RSC 导航和 404/410。
- 触发一个受控来源更新，确认 Supabase → Next revalidate → Cloudflare purge → 下一次访问新数据的完整链路。
- sitemap 在 Search Console 提交一次；IndexNow 只提交本站变化 URL，接收成功不等于保证收录。

## 回滚门槛

出现以下任一情况立即回滚到上一 `sha-*` 镜像：

- `/healthz` 或关键页面持续失败；HTML/RSC 变体串缓存；canonical 指向错误域名。
- Next/PM2 在 10 分钟内反复重启或容器持续接近内存上限。
- 新版本无法读取 Supabase，或 ISR 失效后持续返回空数据/500。
- 静态资源版本错配导致导航或 hydration 大面积失败。

数据库迁移不随镜像自动反向回滚；迁移必须保持前后兼容，数据修复另走版本化 migration。Cloudflare purge、
IndexNow 与预热失败不触发镜像回滚，但必须记录并单独重试。

## Later

### 11. 上线后一周观察

- Value：用真实流量确认 2C2G 容量与缓存收益。
- Evidence：构建期估算不能替代生产 RSS、PM2 restart、Docker memory、Next latency 和 Cloudflare hit 数据。
- Dependencies：结构化日志与最小监控可用，不引入高内存 APM agent。
- Completion signal：连续 7 天无重启风暴、OOM、缓存串流或来源持续失败；记录 p50/p95、内存峰值、
  Cloudflare 命中率、Supabase 请求量和 ISR 再生时延。

### 12. 达到扩容阈值后再引入共享缓存

- Value：支持多个 Next 进程或容器时保持一致的新鲜度。
- Evidence：Next 官方说明本地 ISR cache 和 tag 失效默认不跨实例协调。
- Dependencies：只有单实例 CPU/延迟实际成为瓶颈才评估 Redis/自定义 cache handler、共享 tag 时间戳和稳定
  Server Action encryption key；先做容量证据，不提前增加基础设施。
- Completion signal：双实例压测中同一 build ID、缓存内容和 revalidation 一致，滚动发布无版本错配。
