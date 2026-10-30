# 取消 Bun 低内存模式

## Background

用户反馈部分页面 ISR 生成较慢，要求取消 Bun 低内存模式。当前 Dockerfile 在翻译准备脚本与 Next standalone 启动时均传入 `--smol`。

## Scope

移除 Dockerfile CMD 中两处 `--smol`，使用 Bun 默认运行模式。

## Out of scope

不修改 ISR 缓存、重验证、翻译逻辑、Bun 镜像版本或 Compose 内存限制；本轮不直接部署生产。

## Acceptance criteria

- 翻译准备脚本和 Next standalone 都由不带 `--smol` 的 Bun 启动。
- 保留准备成功后才启动服务的 `&&` 和服务进程的 `exec`。
- 核对启动命令、Compose 配置与最终差异；明确容器运行验证的实际范围。

## Feasibility

可行。现有翻译方案（`article-translation.md`）已选择 Bun 运行 standalone；本次仅移除启动参数，无新增架构或 UI 决策。仓库检索确认低内存开关只在 Dockerfile CMD 中出现。Compose 未覆盖入口命令，Web 容器内存上限仍为 1 GiB。

## Implementation

- 修改启动命令为 `bun apps/web/scripts/prepare-translation.mjs && exec bun apps/web/server.js`。
- 用户明确要求丢弃本地文件后，删除原工作区四份无关未跟踪文档；从远端最新 `origin/master`（`3ae04f9`）创建 `feat/remove-bun-smol`。

## Verification

- Bun 1.4.4 执行 Dockerfile CMD JSON 断言通过：两个进程使用默认模式，`&&` 与 `exec` 保留。
- `docker compose config --no-interpolate --no-env-resolution --quiet` 通过；配置检查未读取部署环境文件或密钥。
- 排除历史文档后，全仓启动配置检索未发现残留 `--smol`（`rg` 退出码 1，表示无匹配）。
- `git diff --check` 通过。此次仅调整容器启动参数，未重复运行与该参数无关的应用单元测试。
- Standards/Acceptance 差异审查完成：产品配置仅改动 Dockerfile 的 CMD 一行，验收条件全部满足，无阻塞项或接受的后续工作，不创建空路线图。

## Risks

默认运行模式的实际内存占用和 ISR 耗时需部署后观察。本次没有线上计时证据，不能据此认定 `--smol` 是页面慢的唯一原因。本机 Docker daemon 未运行，无法执行 Linux 镜像构建和容器 smoke test；现有 PR CI 包含镜像构建、启动及 HTTP 健康检查。
