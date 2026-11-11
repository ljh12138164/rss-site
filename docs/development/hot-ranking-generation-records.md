# 热点排行 AI 生成记录

## Background

生产 `new_group` 日志只有错误码，无法看到当时返回的分组值。用数据库保留每次热点模型调用的结果，区分生成成功、数据已纠正和调用或校验失败。

## Scope

热点分析和拆分复核各写一行 `private.hot_ranking_generations`。同一次 Agent 请求共用批次 ID，记录阶段、文章 UUID（按 `a1` 至 `a6` 的顺序）、模型、时间、耗时、状态、问题码、模型原始可见输出和截断标记。

## Out of scope

日报、文章摘要等其他模型任务、公开查询接口、管理页面、补录历史、生产部署、上游限流与重试策略。

## Acceptance criteria

- 合法结果为 `ok`，PR #19 修正的新组为 `recovered / new_group`，调用或校验失败为 `failed`
- 记录校验前的可见回复，包括非 JSON；429 或网络超时时没有模型结果则记录 null
- 每条输出最多 32 KiB，留存 7 天，不保存提示词、思考内容、鉴权头或输入正文
- 只有现有内部鉴权接口能写；Web 角色不能读取回复，运维从数据库查询；写记录失败不影响榜单计算
- 不改变热点 API 返回、模型请求格式、快照发布或来源 Cron 计划

## Feasibility

复用既有 `/api/internal/agent` 和业务数据库角色。Web 独占数据库连接，Agent 沿用已有鉴权和地址；每个模型调用结束后最多等待 2 秒写记录，分析和复核最多额外 4 秒，仍在现有 Web 单次 115 秒超时内。写入走独立事务，成功分析不会因后续复核失败而丢记录。记录是尽力写入，内部接口故障、进程终止等情况下可能缺行。

沿用热点的 UUID 契约、严格校验、拆分复核、内部服务鉴权和业务库迁移流程。此变更无 UI。相关失败证据见 11 月 10 日线上回归记录。

## Implementation

迁移 `004-hot-ranking-generations.sql` 建私有表，以 `(batch_id, phase)` 去重，时间索引用于最近记录查询和定期清理。现有保留任务删除超过 7 天的记录。Agent 在解析回复前保存第一候选的非思考文本，超限按 UTF-8 字符边界截断，NUL 转义为可见文本；记录失败只打批次 ID 和阶段日志。

运维查询示例：

```sql
select started_at, batch_id, phase, model, elapsed_ms, status, issue_code,
       article_ids, result, result_truncated
from private.hot_ranking_generations
where status <> 'ok'
order by recorded_at desc
limit 20;
```

## Verification

- Web 全量测试 189 项通过、22 项按现有环境条件跳过；类型检查、改动文件的 Biome 检查、58 页生产构建和发布脚本语法检查通过
- 本地隔离联调使用构建后的 Agent、真实 Hono 内部接口及 PGlite PostgreSQL 引擎。迁移连续执行两次；实际写入三条记录（`recovered / new_group` 原始分组、`ok` 复核、`failed / upstream_429` 无结果），重复提交不新增记录
- `rss_site_app` 查询 `result` 被拒；以应用角色执行保留语句后，八天前记录被清除，近期记录保留
- 发布镜像校验增加迁移后带鉴权入库及回复字段权限断言。本机 Docker 服务未启动，完整 Docker 发布镜像校验留给 CI；未在生产运行迁移或写入测试数据

## Review

对照规范和验收条目完成审查。表与公开数据隔离，参数化写入，源计划和排行结果不变；应用角色只允许写入及按时间清理，不允许读取模型回复。无阻塞项或已接受的代码后续项，未新增路线图。

## Risks

未启动模型的配置错误没有生成记录；上游 HTTP 失败或没有可提取的回复时只能保留问题码。表中保留模型产出的未校验文本，应当仅作运维诊断，不作为可信指令或发布材料。

## Delivery

两个仓库分支 `feat/hot-ranking-generation-records`，目标 `master`：[rss-site PR 入口](https://github.com/ljh12138164/rss-site/compare/master...feat/hot-ranking-generation-records?expand=1)、[ai-base PR 入口](https://github.com/ljh12138164/ai-base/compare/master...feat/hot-ranking-generation-records?expand=1)。先合入 ai-base PR #19，再合入记录分支。先发布 rss-site 并应用迁移，再发布 ai-base Agent。无需新凭据或新增来源 Cron。
