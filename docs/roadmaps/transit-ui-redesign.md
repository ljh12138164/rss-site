# 午夜搪瓷线网中枢全站 UI 重构 roadmap

## Context

Related development document: [午夜搪瓷线网中枢全站 UI 重构](../development/transit-ui-redesign.md)

## Next

### 统一导航与卡片片段抽取（Standards Accepted Follow-up）
- Value: 消除 `site-header.tsx`（桌面侧栏两组分组、移动端 4 项底部导览）、`home-digest.tsx`、`home-hot-ranking.tsx`（站内/外链标题与元信息重复分支）以及三处 `Asia/Shanghai` 日期格式器之间的重复模板，降低后续改版回归风险。
- Evidence: `Standards` 审查指出的 `site-header.tsx` L62–104 / L159–196 / L358–422、`home-digest.tsx` L10–17 & L140–173、`home-hot-ranking.tsx` L10–17 & L36–59、`hot-list.tsx` L12–19 重复代码；`rss-subscription.tsx` 与 `hot-list.tsx` 直接切片 `pathname` 解析分区 ID；`latest-overview.tsx` `HomeView` 仅作透传壳层。
- Dependencies: 等 UI 重构主干 PR 合并后独立重构，避免在视觉重构 PR 中混入无 UI 变更的重构噪音。
- Completion signal: 抽取出共用日期格式器与链接行组件并通过 `pnpm --filter @rss-site/web test`、`pnpm --filter @rss-site/web check-types`、`pnpm lint`。

### 归档与详情边缘子页视觉微调（Spec Accepted Follow-up）
- Value: 统一 `/archive/[section]/[[...source]]`、`/ai/events/archive`、`/ai/events/[slug]`、`/skills/[...skillId]` 与 `section-overview.tsx`、`article-loading.tsx` 的内层圆角（`rounded-sm`）、卡片容器边框与精简面包屑文案。
- Evidence: `Spec` 审查第 (a)(3) 项记录的 6 个细颗粒度子页残留传统 `border-y` 分割与 `首页` 面包屑样式，以及 `cover-image.tsx` 对失败 `imageUrl` 退回默认封面的兼容逻辑。
- Dependencies: 无阻塞，不改变路由与核心阅读主线。
- Completion signal: 逐页完成样式同步与桌面/移动端无溢出实测截图核查。
