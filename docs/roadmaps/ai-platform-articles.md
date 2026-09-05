# AI 平台文章 roadmap

Status: planned

Related development document: [AI 平台官方文章分区](../development/ai-platform-articles.md)

## P1

### 按依赖顺序上线并复核首轮采集

- Value: 确保 rss-site 第一次调用 `/deepseek/news` 时已经获得修复后的官方新闻，而不是旧路由的指南数据。
- Evidence: 本功能由 `D:\code\rss` 的 DeepSeek 修复分支和 rss-site 的 AI 分区分支共同组成；公开 RSSHub 实例在重新部署前仍运行旧选择器。
- Dependencies: 先合并并部署 RSSHub 修复，再合并 rss-site 的依赖分支与本分支，最后应用迁移并配置 18 路 Cron。
- Completion signal: 六个 AI 来源均有成功的 `source_status`，DeepSeek 最新条目 URL 以 `/zh-cn/news/news` 开头，GLM 标题不是纯日期。
