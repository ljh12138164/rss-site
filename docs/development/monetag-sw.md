# Monetag 域名验证与 Service Worker 集成开发记录

## Background

由于 Adsterra 存在最低提现额过高（电汇 $1000 且易受外汇管制拦截）、中文流量转化差及广告体验问题，用户决定将其彻底下线，转向对国内结汇更友好的 Monetag（原 PropellerAds，支持 Payoneer 20 美元起提）。
Monetag 域名所有权验证要求在网站根目录提供特定 `sw.js` 文件（ZoneId 12146646），同时该文件兼作其多格式广告（Multitag）的推送工作线程。由于本项目采用 Next.js + Workbox 自建离线缓存与 PWA 兜底能力，`sw.js` 属于构建期由 Workbox 生成并被 Git 忽略的产物，若直接放置静态文件会在每次构建打包时被冲掉。因此需要将 Monetag 的服务线程脚本无缝集成进 Workbox 生成流程中。

## Scope

1. 彻底移除全站所有 Adsterra 广告组件与引用（`adsterra-native-banner`、`adsterra-banner-320` 及其单元测试，清理 `ArticleReader` 正文后挂载逻辑）。
2. 在 `apps/web/scripts/generate-service-worker.mjs` 中接入 Monetag Service Worker 注入逻辑，确保在 Workbox 离线缓存规则生成后自动注入 Monetag 验证与工作线程配置头。
3. 确保在本地开发、Vitest 测试、Docker 构建以及生产环境中，`/sw.js` 均可稳定返回包含 `3nbf4.com` 与 `zoneId: 12146646` 的脚本内容，同时完全保留原有的页面与静态资源离线缓存能力。

## Out of scope

1. 具体的 Monetag 前端广告标签（如 Native Banner / In-Page Push）组件渲染（等待域名验证通过后在 Monetag 控制台生成对应 Zone Tag 再行接入）。
2. 后端 API 变更、数据库迁移及 Cron 配置。

## Acceptance criteria

- `ArticleReader` 中不再残留任何 Adsterra 组件及样式，删除废弃广告组件及测试。
- `apps/web/scripts/generate-service-worker.mjs` 具备幂等的 Monetag snippet 注入逻辑。
- `/sw.js` 在构建产物中开头包含 Monetag 的 `self.options`、`self.lary` 和 `importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')`。
- Workbox 的页面离线缓存、静态资源缓存和预缓存功能不受任何破坏。
- 全站 90 个测试文件、337 项单元测试全部通过，TypeScript 类型检查无错误，Biome 格式化校验通过。

## Feasibility

完全可行。
1. `workbox-build.generateSW` 在生成完整运行时脚本后，通过文件系统将 Monetag 头内容前置拼接，既能满足 Monetag 爬虫对静态文本特征的校验，也能在浏览器注册激活时并行执行两者。
2. Next.js `next.config.ts` 已经配置了 `/sw.js` 响应头 `Cache-Control: no-store`，确保更新与验证请求实时透传。

## Implementation

1. 移除 `apps/web/components/adsterra-banner-320.tsx`、`apps/web/components/adsterra-native-banner.tsx`、`apps/web/components/adsterra-ads.test.tsx`。
2. 从 `apps/web/components/article-reader.tsx` 中剔除两个广告组件的引入与渲染。
3. 在 `apps/web/scripts/generate-service-worker.mjs` 中导出 `MONETAG_SW_SNIPPET` 与 `injectMonetagSnippet(swPath)`，并在脚本 CLI 执行阶段自动注入。
4. 在 `apps/web/scripts/generate-service-worker.test.mjs` 中添加针对 `injectMonetagSnippet` 注入内容与幂等性的单元测试。
5. 执行生成脚本，确保本地 `apps/web/public/sw.js` 同步包含最新整合脚本。

## Verification

1. `pnpm --filter @rss-site/web test`: 90 个测试文件共 337 项测试通过（包含新增的 Service Worker 注入测试）。
2. `pnpm --filter @rss-site/web check-types`: TypeScript 类型检查无报错。
3. `pnpm biome check apps/web/scripts/generate-service-worker.mjs apps/web/scripts/generate-service-worker.test.mjs apps/web/components/article-reader.tsx`: 0 错误 0 警告。
4. `node apps/web/scripts/generate-service-worker.mjs`: 执行成功，生成 `apps/web/public/sw.js`，前 6 行精确包含 Monetag 验证脚本，后续紧接 Workbox 运行时。

## Risks

Monetag 提供的 Service Worker 脚本依赖从海外 CDN `https://3nbf4.com` 拉取。对于纯国内网络环境的部分读者，该 CDN 可能受到轻微网络波动影响。但由于 Service Worker 执行失败不会中断主页面加载与阅读，风险可控。
