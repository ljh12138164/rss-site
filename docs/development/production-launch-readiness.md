# 生产上线准备与门禁可靠性

## Background

PR #7 已合并，财经、游戏和信号文章持久化进入云端发布阶段。用户要求前端只有在明确认为可以上线时才配置
最终部署；届时参考 `D:\code\nextra-blog` 的 GitHub Actions 镜像交付、受限 SSH、健康检查与自动回滚，
但 rss-site 是使用 ISR 的 Next.js Node 应用，不能复用静态导出加容器 Nginx 的运行方式。

最终顺序见 [生产上线 roadmap](../roadmaps/production-launch.md)。

## Scope

- 修复真实生产门禁暴露的 RSS 部分坏条目与瞬时 5xx 问题，不生成标题、链接或发布时间。
- 收敛 P1 新表的公开数据库权限，并将回归断言加入版本化迁移测试。
- 记录 Next standalone、容器内 `pm2-runtime`、GitHub Actions 不可变镜像和受限服务器发布的最终架构。
- 保留“只有用户明确批准才创建部署配置并触发首次前端发布”的门禁。

## Out of scope

- 本轮不创建 Dockerfile、Compose、PM2 ecosystem、Nginx、SSH gate 或 GitHub Actions workflow。
- 不部署或切换前端域名，不修改 Cloudflare 优选 IP、DNS 和 Dashboard Cache Rules。
- 不自动创建 AI 事件或用假数据填充时间线。
- 不把 Hono API 或 RSSHub 合并进前端容器；它们继续独立部署。

## Acceptance criteria

- Feed 含部分无标题或无 HTTP(S) 原文的条目时，只保存剩余真实可用条目并重新生成连续排名；全部不可用时
  仍失败，不能清空现有榜单。
- `setup:cron` 只对网络异常或 HTTP 502/503/504 做两次有限退避；永久错误、零条与云端批次不一致立即失败。
- 任一来源失败时不安装扩展、不更新 Vault、不删除旧任务、不创建新 Cron。
- `anon`/`authenticated` 对持久化新表只有 SELECT 表级权限，写入与 TRUNCATE 权限均被撤销，RLS 继续限制
  只能读取已发布事件及其关联文章。
- 最终上线方案明确单实例 ISR 缓存、PM2/Docker 职责、镜像构建、秘密边界、健康检查、回滚和人工发布门禁。

## Feasibility

结论：有条件可行，条件已明确写入 roadmap。

- Next.js 16.3.4 支持 `output: 'standalone'`，生成最小 Node `server.js`；静态资源与 `public` 需要显式复制到
  standalone 目录。Monorepo 构建还需设置仓库根为 output tracing root。
- 官方自托管文档确认单实例、持久本地磁盘可直接使用 Next 文件系统 ISR 缓存；多实例需要共享缓存和 tag
  协调。首发服务器只有 2 核 2 GB，因此采用一个 Next 进程和一个容器，不启用 PM2 cluster。
- PM2 官方容器方案使用 `pm2-runtime` 作为容器前台 PID 1；Docker `restart: unless-stopped` 负责容器级恢复，
  PM2 负责 Node 进程、信号转发、内存阈值与退避重启。PM2 不同时安装为宿主守护服务。
- `D:\code\nextra-blog` 的不可变 `sha-<commit>` 镜像、`docker save` 发布包、强制命令 SSH gate、服务器
  `docker load`、配置快照、健康失败自动回滚可以复用；其静态 Nginx runtime、Early Hints 映射和静态产物检查
  不适用于本项目。
- ISR 容器更换会丢失本地缓存但不会丢数据；Supabase 是真实数据源。首发接受发布后冷缓存并小批量预热。
  若以后扩容为多个容器，必须先实现共享 cache handler 和跨实例 revalidation 协调。

## Implementation

- RSS 解析从“任一坏条目使整路失败”调整为“跳过坏条目、全部坏时失败”；可用条目按原相对顺序重新编号。
- 生产 Cron 安装器对瞬时 502/503/504 或网络异常使用 1 秒、3 秒两次退避；没有无限重试，也不重试云端
  数据核验错误。
- 新增 `restrict_public_table_privileges` 迁移，先撤销 P1 三张新表对公开角色的全部权限，再只授予 SELECT。
  pgTAP 同时检查六个公开 SELECT grant 和零个非 SELECT grant。
- 最终部署只设计不落配置：首发为 Next standalone + 单实例 `pm2-runtime` + Docker Compose + 宿主 Nginx；
  GitHub Actions 初期只有 `workflow_dispatch` 能发布，并使用 production Environment 审批。

## Verification

- 2026-09-05 云端已应用财经、游戏、P1 持久化与权限收敛四条迁移。
- P1 回填结果：`hot_items` 496 条、`signal_articles` 496 条，空 `article_id` 与来源键错配均为 0；AI 事件与
  关联均为 0，符合不使用假数据的要求。
- 六张业务表均启用 RLS；`hot_items`、`source_status` 与 P1 三张公开表对 anon/authenticated 各有一个
  SELECT grant，非 SELECT grant 为 0；`ingestion_runs` 对公开角色无 grant。
- 第一轮生产门禁前八路成功，掘金遇到一次 RSSHub 503 后停止且未更新 Cron；第二轮前 26 路成功，金十数据
  因首条 `<link/>` 为空停止且未更新 Cron。公开 Feed 证实后续仍有真实可访问文章，本分支已加入适配。
- API Vitest 54 项、Web Vitest 42 项、Biome format/lint、全仓类型检查与 Next 生产构建全部通过。
- Supabase migration 列表确认四条新迁移均已发布；迁移后 Advisors、表权限和 `cron.job` 已重新只读核验。
  pgTAP 计划已更新为 53 项，本轮没有把本地 Docker 检查作为云端验收的替代或阻塞项。

## Review

- Standards：改动保持在通用 Feed 边界、Cron 安装边界和版本化数据库权限内；没有复制来源特例，也没有
  在验证失败后产生 Vault/Cron 副作用。
- Spec：前端部署配置保持未创建；最终 roadmap 明确 Next standalone、容器内单实例 PM2、Actions 镜像交付、
  受限 SSH、回滚及用户批准门禁。
- Review fix：云端实际权限检查发现 P1 初始迁移的 `grant select` 不会撤销继承的既有表权限，因此追加显式
  `revoke all` 后再授权 SELECT，并加入 pgTAP 防回归。
- Rejected：未为金十坏条目合成链接，未无限重试上游，也未因新表刚发布就删除 Advisors 标记为 unused 的索引。
- Accepted follow-up：API 修复合并部署后重跑完整 36 路生产门禁；前端部署资产只在用户明确批准时实现。

## Risks

- 跳过坏条目会使保存条数小于上游 `<item>` 数，但不会改变剩余条目的相对顺序；云端门禁仍要求至少一条。
- API 修复部署前不能重跑完整 Cron 安装，否则金十数据会重复触发已知失败。
- 两次有限重试会增加单路最坏约 4 秒等待和额外失败批次，但相较 36 路全部重跑更可控。
- 2 GB 服务器不能在宿主构建镜像，也不应运行多 Next worker；Actions 必须交付已经构建和验证的镜像。
- Cloudflare 缓存不能感知 `revalidatePath`/`revalidateTag`；上线前必须实现并验证对应 URL 的精确 Purge。
