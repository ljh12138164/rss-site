# SEO 后续路线图

## Context

实现与验证：[SEO 与 AI 时间轴来源优化](../development/seo-followup.md)。本轮技术改动已完成；下面是需上线或编辑数据才能评估的后续工作。

## Now

### 合并并验证线上变化

- Value: 让来源展示与索引筛选在正式站点生效。
- Evidence: 本地生产 HTML/XML 已通过验证，Web 尚未部署。
- Dependencies: 用户创建并合并 `feat/seo-followup` → `master` 的 PR，再走现有 Web 发布流程；数据库迁移已应用。
- Completion signal: 正式站三个问题样本 noindex、时间轴可见平台名称、历史分页可打开、sitemap 只包含可索引文章。

## Next

### 用站长后台观察收录与搜索词

- Value: 区分未收录、展示少和点击少，再选择内容优化目标。
- Evidence: 用户关注 Google、百度与 Bing；公开页面检查无法获得账号内的查询、覆盖率和点击数据。
- Dependencies: 上线后的稳定观察期及相应站长后台访问。
- Completion signal: 记录各引擎的收录/抓取错误、展示和点击，并以真实查询数据调整标题与选题。

### 增加经核验的中文编辑内容

- Value: 为中文读者提供原始聚合之外的解释和比较。
- Evidence: 审计发现 AI 原文多为英文，元信息优化不能替代有用的中文正文。
- Dependencies: 编辑核验来源、引用、准确性和更新时间；不批量自动生成占位内容。
- Completion signal: 少量具体主题页面发布，有真实来源、可核验解释及相关内容内链，并观察其收录/查询表现。

## Later

### 根据实测决定 Cloudflare sitemap 缓存规则

- Value: 降低边缘回源延迟，保证发布后新条目能及时出现。
- Evidence: 现网原 sitemap 为 DYNAMIC；本轮 Next XML 热缓存已验证，不能据此宣称边缘 HIT。
- Dependencies: 先上线测量冷/热请求，再评估现有 Dashboard 规则；如启用分片边缘缓存，须同时覆盖受影响分片的 purge。
- Completion signal: 实测 Cache-Status、TTFB 和发布后各分片更新均符合预期；无需变更时记录依据。
