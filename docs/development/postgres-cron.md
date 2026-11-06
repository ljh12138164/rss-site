# PostgreSQL Cron 与自动发布

## Background

用户明确要求用 PostgreSQL Cron 调用现有接口，并由 CI/CD 自动同步任务，替代 Python/systemd 业务调度。

## Scope

- PostgreSQL 18 镜像包含固定版本的 pg_cron、pg_net
- 任务清单与 SQL 随仓库版本发布，固定名称更新、删除过时任务
- 从受保护运行配置同步凭据，不输出或提交凭据
- 验证现有 44 个来源后关闭原 47 个业务 timer，启用数据库调度

## Out of scope

日报 ai-base 常驻执行器、异地备份与 Supabase 保活不迁移；不引入第二个日报调度，不修改来源采集行为。

## Acceptance criteria

- SQL 可查看计划、调度记录和对应 HTTP 结果
- 重复发布不重复建任务；新来源默认禁用，验收后才能启用
- CI 验证真实 PostgreSQL 18 扩展、调用、权限及任务同步
- ECS 生产只有一套业务调度启用，定时调用与目标数据核验通过

## Feasibility

沿用用户已确认方案，无新增设计审批。pg_cron 支持 PostgreSQL 18；pg_net 异步发送 HTTP，请求成功入队不代表采集成功，因此检查 HTTP 响应与业务入库结果。现有内部 database 网络可直达 web:3000，不需要开放数据库端口。

需要重建数据库容器以预加载扩展，复用现有 PostgreSQL 18 数据卷。先使用独立测试库验收，再在生产停旧调度并切换；不删除数据卷。

## Implementation

在现有工作区新建 feat/postgres-cron，继承已交付测试精简及已部署采集修复；远端 master 尚未包含这些提交，避免回退生产修复。

- 44 个来源与 3 项维护沿用 `deploy/server/business-jobs.json` 的 UTC 计划；数据库另有 202 轮询和历史清理两个内部任务
- CI 构建包含 pg_cron、pg_net 的 PostgreSQL 18 镜像，发布后事务应用版本化 SQL、固定名称同步计划和受保护凭据；已验收任务保留启用状态，新来源或更换接口默认禁用
- 移除业务 Python 执行器与 systemd 安装器；202 响应每 30 秒重试，最多 8 次；兼容 pg_net 崩溃或恢复后重用请求编号
- SQL 调度记录只代表请求入队，实际结果通过 HTTP 历史与业务数据库联合核验
- 恢复库预加载相同扩展、禁止 Cron 启动并隔离网络；以 `--clean --if-exists` 恢复，兼容生产归档重建 public schema 与测试归档复用默认 schema 两种布局

## Verification

- 本地 lint、类型检查通过，Vitest 297 通过、16 项服务集成测试因未启动本地服务跳过；发布打包 3 项检查通过
- CI 使用真实 PostgreSQL 18 与 Redis 通过全部 313 项测试、类型和 Shell 检查；[发布镜像完整验证](https://github.com/ljh12138164/rss-site/actions/runs/42157629406)通过真实扩展、定时 HTTP、重复发布、权限、启用门禁和隔离逻辑恢复
- 镜像演练修复 ICU 头文件缺失及 pg_net 0.20.0 与新 curl 的兼容问题；固定 pg_cron v1.6.7、pg_net v0.20.5 的源码提交，SQL 扩展版本分别报告 1.6、0.20.4
- 生产部署 `658e09f`，切换前后 signal_articles=61,553、hot_items=1,052、daily_reports=2，三项数量完全一致，Web/PostgreSQL/Redis 均健康
- 11:52:57 上海时间，44/44 来源通过生产 HTTP 与 PostgreSQL 数据验收，共 1,053 条；标题、URL、来源、分区、排名、文章关联与必要发布时间检查通过；3 项维护全部 HTTP 200
- pg_net 手动调用新华社 HTTP 200，批次 `59926f04-fe3e-4893-b11f-c6d92c3ac98e`：30 条热点、有效标题/链接/排名 30 条、发布时间 30 条，source_status 与批次一致
- 11:59:17 启用 47 项已验收业务任务，连同 2 项内部任务共 49/49 active；旧 47 个 timer 与 Python 脚本撤下，49 个旧文件归档于受保护切换目录；旧 Supabase active/running/queue 均为 0
- 12:00 自然调度 OpenAI 与 publication-outbox 均 succeeded、HTTP 200；OpenAI 批次 `9d178343-c0bd-425a-b26b-fe57ed420cab` 写入 20 条，标题/链接/排名/发布时间均通过，source_status 一致
- 新扩展上线后的私有 Storage 备份 `20261106T035349Z-b06f75ce350b` 已上传，5 个加密分块共 93,457,026 字节；生产隔离恢复和修正后的 CI 复查进行中

## Risks

数据库容器切换有短暂连接中断。pg_net 请求队列与响应为 unlogged，崩溃后可能丢失，业务成功以 ingestion_runs/source_status 为准。生产凭据仅由部署通道读取。
