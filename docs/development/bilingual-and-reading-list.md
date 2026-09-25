# 双语段落对照阅读与本地稍后读/历史足迹 (P1 交付)

## Background

用户提出后续产品功能路线图，明确划分：
- **P1**：双语段落对照阅读模式、零后端负担的「稍后读」与「历史足迹」
- **P2**：AI 核心观点速读、每日早报 / 晚报自动化推送
并要求**本阶段只实现 P1 的内容**。

通过落实 P1，可显著增强 `rss-site` 在科技资讯与技术博客领域的深度研读体验，以及日常扫读热点时的收藏与足迹回顾能力，同时坚持极简工程原则（Ponytail：零不必要依赖、零后端数据库负担、极低维护成本）。

## Scope

1. **双语段落对照阅读模式 (Bilingual Paragraph-by-Paragraph Reading Mode)**：
   - 在 `ArticleTranslation`（文章详情）与 `EventTranslation`（事件详情）中支持「原文 / 双语对照 / 仅译文」三态切换。
   - 双语模式下：
     - 标题：英文原标题在上，中文译文在下并置展示。
     - 正文内容：以块级段落（`<p>`, `<h2>`, `<h3>`, `<blockquote>`, `<li>` 等）为单位进行上下穿插对照（原文在前，中文译文在后并以优雅的次级字重与衬线高亮边框引导呈现）。
     - 纯摘要类文章：原文摘要与中文译文摘要块级并排/上下对照。
2. **零后端负担的「稍后读」与「历史足迹」 (Local Read Later & History)**：
   - 纯客户端基于原生 `localStorage` 与 `CustomEvent` 实现响应式状态管理（无第三方状态库引入）。
   - 数据模型包含稍后读书签集合与历史足迹集合（LRU 限制最多 100 条）。
   - 提供核心纯函数与 Hook `useReadingList`：`isSaved`, `toggleSave`, `markRead`, `hasRead`, `clearSaves`, `clearHistory` 等。
   - 新增页面 `/reading-list`：
     - 复用 `SiteShell`，支持「稍后读」与「历史足迹」双标签页切换。
     - 支持快捷直达原文、阅读器跳转、单条移除、一键清空及精致的空状态提示。
   - 交互整合：
     - `SiteHeader` 顶部动作栏增加「稍后读」入口与未读数量动态小红点/角标。
     - `ArticleReader`（文章阅读器顶部/底部）提供一键加入/移出稍后读按钮。
     - 文章详情加载即自动静默记录至历史足迹。
     - 热点列表针对已读历史条目赋予优雅柔和的已读视觉反馈。
3. **自动化测试与质量保障**：
   - 编写本地存储管理与 Hook 的单元测试。
   - 编写双语段落对照组件单元测试。
   - 编写 `/reading-list` 页面渲染测试。
   - 保证全仓 100% 测试通过、0 类型错误、0 Biome 告警。

## Out of scope

- P2 的 AI 观点速读 (TL;DR) 与定时早晚报推送。
- 用户注册/登录系统及云端数据库同步（严格践行 YAGNI，零后端数据库开销）。
- 更改服务端 MTran 翻译引擎或新增外部翻译依赖。

## Acceptance criteria

1. **双语模式**：
   - 翻译成功后默认直接进入「双语对照」模式，并允许通过分段控制器在「双语对照」、「仅译文」、「仅原文」之间自由切换。
   - 正文段落实现一一穿插对照，HTML 标签格式保持纯净无损。
2. **稍后读**：
   - 在文章详情页点击书签按钮可立即保存/移除，无需刷新页面，各组件状态秒级同步。
   - 导航栏实时反映当前收藏总数；访问 `/reading-list` 能列出全部已存文章并可操作。
3. **历史足迹**：
   - 访问文章阅读页自动记入足迹；同一文章重复访问更新访问时间戳，历史上限严格限制 100 条。
4. **架构合规**：
   - 无任何 SSR 水合（Hydration）告警或 LocalStorage 在服务端执行报错。
   - 全仓测试、TypeScript 类型与 Biome 规范 100% 绿灯。

## Feasibility

- **段落对照算法**：客户端利用原生 `DOMParser` 解析服务端清洗后的 `contentHtml` 与 `translatedHtml`，按子节点对应拆分包装。若两端块级数量一致则精确配对，若不一致则按段落序列平滑容错，开销通常小于 5ms，无重型依赖。
- **存储与同步**：`localStorage` 容量限制 5MB，100 条热点元数据仅占用约 20KB，且通过全局 `window.dispatchEvent` 实现多组件、多标签页无感知同步。
- **性能与安全**：所有 HTML 依然走 `renderArticleContent` 的服务端安全白名单，客户端不引入任何未过滤的富文本。

## Implementation

- `apps/web/lib/reading-list.ts`：纯客户端本地存储抽象与操作 API，包含安全读写、大小截断与事件分发。
- `apps/web/components/reading-list-context.tsx`（或 Hook）：供 React 组件订阅的响应式 Hook。
- `apps/web/components/article-translation.tsx`：升级为支持「原文 / 双语对照 / 仅译文」三态切换与段落交错穿插渲染。
- `apps/web/components/event-translation.tsx`：升级为支持标题与摘要双语对照。
- `apps/web/app/reading-list/page.tsx`：新增 `/reading-list` 独立页面及双标签视图。
- `apps/web/components/site-header.tsx`：加入稍后读书签按钮及计数角标。
- `apps/web/components/article-reader.tsx`：加入收藏动作按钮并自动记录足迹。

## Verification

- 单元测试：覆盖本地存储操作、双语排版渲染、页面渲染。
- 全仓检验：运行 `pnpm turbo run test check-types` 及 `pnpm exec biome check`。
- 浏览器真实体验与各断点自适应排查。

## Risks

- 某些来源正文 HTML 结构特别复杂（如嵌套大量表格或 pre 代码块）：双语配对算法需妥善处理非段落元素，确保代码块与表格正常展示。
