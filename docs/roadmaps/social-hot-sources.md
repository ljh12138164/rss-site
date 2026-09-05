# 社交热点来源 roadmap

## Context

Related development document: [社交媒体热点来源](../development/social-hot-sources.md)

## Next

### 重新评估微博与小红书的匿名公开热点

- Value：在不维护账号、Cookie 或浏览器集群的前提下补齐用户最初关心的中文社交平台。
- Evidence：当前 RSSHub 微博热搜依赖访客 Cookie/Playwright，小红书没有真实全站热榜且现有路由依赖
  Playwright 或登录态，均未通过匿名生产数据门禁。
- Dependencies：上游出现稳定、合法、无需凭据的公开接口或 RSSHub 路由，并在目标 Vercel 运行时可用。
- Completion signal：匿名探测返回非空真实榜单，部署后写入云端 Supabase 并通过字段质量核验，随后才启用
  Vault 支持的 Cron。
