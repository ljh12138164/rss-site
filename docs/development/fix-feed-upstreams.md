# 修复采集上游链路

## Background

迁移后 Google AI、Simon Willison 的 ECS 直连出现连接重置或超时；证券时报及 Antigravity 因迁移前已有故障暂停。用户要求修复本地 RSSHub 项目，并明确证券时报可由 ECS 抓取。

## Scope

- 证券时报：现有 Next 采集入口在 ECS 请求官网列表与正文，保留来源 ID、文章原 URL、去重和存储契约
- Antigravity：RSSHub 适配官网新的语言资源入口，保留官方中文内容
- Google AI、Simon Willison：固定目标 Cloudflare Feed 转发器，保持原始 RSS/Atom 内容
- 部署后通过真实采集和目标 PostgreSQL 门禁，再恢复暂停来源的 timer

## Out of scope

其他来源、业务数据库迁移、完整 RSSHub ECS 容器、旧 API Worker、开放 URL 代理及新增运行时环境变量。

## Acceptance criteria

四个来源通过部署后的真实采集、目标库 run/status/hot_items 与内容核验；新来源任务清单的所有配置来源通过门禁后才启用 timer。

## Feasibility

证券时报 Vercel 日志确认连接官网连续 3 次 ConnectTimeoutError（每次 10 秒），未进入页面解析；同一页面 ECS 约 0.37 秒返回 200。RSSHub handler 本地真实调用也正常，因此不将网络问题伪装为解析修复。Next 增加仅用于证券时报的 HTML 转 Feed 适配器，沿用官网列表和正文选择器，避免在 ECS 新增常驻服务。

Antigravity 官网从 BaseLayout 改为 SharedHeadBootstrap，runtime 的语言字典路径改为 ../locales，import 使用反引号。配套 RSSHub 分支 feat/fix-stcn-antigravity-feeds 修改这三处匹配；真实 handler 已返回 28 篇官方中文内容。

现有账号只有模型网关和 tokenizer Worker，没有可复用的 Feed Worker。新增 rss-site-feed-relay 仅转发两个固定公开订阅，无数据库、密钥或 Cron。配置与代码位于 deploy/feed-relay，不恢复旧采集 API Worker。

## Implementation

- STCN 只允许官网数字文章路径，三篇并发抓全文；空列表或缺失正文明确失败，不用摘要冒充全文；沿用原始发布日期和文章 URL
- CF 固定目标，禁止任意路径/查询、写操作和上游重定向，不转发客户端 Cookie/Authorization；流式返回 XML，20 秒上游超时。Workers 不支持 redirect=error，使用 manual 并拒绝非 2xx，回归覆盖 302 不跟随
- 证券时报新增 cheerio 1.2.0，其他解析和写库流程复用
- 配套 RSSHub 原目录操作，不创建额外工作区

## Verification

- API 全量 176 项测试通过，三包类型检查通过，变更文件 Biome 与 ECS timer 门禁 8 项测试通过
- 本地真实 STCN 采集 10 篇，约 1.2 秒，原 URL、全文及北京时间转换正确
- RSSHub Antigravity 真站解析 28 篇，中文标题和正文保留；变更路由格式与类型感知 lint 通过
- CF dry-run 和部署成功，修正版 6189d483-91c1-40be-aa3a-e62ef33f9166；ECS 使用应用 User-Agent 完整读取两路 HTTP 200：Google 20 篇/30,823 字节，Simon 15 篇/259,387 字节；实际 Bun 请求分别 2.3 秒和 10.2 秒，均完整读完
- Antigravity Vercel 预览部署 dpl_74MrZ2yHxgY6FrsJLyxoCaYbrBVF HTTP 200，28 篇中文内容，首篇正文 10,299 字符；生产部署 dpl_BcKv7pErkoaoN2VLwcCZ1KmiPCpc READY，rss.ljhboard.cn 真实路由 HTTP 200 / 475,356 字节
- [完整 CI 42146370008](https://github.com/ljh12138164/rss-site/actions/runs/42146370008) 全部成功，包含测试、类型、部署脚本、Linux 构建及 PostgreSQL 18 应用角色镜像验收
- 镜像 sha-9136314f11c595b96919170924473c9d407ef41a 已部署 ECS，Next healthy，50/50 列表缓存预热通过；未变更数据库 schema 或运行时凭据
- 2026-11-06 09:59:21（Asia/Shanghai），全配置 44/44 来源的生产 POST /cron/signals 与 /cron/verify 全部 HTTP 200，共 1,053 条热点
- 四个修复来源均 succeeded，source_status 批次与 hot_items 一致；排名从 1 连续到条数，标题/URL/来源/专区/发布时间核验错误 0、空正文 0；Google 保留官方 RSS 的摘要内容，未额外扩展全文抓取
- 两个暂停 timer 已恢复，44 个来源加 3 项既有维护共 47/47 timer active；Next、PostgreSQL、agent 均 healthy，公开 healthz HTTP 200
- 旧 Supabase active Cron=0、排队请求=0；Cloudflare 当前仅有模型网关、tokenizer 和新 Feed 转发器，旧采集 Worker 不存在

| 来源 | 条数 | 采集耗时 | 已核验批次 |
| --- | ---: | ---: | --- |
| Google AI | 20 | 18.8 秒 | ff952870-2172-4665-9daf-8c6e620c80b5 |
| Antigravity | 20 | 8.2 秒 | c9714c8f-4ecb-49fb-8802-36565395e1f4 |
| 证券时报 | 10 | 1.3 秒 | 60eb53a4-4bc1-49c0-beae-bd36127c9d62 |
| Simon Willison | 15 | 11.0 秒 | 89eaf471-7867-451c-962f-2fef85939535 |

受保护服务器证据位于 `/opt/stacks/rss-site/migration/cron-verification-feed-fix.json`、`feed-data-quality.json`、`feed-timer-enablement.json`。启用器使用新鲜验收证据和受保护运行时中的既有 Cron secret；本次没有 schema 变更，沿用已迁移的来源和业务表。

## Review

STCN 官网链接限制、全文缺失处理、时区、去重和既有 pipeline 注入兼容已核对；转发器非白名单路径、凭据隔离、重定向拒绝有回归覆盖，真实 Workers、ECS Bun、Next 生产采集和目标 PostgreSQL 均已验证。无剩余阻塞项或接受的范围外跟进，不创建空 roadmap。

配套 RSSHub 提交 3989abdd6，仅修改三个动态入口匹配并记录真实线上证据；没有改写正常解析的 STCN RSSHub handler。

## 2026-11-06 regression

- 最终线上代码版本：b0a0473488ee73c24cc8c5eda66b63d629de859e；ECS Docker inspect 已确认使用该镜像，Next/PostgreSQL/agent healthy，50/50 列表预热成功
- 10:29:55–10:30:18（Asia/Shanghai）对新版本重新执行四路真实采集和目标 PostgreSQL 核验，全部 HTTP 200；STCN 9、Antigravity 20、Google AI 20、Simon Willison 15，共 64 条；标题、原 URL、来源、专区、连续排名、发布时间和非空内容检查错误 0
- 最终四路批次：STCN 4c3cb536-e1d1-45b1-91dd-3ad6311b1da1；Antigravity b3f2af11-810b-48ae-8097-e5747d0a7f89；Google AI 2be77041-9e9d-4147-9c67-600d1b972a04；Simon 22955ab8-d7e3-4a17-a424-c1d2295b6cad
- 10:30:55 实际启动 STCN 和 Antigravity systemd service，两者均于 10:30:56 退出 0，数据库 succeeded；并非只检查 timer 为 active。47 timer 全部 active，自然触发时间仍为 10:55、12:35
- 最后检查发现旧版本 10:10 DeepSeek、10:20 Google AI 留下的失败 unit；在新版本实际复跑两者均退出 0（10:32:28 / 10:32:24），新批次 succeeded，当前失败的业务 unit 为 0。历史失败记录保留
- 四个来源公开页面均 HTTP 200；11 月 5、6 日日报已发布，线上既有 input_snapshot/metrics/content 为 object、sources 为 array
- [完整 CI 42149942016](https://github.com/ljh12138164/rss-site/actions/runs/42149942016) success：Signals 8、API 179、Web 447，共 634 项，0 跳过；包含 PostgreSQL 18 的 4 项日报数据库测试、12 项真实 Redis 测试、类型、脚本、构建及镜像运行验收
- 线上回归证据：`/opt/stacks/rss-site/migration/feed-regression-20261106-1025.json`；部署日志 `regression-deploy.log`；systemd 的真实执行时间/退出码已核对
- Coverage defect found: CI already provisions PostgreSQL 18 and DAILY_REPORT_TEST_DATABASE_URL, but Turbo test.env omitted that existing variable. Prior CI logs confirmed 4 daily repository database tests skipped while 12 Redis integration tests ran. Forward the existing test variable; no new runtime configuration
- Enabling those tests exposed JSONB parameter double serialization: JSON.stringify output was inferred as jsonb and serialized again. Explicit text-to-jsonb conversion preserves JSON objects/arrays in freeze, publish, and metrics; existing real database tests now also assert draft and metrics values
- Actual systemd execution reproduced one STCN 10-second upstream TimeoutError (2026-11-06 10:18 Shanghai); Antigravity completed successfully. The deterministic timeout test failed before the fix. STCN now retries only TimeoutError once per page, retaining the existing timeout and concurrency; persistent errors still fail. List recovery, article recovery and bounded attempts are covered
- 新增修复已部署并完成上述线上复测；未放宽数据库约束、未重新生成已发布日报、未更改运行时凭据

## Delivery

修复已直接部署并验收。按仓库规则，由用户创建并合并两个 PR，确保以后常规发布包含修复：

- [rss-site master...feat/fix-feed-upstreams](https://github.com/ljh12138164/rss-site/compare/master...feat/fix-feed-upstreams?expand=1)
- [RSSHub master...feat/fix-stcn-antigravity-feeds](https://github.com/ljh12138164/RSSHub/compare/master...feat/fix-stcn-antigravity-feeds?expand=1)

## Risks

来源官网后续结构可能继续变化；失败保持原有成功数据，不绕过生产门禁。完整观察与旧库清理仍沿用迁移 roadmap，不在本次执行。
