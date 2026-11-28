# Hugging Face Blog 接入 AI 分区

## 来源与范围

[RSSHub 待新增路由候选与标准化交付工作流](../research/rsshub-route-candidates-and-workflow.md)已将 `/huggingface/blog` 列为可直接接入的全文源。本次采用已有的 AI 来源页和正文阅读页，复用现有 RSSHub 路由及生产验证流程。

2026-11-28 无凭据探测时，[官方 RSS](https://huggingface.co/blog/feed.xml) 返回 HTTP 200，前 20 条只有题目、链接和时间等元数据。[自建 RSSHub 主实例](https://rss.ljhboard.cn/huggingface/blog?limit=20)和[备用实例](https://rss1.ljhboard.cn/huggingface/blog?limit=20)均返回 HTTP 200，并提供正文。当前路由返回 Hugging Face Blog 主列表的一页，含官网团队和受邀组织文章。近期样本为 14 篇，单批最多入库 20 篇。

## 实现与验收

- 注册 AI 文章源 `huggingface`，公开来源页为 `/ai/huggingface`，RSSHub 走默认主实例，每六小时同步一次。
- 阅读页保留正文、代码块、表格和 Hugging Face 域名下通过 HTTPS 提供的正文图片及图注。第三方图片和嵌入内容可通过原文查看。
- `028-huggingface-source.sql` 更新四项来源约束，`024-supabase-source.sql` 改为重放占位，同时更新新装基线和生产发布验证夹具。业务 Cron 清单由 129 项增至 130 项。
- 合并后，生产发布流程试抓并核对写入，验证通过后启用任务。生产验收需检查 `/ai/huggingface` 列表、文章详情和激活日志。

## 验证记录

- 使用正式来源配置和线上 RSSHub 运行 `fetchSignalFeed`、`ingestSignal` 和 `renderArticleContent`，将入库批次捕获到内存。14 篇均有唯一原文链接、正文、日期、作者、封面。正文含 32 张站内可渲染图片，覆盖 9 篇，另有 11 篇含代码块、10 篇含表格。[样本文章](https://huggingface.co/blog/video-trainium3)
- 通过 Biome 项目源码检查、类型检查、仓库测试和 Web 生产构建。通过 Cron SQL 生成检查、Bash 语法检查及 Ubuntu 下的 8 项发包测试。真实 PostgreSQL 约束重放交由 GitHub 发布工作流验证。
- 实现按来源验收和现有迁移约定复核，无需衍生路线图。
