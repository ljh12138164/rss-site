# RSSHub 作者字段回归修复

## Background

用户要求回归 The Decoder 接入。PR #74 已合入 master `5db97d56104f120af4c6f6f45918da04fb3eeba9`，[生产发布](https://github.com/ljh12138164/rss-site/actions/runs/42175990869)成功。真实采集与业务 PostgreSQL 核验返回 200，30 篇正文、日期、排名、图片及视频保留正确，但所有作者为空。实际 RSSHub Feed 使用 `dc:creator`，现有解析器只识别 `author`。

## Scope

只补充标准 RSS `dc:creator` 作者回退，保留已有 `author` 的优先级。无正文、分区、URL、数据库结构或调度改动。

## Acceptance criteria

- 缺少或空白 `author` 时读取 `dc:creator`，显式有效 `author` 保持优先
- 真实 The Decoder Feed 的 30 篇作者与上游一致
- 既有解析、采集和类型检查通过
- 新 Cron 保持禁用，修复部署后再重新采集并执行完整生产验收

## Feasibility

可行，复用现有 `extractAuthor`。从已部署最新 master 创建 `feat/fix-rsshub-authors`，在原目录工作。沿用既有来源/UI 设计，无新增界面或高影响设计决策。

## Implementation

为解析数据声明 `dc:creator`，仅当 `author` 解析为空时回退。新增一项回归测试覆盖标准作者、只有 creator、空 author 三种真实 RSS 格式。

## Verification

- 新回归用例在修复前失败：creator 两项均得到 null，标准作者保持正常
- 修复后 API 全部 114 项测试、全仓类型与 lint 检查通过；实际 The Decoder Feed 的 30/30 作者与 `dc:creator` 一致，首篇为 Matthias Bastian
- 初次生产批次 `b5571388-23d3-4dd8-af25-b62621c1baaf`，2026-11-06 15:01:03 上海时间，30 条热点和归档；`source_status` 与 succeeded 批次一致
- 30 条均有有效标题、URL、科技分区及原始发布时间，排名 1–30，正文 1,057–11,864 字符，存储 HTML 含 16 张图片和 4 个视频/嵌入，作者 0/30
- 生产源页、科技分区、归档、科技 RSS 均为 200；四个来源约束含 the-decoder；任务总数 50，49 active，新任务 inactive/unverified；旧 ECS 业务 timers 为 0
- PostgreSQL 存储正文与实际 RSSHub Feed 逐篇核对，30/30 文字一致，20 处图片/视频链接全部保留；详情页 200，独立来源 RSS 200、10 篇
- [生产回归证据](evidence/the-decoder-production-20261106.json)，修复尚未部署，生产作者仍为空，不记为回归全部通过

## Review

自审无剩余代码阻塞项或范围外接受跟进，不新增 roadmap。作者回退只使用现有提取函数，保留显式 author 的优先级；真实 RSS 样本和回归用例均通过。生产回填与全量来源门禁等待用户合并部署后执行。

## Risks

本次修复只影响作者元数据。生产作者数据需修复部署后重新采集才能回填；本地验证不能记作生产修复完成。
