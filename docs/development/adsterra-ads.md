# Adsterra 广告集成开发记录

## Background

为了探索网站在低流量早期的合规变现模式，项目需接入 Adsterra 提供的两个广告单元：
1. **Native Banner（原生图文横幅）**：Placement `container-dbe8d6056eda1c6cbeb39ecf76bad967`。
2. **Banner 320x50（移动端条幅）**：Placement Key `b2067460601c71f2427a266d44f5a43d`。

站点为科技、AI 与热点资讯聚合站，需确保接入广告时不破坏现有暖色系极简设计风格、不降低 Core Web Vitals (CLS/LCP)、不干扰移动端/桌面端排版、不引起 Next.js App Router 客户端路由跳转的脚本加载异常。

## Scope

1. 新增 `AdsterraNativeBanner` 客户端组件（支持动态注入、容器清理与自适应卡片展示）。
2. 新增 `AdsterraBanner320` 客户端组件（支持 iframe 注入、预留固定高度、仅在移动端 `md:hidden` 展示）。
3. 在文章详情阅读页组件 `apps/web/components/article-reader.tsx` 中集成这两个广告单元，位于正文结束之后与“同来源文章”推荐之前。
4. 单元测试与端到端回归覆盖，验证样式在桌面端与移动端正常呈现，不产生无界面的 Hydration 错误。

## Out of scope

1. 不在首页 `/` 或各分区列表信息流中强插弹窗（Popunder）或全屏遮罩广告。
2. 不启用高风险的成人广告类型（Adult/Erotic）。
3. 不变更后端 Supabase 或 Hono API 逻辑。

## Acceptance criteria

1. **Native Banner**：在文章阅读页正文结束后平滑展示，全端（PC/Mobile）自适应，带有清晰克制的“赞助商推荐”标识。
2. **Banner 320x50**：仅在移动视口（`< 768px`）渲染，桌面端（`>= 768px`）严格隐藏，预留高度避免布局抖动（CLS）。
3. **SPA 兼容**：在 Next.js App Router 客户端页面切换跳转时，广告容器能够安全重新挂载与清理，不抛出 React Hydration 警告或 DOM 泄露。
4. **测试与质量**：全仓单元测试通过，TypeScript 类型检查无错误，Biome 代码风格检查通过。

## Feasibility

- **可行性结论**：完全可行。
- **技术瓶颈与解决方案**：
  1. **Next.js 16 (React 19) SPA 路由跳转复用问题**：采用 `useRef` + `useEffect` 动态挂载广告脚本并在卸载时清理 innerHTML，确保每次文章路由切换时触发完整的广告生命周期。
  2. **React Hydration 冲突**：广告代码严格放在 `'use client'` 组件中，容器在 SSR 时仅渲染静态占位骨架，避免客户端注入的 DOM 结构与服务端产生 mismatch。
  3. **布局抖动（CLS）**：容器预设 `min-h-[120px]`（Native）与 `h-[50px] w-[320px]`（Banner 320），防止异步加载瞬间导致页面跳动。

## Implementation

1. 创建 `apps/web/components/adsterra-native-banner.tsx`。
2. 创建 `apps/web/components/adsterra-banner-320.tsx`。
3. 修改 `apps/web/components/article-reader.tsx` 引入广告展示。
4. 编写对应的组件测试用例。

## Verification

- `pnpm --filter @rss-site/web test`: 91 个测试文件共 340 项测试全部通过（包含新增的 4 项 Adsterra 组件测试）。
- `pnpm --filter @rss-site/web check-types`: TypeScript 类型检查完全通过（0 错误）。
- `npx @biomejs/biome check`: 针对改动与新增的 4 个代码及测试文件执行 Biome 风格与质量检查，0 错误 0 警告。
- `git diff --check`: 无多余空白与换行格式问题。

## Risks

- **第三方脚本拦截**：用户的 AdBlock 插件可能会拦截广告脚本域名（如 `bauval.org`），组件需保证脚本被拦截时界面保持干净占位或静默降级，不发生白屏崩溃。
