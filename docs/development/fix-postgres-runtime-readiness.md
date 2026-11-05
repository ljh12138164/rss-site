# PostgreSQL 镜像验收启动竞态

## Background

用户提供的 master 部署日志显示 PostgreSQL 18 拉取成功后，psql 报 database system is shutting down，Web 容器尚未创建。验收脚本使用默认 Unix socket 的 pg_isready，有机会命中初始化的临时服务器；该服务器关闭后才启动正式进程，因此原先的就绪判断过早。

## Scope

仅修复 deploy/server/verify-release-runtime 的数据库就绪探测和失败日志；不调整生产数据库或应用启动行为。

## Acceptance criteria

镜像验收等待正式 TCP 监听后才导入 schema；等待超时明确失败；完整 CI 的 PostgreSQL 18 应用角色及 Web 运行时检查通过。

## Feasibility

沿用已接受的 PostgreSQL 18 独立容器和应用角色方案。原脚本的本容器 TCP 探测无需发布数据库端口或新增凭据；检测结果不再依赖临时 Unix socket。原循环耗尽后仍会执行 SQL，需要补充明确的超时检查。

## Implementation

- pg_isready 显式指定 127.0.0.1，等待正式 TCP 监听
- 60 次等待后再次检查，失败则终止，不导入 SQL
- 失败时输出 PostgreSQL 日志，Web 尚未创建时不输出无关的容器不存在错误
- 原目录分支 feat/fix-postgres-runtime-readiness，基于 origin/master e8057dd

## Verification

完整 GitHub Actions 验收待执行；本机 Docker 引擎未运行。

## Risks

本次仅影响临时 CI 容器，不修改生产数据、调度或凭据。差异自审无其他阻塞项或需新增 roadmap 的后续事项。
