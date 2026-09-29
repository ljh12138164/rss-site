# 外链直接直达源站与弹窗优化（保留 /out 兼容）

## Background

线上 Umami 统计数据显示 `/out` 独立访客高达 91（占比 88%），且 99.6% 流量为 Direct。
经排查根因：
1. 之前增加外链弹窗确认（`OutboundDialog`）时，仅在前端通过 JS 拦截了点击，未修改底层 HTML 中的 `href`；
2. 全站文章列表、榜单、正文超链接与阅读器“查看原文”在服务端 SSR HTML 源码中依然被硬编码为 `/out?url=...`；
3. 网络爬虫（百度蜘蛛、各类无头浏览器 Bot）抓取 HTML 提取了这些 `/out` 链接并直接发起抓取，触发全局 `layout.tsx` 中的 Umami 与百度统计脚本，造成严重的统计污染；
4. 用户的真实预期是：点击文章通过弹窗跳转到源站文章地址，且底层 a 标签应为真实源站地址，避免中间路径污染；
5. 同时保留 `/out` 页面以兼容老版本页面、外部存量引用与用户书签。

## Scope

1. **底层链接改造**：
   - 将 `HotList`、`HomeDigest`、`GitHubRepositoryRow`、`SkillLeaderboard`、`ArticleReader` 及 `article-content.ts` 中的外部超链接，从 `/out?url=...` 改为直接使用真实源站 URL（`item.url` / `article.url`），附带 `target="_blank"`、`rel="noreferrer noopener external"` 与 `data-outbound` 属性。
2. **弹窗拦截器升级（`OutboundDialog`）**：
   - 升级 `OutboundDialog`：拦截所有带有 `data-outbound` 或跨域外链的左键单击事件，弹出“即将离开本站”确认弹窗；
   - 保持对老版本 `/out?url=...` 格式的向后兼容解析；
   - 用户在弹窗中点击“继续访问”，以 `target="_blank"` 打开源站真实地址并关闭弹窗；
   - 用户如果使用鼠标中键、Ctrl/Cmd 点击或右键新标签打开，原生新标签直达源站。
3. **保留 `/out` 兼容页面并禁用统计**：
   - 保留 `apps/web/app/out/page.tsx` 页面与既有测试，保证旧链接与降级访问可用；
   - 在 `GoogleScripts` 中排除 `/out` 路由，并给 Umami 添加 `data-before-send` 过滤器，确保任何对 `/out` 的访问（包括爬虫直接抓取）均不触发统计上报，彻底解决数据污染。
4. **测试与回归**：
   - 更新并补全 `outbound-dialog.test.tsx`、`hot-list.test.tsx`、`google-scripts.test.tsx`、`article-content.test.ts`。
   - 确保全仓类型检查、测试与生产构建通过。

## Out of scope

- 不删除 `/out` 路由（用户明确要求保留兼容旧版本）。
- 不修改 Supabase 数据库、数据源注册与 Cron 调度配置。
- 不修改非外链的站内文章路由与导航逻辑。

## Acceptance criteria

- 全站文章列表及正文外链在 HTML 源代码中为真实目标地址（`https://...`），不再暴露 `/out?url=`。
- 浏览器中左键单击外链时，正常唤起“即将离开本站”弹窗，展示目标源站 URL；点击“继续访问”在新标签页打开源站并关闭弹窗。
- 中键、Ctrl+点击外链直接在新标签页打开真实源站。
- 历史 `/out?url=...` 请求仍能正常展示中转确认并跳转源站。
- `/out` 页面不再注入或上报 Umami、Baidu Tongji 统计代码。
- 全量自动化测试与类型检查通过。

## Feasibility

完全可行。前端组件与事件委托模型清晰，通过在 `OutboundDialog` 扩充外链匹配逻辑，同时在 `GoogleScripts` 中屏蔽 `/out` 路径即可干净解决，无需改动后端与数据库。

## Implementation

1. 更新 `apps/web/components/google-scripts.tsx` 与测试，屏蔽 `/out` 路由下的统计加载，并注入 `umamiBeforeSend`。
2. 升级 `apps/web/components/outbound-dialog.tsx` 与测试，统一支持 `data-outbound` 与绝对外链拦截，兼容 `/out?url=`。
3. 更新 `apps/web/components/hot-list.tsx`、`home-digest.tsx`、`github-repository-row.tsx`、`skill-leaderboard.tsx`、`article-reader.tsx` 及 `article-content.ts`，输出真实 URL。
4. 运行全量测试、类型检查与生产构建。

## Verification

- **自动化测试用例验证**：
  - 运行 `pnpm --filter @rss-site/web test`：62 个测试文件全部通过，共 208 个测试用例全部 passed。
  - 核心回归测试覆盖：`google-scripts.test.tsx`（/out 屏蔽与 umamiBeforeSend）、`outbound-dialog.test.tsx`（弹窗拦截与直达外链）、`hot-list.test.tsx`、`skill-leaderboard.test.tsx`、`article-content.test.ts` 以及各 section 页面。
- **TypeScript 类型检查**：
  - 运行 `pnpm check-types`（Turbo 跨 3 个子包 `@rss-site/api`, `@rss-site/signals`, `@rss-site/web`）：全部通过（0 errors）。
- **生产构建验证**：
  - 运行 `pnpm --filter @rss-site/web build`：Next.js 16.3.4 (Turbopack) 成功编译，61/61 个静态页面成功生成（包含 `/out` 动态路由），Early Hints manifest 成功生成。

## Risks

- 旧浏览器或爬虫抓取到的外链直接指向第三方，符合预期并消除站内抓取负载，无安全或功能风险。
- 保留 `/out` 页面以兼容老版本页面与书签，且不再上报分析统计。
