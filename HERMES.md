# HERMES

## Active objective

在 `feat/juejin-hot-feed` 上交付“热点更新”门户的首个科技来源：掘金本周热门。

## Current state

- 首页、掘金子路由、Hono 采集服务、Drizzle 数据访问、迁移、RLS 和 Cron 脚本均已实现。
- Supabase 项目 `rss-site` 已链接，迁移 `20260904013727` 已在线应用。
- 线上 REST 验证公开热点表可匿名读取，内部采集记录不可匿名读取。
- 前端已完成桌面、390px、明暗主题与真实 Supabase 空态的浏览器验收。
- 远程 pgTAP runner 仍需要本机 Docker；Cron 需要在 API 部署后配置 Vault 才能启用。

## Next action

运行最终全量门禁和双轴自审，提交文档，推送功能分支并创建 GitHub PR。

## Delivery constraint

不把 Supabase 密钥、数据库连接串或 Cron 密钥提交到仓库。生产 Cron 仅在 API URL 和密钥均确定后启用。
