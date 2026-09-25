# UI/UX Pro Max 视觉重构与体验优化

## Background

当前 `rss-site`（今日热点）已完成四大后端与数据管线架构重构，全站核心数据流、信号注册中心、通用读取器与缓存策略均已稳固。
前端界面目前采用基础的 Minimal Teal 排版，但存在若干待升阶的设计细节与交互体验短板：
1. 头部主导航与移动端滚动在小屏下无溢出渐变遮罩，缺乏触觉反馈与平滑指示器；
2. 搜索入口与主题切换按钮缺乏快捷键徽章（`⌘K` / `Ctrl+K`）与现代微交互质感；
3. 热点榜单（`HotList`）与首页速览（`HomeDigest`）排版节奏可进一步增强，前三名特异化层级与悬浮动效缺乏微缓动（150ms cubic-bezier）；
4. 子源筛选栏（`SourceNavigation`）目前为纯文字下划线，在移动端可操作性与点击热区（$\ge 44\text{px}$）可升级为更加清晰易选的现代胶囊标签体系；
5. 文章阅读页（`ArticleReader`）阅读行宽偏宽，文章正文行高、代码块、引用块及操作栏的微交互有明显提升空间；
6. 深色模式下的部分发丝线与微对比度需进一步调优，严格符合 WCAG 2.1 AA/AAA 4.5:1+ 可访问性标准。

根据用户指示，采用 `ui-ux-pro-max-skill` 设计智能，选择「现代极简报刊风（Modern Swiss-Editorial）」作为核心视觉方向，系统性重构全站核心 UI。

## Scope

1. **设计系统与样式变量（`globals.css`）**：
   - 升级字体层级、阅读黄金行距（1.75 ~ 1.85）、行宽度量（68ch）。
   - 优化深色/浅色模式发丝线与对比度 tokens，强化 `--muted-foreground`、`--card`、`--row-highlight`。
   - 增加横向滚动两端渐隐遮罩实用工具类（`scroll-fade-mask`）。
   - 增强 `:focus-visible` 键盘焦点环与 `prefers-reduced-motion` 动效降级保障。

2. **全局框架与头部导航（`SiteHeader` / `SiteShell`）**：
   - 优化顶部 Logo 与标题排版对齐。
   - 升级导航栏：现代微胶囊指示器，移动端横滑边缘渐隐遮罩，触控目标 $\ge 44\text{px}$。
   - 升级搜索入口按钮：增加平台自适应快捷键徽标（Mac `⌘K` / Win `Ctrl+K`），微微缩放与悬浮质感。
   - 升级页脚：清晰的网格对齐、品牌链接与外链图标规范。

3. **首页与热点列表（`HomeDigest` / `HotList`）**：
   - 升级前三名标号设计（`#01`, `#02`, `#03`），强化层次与品牌色点缀。
   - 优化列表项悬浮动效：150ms cubic-bezier 微平移与平滑背景高亮，消除任何布局抖动（CLS 保持 0）。
   - 来源标签胶囊：更精致的微边框、图标与短名排版。
   - 首页“分区导览”网格：Bento 风格卡片微边框与标题标签对齐。

4. **专区布局与子源导航（`SectionLayout` / `SourceNavigation`）**：
   - 将子源文字列表升级为现代交互胶囊标签（Pill Tabs），活动状态具备实体背景或深色微底色，点击热区 $\ge 44\text{px}$。
   - 优化 RSS 订阅按钮与专区标题导言的排版间距。

5. **文章阅读页（`ArticleReader`）**：
   - 约束阅读视口宽度为 68ch 黄金阅读比例，居中自适应。
   - 升级文章头部元信息排版（来源、作者、发布时间、阅读预估）。
   - 升级阅读操作栏（返回、翻译、原站跳转），增加平滑反馈。
   - 正文排版优化：段落边距、引用块侧边色彩条、表格与代码块美化。

## Out of scope

- 引入重量级第三方 UI 库（维持无新外部依赖、原生 Tailwind CSS v4 与 React Aria）。
- 更改任何后端 API 接口、MCP 协议端点或数据库 Schema。
- 改变任何既有公开 URL 路由或破坏已有的 SEO 结构化数据。

## Acceptance criteria

- [x] 所有修改后的页面符合现代极简报刊风（Modern Swiss-Editorial）美学与视觉层级。
- [x] 交互触控目标在移动端全量满足 $\ge 44\times 44\text{px}$（WCAG 2.5.5）。
- [x] 浅色与深色模式下所有正文与核心元素对比度严格满足 $\ge 4.5:1$（WCAG 1.4.3）。
- [x] 键盘导航（Tab）具备清晰可见的焦点环状态（WCAG 2.4.7）。
- [x] 所有既有前端与全仓测试（180 项 Web 测试，全仓 270 项）100% 通过，无回归错误。
- [x] TypeScript 类型检查（`pnpm check-types`）与代码静态检查（`biome check`）0 错误 0 告警。
- [x] 生产构建（`pnpm build`）成功，57/57 静态页面预渲染正常。

## Feasibility

- 完全可行。当前项目采用 Tailwind CSS v4 与 React 19，具备极佳的 CSS 变量驱动能力与组件封装度。
- 技术难点与关键防护：
  1. 保证 `SiteHeader`、`SourceNavigation` 和 `HotList` 的改动与现有测试中对 HTML 静态标签断言的完全兼容。
  2. 移动端横向滚动的渐隐遮罩在不支持 `mask-image` 或无溢出时不遮挡文本。
  3. 保持零引入外部依赖，所有微动效使用 CSS transition 与原生 transform，杜绝 CLS。
  4. 消除全站标记中的重复品牌词，严格维持全页面对“今日热点”唯一站点名的断言不变量。

## Implementation decisions

- 继承 Minimal Teal 主色（`#0f766e` / `#2dd4bf`），微调周边辅助色 tokens。
- 统一交互过渡动效为 `transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1)`。
- 保持所有语义化属性（`aria-current="page"`、`role`、`dateTime`）原样保留。

## Verification

- `pnpm test`: 全仓 3 个包、63 个测试套件、270 项单测全量通过（Web 180 / API 83 / Signals 7）。
- `pnpm check-types`: 3 个包 TypeScript 类型检查全部通过（0 errors）。
- `pnpm exec biome check`: 涉及的全部 10 个修改文件 Biome check 0 errors, 0 warnings。
- `pnpm build`: 57/57 静态页面预渲染成功，Early Hints Link Header `rel=preload; as=style` 正确注入。

