# The Decoder 全文来源接入

## Background

The Decoder 全文路由已合入自建 RSSHub master，用户要求继续接入 rss-site。沿用 NVIDIA、AMD 的来源注册、采集、归档和页面路径。

## Scope

- 科技分区新增 `the-decoder`，入口 `/technology/the-decoder`，详情沿用 `/technology/the-decoder/[slug]`
- 消费自建 RSSHub `/the-decoder/news`，每批最多 30 篇，保留英文正文、图片、视频及原始发布时间
- PostgreSQL 版本化迁移扩展四个来源约束，发布时自动应用
- 注册每日四次采集计划，沿用 PostgreSQL Cron 的新来源默认禁用和生产验收门禁

## Out of scope

不改变现有页面布局、组件、翻译策略、采集解析器、旧来源计划或调度机制，不操作 Supabase Auth，不创建或合并 PR。

## Acceptance criteria

- 实际生产 RSSHub 路由匿名 HTTP 200，至少一个有效条目，全文和媒体可由现有解析器保留
- 注册表、科技来源页、归档、详情与 RSS 输出识别新来源
- 已有库和新建库都接受 `the-decoder`，原有来源及分区约束保持有效
- 新任务发布后禁用，只有生产 API 和业务 PostgreSQL 全部来源验收通过后才启用
- 本地类型、lint、测试和 Web 构建通过，分支提交并推送供用户创建 PR

## Feasibility

可行。基于已合入 PostgreSQL Cron 的最新 `origin/master`（`28c8c090cb4450c070f59f0abc4e0a4a7039f361`），在原目录创建 `feat/the-decoder-source`。Git HTTPS fetch 连接重置，使用已认证 GitHub API 读取最新 master 并导入缺失的合并对象；提交哈希、树及父提交均核验一致。

2026-11-06 匿名请求 `https://rss.ljhboard.cn/the-decoder/news` 返回 HTTP 200，30 篇，130,440 字节。源站正文已由 RSSHub 路由验证。现有解析和入库管线可直接消费 `content:encoded`，无需专用抓取器或依赖。

沿用既有科技分区设计：只增加注册表数据，不修改界面代码。来源图标使用现有来源简称回退 `TD`；加载、空态、错误、导航、桌面和移动端样式均复用共享组件。无需新增页面布局或 UI 库。

## Implementation

- `technologySources` 与 Cron 顺序加入来源，英文内容在中文简介中明确标注
- UTC `0 5,11,17,23 * * *`，北京时间每日 01:00、07:00、13:00、19:00，避开已有 NVIDIA/AMD 的分钟
- 新建 `deploy/postgres/migrations/002-the-decoder-source.sql`，只扩展来源白名单；同步 baseline 用于新库和 CI
- 发布 SQL 渲染器依次加载版本化 SQL，重复发布可安全重放；沿用现有 Cron 验收和禁用逻辑
- 既有断言数量随来源增加调整；不新增只镜像注册配置的测试

## Verification

- 全仓 lint、类型检查通过；Vitest 297 项通过，16 项依赖未启动 PostgreSQL/Redis 的服务集成测试跳过
- `pnpm build` 通过，生成 58 个静态页面；Windows Turbo 打包缓存报告既有链接路径过长警告，构建退出 0
- 实际 Feed 经现有解析器和采集函数处理，30/30 正文及原始发布时间一致、URL 唯一、排名连续，存储 HTML 保留 16 张图片和 4 个视频/嵌入；既有阅读器输出的文字与原文一致，不改变其媒体展示策略
- 注册表与生产任务清单的来源、名称及计划一致；发布 SQL 已包含新来源约束，未输出启用调用；Shell 语法与 diff 检查通过
- [本地非敏感证据](evidence/the-decoder-local-20261106.json)
- 本地 `/technology/the-decoder` 返回 HTTP 200，页面包含来源名；预览 `http://127.0.0.1:3085/technology/the-decoder`
- [完整 CI](https://github.com/ljh12138164/rss-site/actions/runs/42175281206) 验证代码 `9b915617adee4e775a9a763d91711e8cc44061d8`：313 项测试全部通过、0 跳过，类型检查、Shell 检查、PostgreSQL Cron 镜像及应用镜像构建通过
- CI 的真实 PostgreSQL 18 镜像运行验收通过：两次 SQL/任务同步、48 项业务任务默认禁用、实际定时 HTTP、权限隔离、逻辑恢复及请求编号恢复均通过；验证产物已打包。该分支的部署步骤按既有条件跳过，没有改动生产

生产采集和业务数据库回归已执行，详见下方结果。完整来源门禁与新 Cron 启用暂缓：发现作者字段遗漏，需先合并部署修复再重新采集。

## Review

已按仓库要求和验收标准复核：新来源只占用科技分区，既有来源/任务保持不变；迁移只扩展来源白名单，版本 SQL 在现有事务内按顺序重放；新 Cron 沿用默认禁用门禁。无剩余实现阻塞项或接受的范围外跟进，不新增空 roadmap。真实数据库镜像验证已由 CI 完成，生产门禁待合并部署后完成。

## Delivery

用户已合并 [PR #74](https://github.com/ljh12138164/rss-site/pull/74)，[生产发布](https://github.com/ljh12138164/rss-site/actions/runs/42175990869)成功，运行镜像 `5db97d56104f120af4c6f6f45918da04fb3eeba9`，Web/PostgreSQL/Redis 均 healthy。迁移已生效，新任务保持禁用。

## Production regression

2026-11-06 15:01 上海时间，使用受保护容器环境中的服务端 secret 调用生产 `POST /cron/signals/the-decoder`：HTTP 200，30 篇，批次 `b5571388-23d3-4dd8-af25-b62621c1baaf`，publication=revalidated。鉴权数据库核验接口返回 200、PostgreSQL 18 verified=true。

业务 PostgreSQL 确认 succeeded、source_status 指向相同批次、30 条热点及正文归档，标题、URL、technology 分区、排名 1–30 和原始日期均正确。实际 Feed 与存储正文逐篇核对，30/30 文字一致；16 张图片、4 个视频/嵌入全部保留。来源页、详情页、归档、科技 RSS 与独立来源 RSS 均为 HTTP 200。

发现作者 0/30：Feed 使用 `dc:creator`，现有解析器未识别。已在独立 `feat/fix-rsshub-authors` 分支修复并验证实际 30 篇作者；[修复记录](fix-rsshub-authors.md)。修复部署前不将回归标为全部通过，也未启用新 Cron。当前 50 个 Cron 中 49 active，新来源 inactive/unverified，旧 ECS 业务 timer 为 0。

[生产非敏感证据](evidence/the-decoder-production-20261106.json)。本次服务器核验使用 [alibabacloud-workbench-cli](C:/Users/PC/.agents/skills/alibabacloud-workbench-cli/SKILL.md)，凭据仅在生产容器中使用，没有输出、下载或提交。

## Risks

正文保持英文；官方 API 或站点结构变化可能影响上游路由。部署时扩展约束需要短暂表锁。新来源在完成生产门禁前没有自动采集数据。
