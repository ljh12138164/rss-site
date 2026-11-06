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

## Verification

- 本地 lint、类型检查通过，Vitest 297 通过、16 项服务集成测试因未启动本地服务跳过；发布打包 3 项检查通过
- CI 已使用真实 PostgreSQL 18 与 Redis 通过全部测试、类型和 Shell 检查
- 镜像演练发现 ICU 编译头文件缺失及 pg_net 0.20.0 与新 curl 头文件兼容问题；补齐 icu-dev，并固定到包含上游修复的 pg_net v0.20.5 提交，继续验证

## Risks

数据库容器切换有短暂连接中断。pg_net 请求队列与响应为 unlogged，崩溃后可能丢失，业务成功以 ingestion_runs/source_status 为准。生产凭据仅由部署通道读取。
