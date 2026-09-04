# HERMES

## Active objective

在 `feat/juejin-hot-feed` 上交付“热点更新”门户的首个科技来源：掘金本周热门。

## Current state

- 首页、掘金子路由、Hono 采集服务、Drizzle 数据访问、迁移、RLS 和 Cron 脚本均已实现。
- Supabase 项目 `rss-site` 已链接，迁移 `20260904013727` 已在线应用。
- 线上 REST 验证公开热点表可匿名读取，内部采集记录不可匿名读取。
- 前端已完成桌面、390px、明暗主题与真实 Supabase 空态的浏览器验收。
- Supabase Vault 与五小时 Cron 已配置；首次采集暴露 Vercel 错误选择 `src/app.ts` 为入口的问题。
- Hono 内部工厂已改名为 `src/http-app.ts`，入口直接创建 Hono 实例，后端 ESM 导入已对齐 NodeNext，
  并新增 Vercel 入口选择回归测试。
- 本地 Vercel production 构建及其生成函数的 `/health` 调用已通过。
- 远程 pgTAP runner 仍需要本机 Docker。

## Next action

等待 Vercel 自动部署入口修复，然后验证线上 `/health` 并重新执行真实采集。

## Delivery constraint

不把 Supabase 密钥、数据库连接串或 Cron 密钥提交到仓库。生产 Cron 仅在 API URL 和密钥均确定后启用。
