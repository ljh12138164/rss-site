# 业务数据库迁移

## Background

2026-11-05，用户确认迁到服务器独立 PostgreSQL，复用 Drizzle，仅 Next 服务端应用直连，暂留 Supabase Auth。迁移计划见 [roadmap](../roadmaps/business-postgres-migration.md)。实施基线 origin/master 046a949，分支 feat/business-postgres-migration。用户明确要求只保留原 rss-site 目录；迁移改动已集中回原目录，不再创建额外工作区。

## Scope

业务读写、采集与维护入口迁入 Next；业务表与数据库行为迁到独立 PostgreSQL 18；ECS 接管 Supabase 业务定时任务；Supabase 保留 Auth 和私有 Storage 备份桶，并增加 ECS 保活查询。ai-base 日报仓库改用鉴权 HTTP 接口。移除 rss-site Cloudflare API Worker，不部署整套 Supabase。

## Out of scope

整套 Supabase、自建登录、UI 改版、修改文章保留期限及博客数据库实例。

## Acceptance criteria

- 应用层只有 Next 持有业务数据库凭据，数据库不对公网开放
- 保留公开查询、分页、管理员授权、编辑锁、采集、日报及缓存通知行为
- 所有旧业务调度都有新任务映射，真实来源验收后才启用新调度
- 导入数据一致、异机备份可恢复、切换与回滚有明确写入冻结边界
- 保留 Supabase Auth，ECS 每小时轻量数据库查询；按用户要求不额外记录保活日志

## Feasibility

既定方案可行，沿用本次对话已确认 roadmap，无 UI 变更。Drizzle 当前用于采集侧，Web 仍使用 Data API；必须改查询而非仅换连接字符串。source schema 未覆盖全部运行时列及日报表，SQL 函数与触发器必须保留并解除平台依赖。

只读云端核对：14 张 public 业务表，44 个来源 Cron、文章/采集保留清理与 Cron 日志清理共 46 项 active。存在 auth.uid()/auth.jwt()、Vault、pg_net、pg_cron 依赖。ai-base DailyReportRepository 使用 postgres 直连、持久租约与原子发布，不能只切换 Web。

服务器可用空间约 19 GB；内存仅有单次采样，负载验证前不判定容量已验收。Next 共用小连接池，数据库独立容器设资源限额；先演练再生产切换。Supabase 免费项目保活请求只能降低暂停概率，不是官方可用性保证。

## Implementation

进行中。源库、线上应用与现有 Cron 尚未切换。

### Supabase 每小时保活

按用户要求，ECS 已安装并启用 rss-site-supabase-keepalive.timer，每小时整点读取 Supabase source_status 的一个公开 source 字段，不写数据库。脚本仅从现有 runtime.env 读取公开项目配置，不使用管理员会话或数据库密码。单次请求超时 10 秒，最多 3 次尝试；不额外保存执行日志，service 的 StandardOutput/StandardError 均为 null。

迁移后保留云端 source_status 作为静态探测元数据及既有只读 RLS，不能连同其他旧业务表删除。该保活任务运行在 ECS，不能迁回 Supabase Cron。免费项目保活不构成官方免暂停保证。

## Verification

- 初始工作区已检查；本次迁移的 5 个文件已复制回原 rss-site 并逐个核对内容一致；历史缓存工作区无未提交改动，历史分支提交保留
- 云端元数据核对完成；Cookie 维护状态在服务器进程内读取并加密导入目标 private schema，未输出或提交明文
- 本文不将待实施项目记为通过
- 2026-11-05 约 10:03 北京时间：保活 service 首次真实数据库只读查询执行成功，Result=success、ExecMainStatus=0；timer enabled，下次 11:00；StandardOutput=null、StandardError=null。脚本 Python 语法检查通过

## Risks

主要边界为编辑身份上下文、跨仓日报读写、长任务重启恢复、删除通知、生产写入冻结与新旧调度互斥。变更必须经类型、行为、真实库和部署验证后再切换；PR 按仓库规则由用户创建和合并。

### Docker Compose 与演练

- PostgreSQL 纳入根目录 compose.yaml，与 Redis 一起部署，镜像 postgres:18-alpine，内存上限 256 MB
- 数据卷 rss-site-postgres18-data 显式标记 external，防止 Compose 删除数据卷；postgres 仅连接内部 database 网络，web 连接该网络，不发布 5432 端口
- postgres.env 仅用于数据库初始化凭据；runtime.env 的 DATABASE_URL 使用独立应用角色，主机名 postgres；两类真实凭据均忽略提交
- 发布包同时携带 PostgreSQL 镜像；部署前检查受保护凭据文件和现有数据卷
- 现有演练容器仍独立运行，正式接管前必须停用演练容器，再由 Compose 挂载同一数据卷，禁止两个实例同时挂载
- 演练快照 14 张业务表逐表行数一致，包括 signal_articles 60,157 行、hot_items 1,051 行、source_status 44 行；源库仍在正常写入，正式切换需重新冻结并同步
- Web 查询改造相关 8 个测试文件共 39 项通过，类型检查通过；Compose 静态配置校验通过

- 2026-11-05：Web 全量测试 415 通过、12 跳过；变更 TypeScript/JSON 的 Biome 检查通过，类型检查通过，git diff --check 通过
- ECS 隔离校验目录执行发布打包测试 3 项通过，部署脚本 bash -n 通过，Compose 静态配置校验通过；该验证没有启动或替换生产容器

### PostgreSQL 18 目标调整

- 按用户要求，迁移目标改为 postgres:18-alpine；Compose、发布镜像打包、部署预检和迁移客户端版本保持一致
- 18 官方镜像挂载点为 /var/lib/postgresql，默认 PGDATA 为 /var/lib/postgresql/18/docker
- 使用独立 rss-site-postgres18-data 数据卷、rss-site-postgres18 演练容器和 target18.env 凭据文件，保留原 PostgreSQL 17 演练容器及数据卷
- PostgreSQL 18 已重新完成逻辑恢复：14 张业务表行数一致，signal_articles 60,157、hot_items 1,051、source_status 44；源库仍有写入，这不是最终切换快照
- 官方依据：https://github.com/docker-library/docs/blob/master/postgres/content.md 与 https://www.postgresql.org/docs/18/pgupgrade.html
- PostgreSQL 18 配置校验：本地和 ECS 的 Compose 静态校验通过；ECS 发布打包测试 3 项通过；部署 Bash 语法和迁移 Python 语法检查通过

### 当前实现与验收

- Web 公开查询、分页、搜索、管理员读写已迁入 Drizzle/SQL；Supabase 客户端保留身份认证用途
- Next Node runtime 承载采集 Hono 应用、`/api/mcp`、维护任务及 `/api/internal/agent`；内部接口使用 AGENT_SERVICE_TOKEN，ai-base 不再需要业务 DATABASE_URL
- 日报 SQL 仓库迁入 Web，保留冻结快照、持久租约、原子发布、失效 token 拒绝和通知重试
- Cookie 状态采用 AES-256-GCM 加密，单独提交轮换状态以保留未完成发布的恢复路径；源库 46 项任务和 Cookie 状态已捕获
- 删除触发器改为持久 publication_outbox，成功完成缓存失效与发布后才确认；失败延迟重试
- 列表页改为动态服务端渲染，避免构建阶段依赖私有数据库；继续使用 Redis 列表缓存和详情页 ISR。这是本次迁移的页面渲染行为变化
- PostgreSQL 18 真实库检查通过：普通应用角色、Drizzle 采集事务、时间字段、编辑锁与人工标题保护、删除 outbox、8 个并发提交归并为同一日报任务、唯一抢占者、冻结/续租/过期接管、旧 token 拒绝、单次原子发布、通知及内部接口 401/200
- Web 全量 429 项通过、16 项跳过，API 165 项、ai-base 94 项通过，类型与 Web/Nest 构建通过。构建阶段无 DATABASE_URL。用户明确要求跳过剩余镜像演练；Linux 构建工作流仅生产镜像，不重复运行验证

### Supabase Storage 备份

- 用户确认使用 Supabase 私有存储桶，不新增 OSS 服务
- `postgres-backup.py` 将 pg_dump 流加密为最多 20 MiB 的 AES-256-GCM 分块，manifest 最后上传；保留最新 5 份完整快照，总加密文件预算 800 MiB，失败保留已有完整备份
- 密钥独立于数据库与 Storage 保存；同时需要异机保留 MAINTENANCE_ENCRYPTION_KEY 以恢复 Cookie 状态
- timer 计划每日北京时间 03:00；真实上传、下载和独立 PostgreSQL 18 恢复核对通过后才允许启用
- 本地备份回归 7 项通过：分块恢复、损坏检测、认证失败、拒绝覆盖输出、导出失败清理、5 份保留和空间预算
- 服务器实际加密/解密及独立 PostgreSQL 18 恢复通过：91,040,955 字节、5 个加密分块，14 张 public 业务表和 2 张 private 内部表行数全部一致。测试库及明文恢复文件已清理；证据在受保护迁移目录 backup-local-restore-evidence.json。此验证不包含 Storage 上传
- Supabase 连接恢复，私有桶 postgres-backups 已创建，public=false，storage.objects 已启用 RLS 且没有公开策略
- 实际 Storage 上传、下载、解密及独立 PostgreSQL 18 恢复全部通过：91,040,955 字节、5 个分块，16 张表行数一致；普通应用角色读取通过，快照 20261105T035659Z-ccb5b024f74e。测试库和明文归档已清理
- 备份密钥与 Cookie 状态密钥已独立保存到本机受保护目录；服务器备份脚本与 timer 已安装，正式切换后启用
- 按用户要求减少变量：备份只需 SUPABASE_STORAGE_KEY，复用 runtime.env 的公开 Supabase 地址，桶名固定；Vercel 项目和团队 ID 固定，采集复用 SITE_URL；只新增必要的业务连接与状态加密密钥，其余密钥从原服务迁入
- setup:cron 已改为通过 Next 采集与受保护的目标库验收接口生成证据，不持有数据库凭据，不操作 Supabase 扩展或 Vault；ECS 门禁回归 8 项通过

### 尚未完成的切换条件

- 源库仅 44 个活跃来源，代码注册 45 个来源；chatgpt 未在源库启用，迁移时不得未经门禁直接启用
- 完成两个应用的 Linux 镜像构建；用户已要求跳过镜像演练。outbox 失败重试、同步发布与内部日报传输回归已经通过
- 停止旧 Cron、旧 Worker、后台编辑及 agent-service 写入，等待在途任务结束后导入最终快照，再接管 Compose 数据卷并部署两个应用
- 替代采集/MCP/维护入口验收后移除旧 rss-site API Worker 和 Hyperdrive；目前旧生产写入与调度继续运行
