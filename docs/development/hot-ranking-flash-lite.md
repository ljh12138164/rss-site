# 热点刷新间隔与 Gemini 模型

## Background

生产热点与日报曾共用 Gemini 3.5 Flash Lite，AI Studio 的过去 28 天峰值为 18/15 次每分钟、505/500 次每日；热点失败后未发布快照。生产日报任务表的旧 `primary_model` 默认值为 3.8；11 月 5 日至 10 日成功日报的实际 `metrics.model` 均为 3.5。3.8 曾用于历史日报验证，仅保留网关白名单不能证明当前调用。

## Scope and acceptance

- 热点 Web 每 30 分钟最多发起一轮；检查频率、租约、断点续算和 48 小时数据窗口沿用现状
- 热点分析、拆分复核及生成记录统一使用 3.1 Flash Lite；后续再考虑加入 3.5
- 日报主用 3.8 Flash；可重试失败时使用 3.6 Flash，成功记录实际模型；每轮最多三次调用
- 不新增数据库迁移、数据源、前端界面或自动重试任务

## Feasibility and implementation

沿用现有刷新租约、Agent 鉴权和网关。间隔仅修改租约领取条件；切换模型不清空已有分析缓存。生产网关目前未放行 3.1，空请求在网关校验阶段返回 403，未调用 Google。先发布 ai-base 的网关白名单，再发布 Agent 和 Web。

## Verification and risks

- Web PostgreSQL 回归覆盖 20 分钟不启动、31 分钟可启动并复用分析缓存
- Web 测试 189 项通过、22 项按现有环境条件跳过；类型和改动文件格式检查通过
- 本机 Docker 未运行，完整 PostgreSQL 回归由 CI 执行
- 上线后核对第一轮生成记录中的 3.1、两轮时间间隔和完整榜单快照；项目额度和真实输出质量需生产验证

## Review

不新增界面或改动接口契约；本轮未发现需单列路线图的事项。目标分支 `master`，实现分支 `feat/hot-ranking-flash-lite`。
