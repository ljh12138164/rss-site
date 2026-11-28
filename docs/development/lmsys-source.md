# LMSYS Org Blog 接入 AI 分区

## 来源与范围

沿用[新增源工作流](../research/rsshub-route-candidates-and-workflow.md)和已有 AI 来源页、文章阅读页。自建 RSSHub 主实例已部署 [LMSYS 路由](https://rss.ljhboard.cn/lmsys/blog)，无凭据访问返回 HTTP 200，默认 20 篇，`?limit=100` 返回 100 篇全文。官方 [Sitemap](https://www.lmsys.org/sitemap.xml)提供链接和日期。备用 RSSHub 分叉等待同步本路由。

## 实现与验收

- 注册 AI 文章源 `lmsys`，公开来源页为 `/ai/lmsys`，每六小时同步一次，每批最多 20 篇。
- 阅读页显示 LMSYS 官网和 Miles 联合发布页承载的正文图片与图注，保留表格、代码块和 MathML。嵌入式媒体可通过原文访问。
- [Hugging Face PR #139](https://github.com/ljh12138164/rss-site/pull/139)的改动是本分支的基线。新迁移 `029-lmsys-source.sql` 同时覆盖两项来源，将 `028-huggingface-source.sql` 改为重放占位，并更新新装基线和发布验证夹具。业务 Cron 清单由 130 项增至 131 项。
- 合并发布后，生产试抓成功并通过数据库校验才启用任务。上线验收需检查 `/ai/lmsys` 的列表、文章详情和激活日志。

## 验证记录

- 以正式来源配置从自建 RSSHub 运行 `fetchSignalFeed`、`ingestSignal`、`renderArticleContent`，在内存捕获写入批次。20 篇均有唯一链接、作者、日期、封面和正文，站内可渲染 209 张正文图。12 篇含代码块、12 篇含表格、4 篇含 MathML，Miles 联合发布文章的配图地址正确。[样本原文](https://www.lmsys.org/blog/2026-11-19-deepseek-v41-h20/)
- 通过源码 Biome、类型检查、仓库测试、Web 生产构建、Cron SQL 生成、Bash 语法检查和 Ubuntu 发包测试。真实 PostgreSQL 重放由发布 CI 验证。
- 已按来源验收和迁移重放约定复核，无需衍生路线图。
