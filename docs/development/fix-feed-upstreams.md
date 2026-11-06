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

- Next 适配器、转发器边界及现有 pipeline：15 项测试通过，API 类型检查通过
- 本地真实 STCN 采集 10 篇，约 1.2 秒，原 URL、全文及北京时间转换正确
- RSSHub Antigravity 真站解析 28 篇，中文标题和正文保留；变更路由格式与类型感知 lint 通过
- CF dry-run 和部署成功，修正版 6189d483-91c1-40be-aa3a-e62ef33f9166；ECS 使用应用 User-Agent 完整读取两路 HTTP 200：Google 20 篇/30,823 字节，Simon 15 篇/259,387 字节；最终 Next 采集门禁待完成
- Antigravity Vercel 预览部署 dpl_74MrZ2yHxgY6FrsJLyxoCaYbrBVF HTTP 200，28 篇中文内容，首篇正文 10,299 字符；已提升为生产部署，构建待完成

## Risks

来源官网后续结构可能继续变化；失败保持原有成功数据，不绕过生产门禁。完整观察与旧库清理仍沿用迁移 roadmap，不在本次执行。
