# 审计修复后续路线图

## Context

开发与验证：[Impeccable 审计修复](../development/impeccable-audit-fixes.md)。四项界面问题已完成；以下是构建验证中发现的基线问题。

## Now

### 恢复 Next 生产构建的路由类型校验

- Value：恢复可靠的生产构建与发布前检查。
- Evidence：本分支 Webpack 编译成功，17 个既有路由的额外导出触发 TS2344；将本次改动模块替换为 `origin/master` 后同样报错。
- Dependencies：单独梳理 page/route 的可测试视图和辅助函数导出边界；维持已有测试及路由行为，不通过忽略类型错误绕过检查。
- Completion signal：默认生产构建的类型阶段通过，真实数据条件下完成预渲染、early-hints/service-worker；相关页面和 RSS 回归通过后再发布。
