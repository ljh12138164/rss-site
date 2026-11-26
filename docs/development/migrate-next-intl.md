# 界面国际化迁移至 next-intl

## Background

主站此前在 [site-localization.md](site-localization.md) 中通过手写 `Map<中文原文, 英文>`（`apps/web/lib/site-messages.ts`）、自研 React Context 翻译函数与手动正则插值实现中英文切换。这种方式以中文原文作为 Key，改动标点或措辞容易静默断译，也缺少标准 ICU 富文本/插值格式化和编译期词条类型校验。

## Scope

- 引入 `next-intl`（`^4.16.2`），配置 `createNextIntlPlugin`、`apps/web/i18n/request.ts` 与 `apps/web/global.d.ts` TypeScript `AppConfig` 强类型声明
- 保持既有 URL 结构、SEO、`proxy.ts` 与 137 个静态/ISR 页面缓存不变；客户端通过 `NextIntlClientProvider` 切换语言，保留「跟随浏览器 / 简体中文 / English」、`localStorage` 持久化、`document.documentElement.lang` 与 React Aria `I18nProvider` 同步
- 将 `apps/web/lib/site-messages.ts` 全面替换为结构化语义 Key 的 JSON 词典：`apps/web/messages/zh-CN.json` 与 `apps/web/messages/en.json`
- 所有客户端组件改用 `next-intl` 原生 `useTranslations` / `useFormatter` / `useLocale`；静态服务端页面通过基于 `next-intl` 的客户端桥接组件（`TranslatedText` / `TranslatedRegion` / `FormattedDate`）与富文本组件（`site-rich-text.tsx`）订阅语言切换，使用 `t.rich()` 消除碎片化拼接文案
- 将 126 个信号源描述按 `source.id` 索引至 `sources` 命名空间，将 API 错误、搜索校验与模型评测上游维度通过显式常量映射表对接到语义 Key，避免 `MISSING_MESSAGE` 报错
- 新增词典对齐与 `next-intl` 行为单测（`apps/web/lib/site-i18n.test.tsx`），删除旧 `apps/web/lib/site-messages.ts`

## Out of scope

- URL 语言前缀路由（如 `/en/...`）、服务端按 Cookie/Header 分流缓存及双语 SEO 元数据（已与用户确认保持既有 URL 与 ISR 静态缓存）
- 文章正文、预生成日报与 AI 事件内容的机器翻译机制（`mtranserver`）及 `ai-base` 摘要服务改动
- 管理后台（`/admin`）国际化

## Acceptance criteria

- `apps/web/lib/site-messages.ts` 已删除，无残留手写词典 `Map` 或手写正则插值
- 客户端与服务端公共页面均通过 `next-intl` 和 `messages/{zh-CN,en}.json` 渲染，中英文切换、「跟随浏览器」、刷新保持偏好与 AI 摘要分语言隔离行为完整保留
- 静态与 ISR 路由保持静态生成（`i18n/request.ts` 不读取 `cookies()`/`headers()`），生产构建 137 页与 `early-hints` / `sw.js` 正常
- 单测校验 `zh-CN.json` 与 `en.json` 键集合、ICU 占位符/富文本标签完全一致，且覆盖 `@rss-site/signals` 全部信号源与分区
- 全仓 `pnpm lint`、`pnpm check-types`、`pnpm test` 与 `pnpm --filter @rss-site/web build` 通过

## Feasibility

- **可行**：`next-intl@4.16.2` 原生声明支持 `next@^16.0.0` 与 `react@^19.0.0`。
- **核心技术难点与方案**：
  1. **静态/ISR 缓存保活**：`apps/web/i18n/request.ts` 仅返回静态默认配置（`zh-CN`、`zh-CN.json`、`Asia/Shanghai`），不调用 `cookies()`/`headers()`，因此 137 个 `force-static` / `revalidate` 页面不会退化为动态渲染。
  2. **运行时未知字符串防 `MISSING_MESSAGE`**：`hono-app.ts` 摘要错误、`searchValidation` 与 `leaderboard` 上游 HTML 解析出的中文维度名属于动态/外部字符串；通过显式常量映射表转为 `next-intl` 强类型 Key，未知值原样回退，避免触发 `next-intl` 的 `MISSING_MESSAGE` 异常。
  3. **既有组件单测无 Provider 包裹**：原自研 Context 带默认值，部分组件单测未包裹 Provider 且 jsdom 默认 `navigator.languages` 为 `['en-US']`；迁至 `next-intl` 后统一补齐 `SiteLanguageProvider` 包裹并显式声明测试语言环境。

## Implementation

- **依赖与配置**：在 `apps/web/package.json` 安装 `next-intl@^4.16.2`，在 `pnpm-workspace.yaml` 将可选 extractor 依赖 `@parcel/watcher`、`@swc/core` 的 `allowBuilds` 设为 `false`；在 `apps/web/next.config.ts` 接入 `createNextIntlPlugin('./i18n/request.ts')`；新增 `apps/web/i18n/request.ts` 与 `apps/web/global.d.ts`（声明 `AppConfig` 的 `Locale` 与 `Messages` 类型）。
- **结构化双语词典**：新增 `apps/web/messages/zh-CN.json` 与 `apps/web/messages/en.json`（各 `602` 个语义化叶节点 Key，按 `common`、`nav`、`sections`、`sources`、`sourcePage`、`home`、`search`、`article`、`daily`、`events`、`leaderboard`、`skills`、`following`、`readingList`、`rss`、`outbound`、`mcp`、`about`、`privacy`、`errors` 20 个命名空间组织），删除 `apps/web/lib/site-messages.ts`。
- **Provider 与桥接组件**：重写 `apps/web/components/site-language.tsx`，内部使用 `NextIntlClientProvider`、`useTranslations`、`useFormatter` 与 `useLocale`，保留 `localStorage` 偏好同步与 `document.documentElement.lang` 更新，导出强类型 `TranslatedText` / `TranslatedRegion` / `FormattedDate` 供静态服务端组件复用；新增 `apps/web/components/site-rich-text.tsx` 以 `t.rich()` 承载 `/about` 与 `/mcp` 含内联链接/`<code>` 标签的富文本段落。
- **全站迁移**：迁移 66 个页面、布局与组件（含 `SectionLayout` 按 `sectionId` 与 `sources.<id>` 查词、6 个分区 `layout.tsx`、`SiteHeader`、`RssSubscription`、`ArticleSearch`、`ArticleSummary`、`ArticleTranslation`、`EventTranslation`、`CctvVideoPlayer`、`ModelLeaderboard`、`ModelDetailView`、`SkillLeaderboard`、`DailyReportView`、`HomeDigest`、`FollowingPage`、`ReadingListPage` 等），全仓剩余旧 `UiText`/`UiRegion`/`UiDate`/`useSiteText`/`site-messages` 引用为 `0`。
- **测试补齐**：新增 `apps/web/lib/site-i18n.test.tsx` 校验双语词典 Key 与 ICU 占位符对齐、全部 7 个分区与 126 个信号源覆盖及运行时语言切换持久化；更新 7 个组件单测包裹 `SiteLanguageProvider`。
- **Roadmap 结论**：本次迁移范围完整，审查无衍生待办事项，无需创建空 roadmap。

## Verification

- `pnpm lint`（`biome check .`）：Checked `561` files，`0` errors
- `pnpm check-types`：`3/3` 包（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）全部通过
- `pnpm test`：
  - `@rss-site/signals`：`9 passed (9)`
  - `@rss-site/api`：`130 passed (130)`
  - `@rss-site/web`：`212 passed | 22 skipped (234)`（含新增 `lib/site-i18n.test.tsx` 3 项单测）
- `pnpm --filter @rss-site/web build`：Next.js `16.3.4`（Turbopack）编译与 TypeScript 校验通过，静态生成 `137/137` 页，`early-hints` 与 `sw.js` 产物正常

## Risks

- 与既有方案一致，英文浏览器在水合前仍先接收中文静态首屏 HTML，水合后立即由 `NextIntlClientProvider` 切换为英文。
- 后续新增信号源时，需在 `apps/web/messages/zh-CN.json` 与 `apps/web/messages/en.json` 的 `sources` 命名空间同步补充描述（已由 `lib/site-i18n.test.tsx` 在 CI 单测阶段强制拦截遗漏）。
