# HERMES

## Active objective

在 `feat/juejin-hot-feed` 上补充受控外链中间页，并调研下一批科技热点来源。

## Current state

- 首页、掘金子路由、Hono 采集服务、Drizzle 数据访问、迁移、RLS 和 Cron 脚本均已实现。
- Supabase 项目 `rss-site` 已链接，迁移 `20260904013727` 已在线应用。
- 线上 REST 验证公开热点表可匿名读取，内部采集记录不可匿名读取。
- 前端已完成桌面、390px、明暗主题与真实 Supabase 空态的浏览器验收。
- Supabase Vault 与五小时 Cron 已配置，生产采集链路已恢复可用。
- Hono 内部工厂已改名为 `src/http-app.ts`，入口直接创建 Hono 实例，后端 ESM 导入已对齐 NodeNext，
  并新增 Vercel 入口选择回归测试。
- 本地 Vercel production 构建及其生成函数的 `/health` 调用已通过。
- 当前工作分支已快进到 `origin/master`；每日 30 天运行历史清理、首页“热点跟踪”标题和
  `max-w-5xl` 公共页面容器均已实现。
- 生产配置脚本执行成功，测试采集写入 20 条热点；数据库确认五小时采集与每日清理两个 Cron 均为 active。
- 1440px 桌面、390px 移动端及浅色/深色主题验收通过；Biome、类型检查、29 项测试与生产构建通过。
- 热点列表已改为 `/out?url=...` 中转；页面不查询 Supabase 或原网站，不展示文章内容，只允许
  `http`、`https` 地址继续访问，暂不设置来源域名白名单。
- 下一批来源建议优先 GitHub 官方 Search API、Hacker News 和 V2EX；当前 RSSHub 的 GitHub Trending
  旧路由返回 404，不作为实现依赖。
- 远程 pgTAP runner 仍需要本机 Docker。

## Next action

完成差异审查，在当前分支提交、推送并创建 PR。

## Delivery constraint

不把 Supabase 密钥、数据库连接串或 Cron 密钥提交到仓库。生产 Cron 仅在 API URL 和密钥均确定后启用。
