# HERMES

## Active objective

在 `feat/juejin-hot-feed` 上实现“热点更新”门户的首个科技来源：掘金本周热门。

## Current state

- 用户确认本地 `main` 为当前基线；远程仓库尚未创建。
- 模板清理已在 `main` 提交为 `8e31d34`。
- 架构、路由、UI 范围、shadcn 使用和信号橙红主题已经确认。
- 设计文档待用户审阅。

## Next action

用户审阅 `docs/superpowers/specs/2026-09-03-juejin-hot-feed-design.md` 后，创建详细实施计划并按 TDD 实现。

## Delivery constraint

没有 `origin`，因此当前只能完成本地分支和提交。用户创建远程并添加 `origin` 后才能 push、
创建 GitHub pull request 和检查远程 CI。
