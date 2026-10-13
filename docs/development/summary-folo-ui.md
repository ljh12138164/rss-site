# Folo 风格文章总结面板

## Background
用户要求回归 AI 总结并截图，随后要求改成 Folo 风格。master 基线 d0326c6；生产页面成功返回概述与五条要点，原有相关 18 项测试通过。生产结果将“新增采样分析器、原追踪分析器重命名”压缩成“替代 cProfile”，存在内容质量问题。

## Scope
仅改现有 ArticleSummary 内嵌面板的视觉与操作布局，保留首次手动生成、状态提示、折叠、重试和 IndexedDB 恢复。

## Out of scope
不改模型、提示词、接口、数据库、缓存或发布配置，不新增聊天、页面或 UI 依赖。

## Acceptance criteria
- Folo 式统一卡片：项目青绿色强调色与中性底色、圆角、Sparkles 标题与右侧操作，正文不重复显示标题。
- 默认、生成中、错误重试、展开和折叠可用；键盘焦点清晰，折叠状态有 aria-expanded/controls。
- 桌面和 390px 手机、明暗主题可读，正文自然换行。
- 相关测试、Web 类型、格式检查和可行的构建/浏览器验证完成。

## Feasibility
可行。沿用 React 19.2.8、React Aria 1.17.0 ActionButton、Tailwind 4.3.3 和 lucide-react 1.40.0；仅 JSX/CSS 变更，生成及存储逻辑不变。既有详情页、状态和栈已确认，用户本次明确指定 Folo 视觉方向，无新页面或依赖决策。独立工作区保留原工作区研究文档。

## Implementation
- UI brief：RSS 读者先了解要点再阅读全文；文章标题为主，总结为辅助。以纸白/墨色正文、灰色来源说明、项目青绿色 AI 标题建立层级；轻边框和单层中性底色，4px 间距网格、16/20px 内边距，继承正文 sans 字体（14px 正文、12px 说明）。
- 复用 docs/development/article-summary-agent.md 中已确认的内嵌面板与交互；用户指定 Folo，参考其 [AISummaryCardBase](https://github.com/RSSNext/Folo/blob/dev/apps/desktop/layer/renderer/src/components/ui/ai-summary-card/AISummaryCardBase.tsx) 的卡片与标题栏，自行实现，不复制其源码。
- 已完整读取 UI Skills dammyjay93/interface-design、ibelick/baseline-ui。按用户后续要求，卡片、标题和操作改用 border-border、bg-muted/30、text-primary 和共享 ghost hover；明暗色值由项目主题统一管理，无额外渐变、光晕或动画。
- 右侧操作保持文字标签和至少 44px 高度，useId 关联折叠区域，显式 focus-visible ring。

## Verification
- 色调后续调整：仅替换三个 className，改用项目语义色。18 项总结回归与组件 Biome/diff 检查通过；本地真实组件默认态明暗主题截图为 summary-project-theme-light.jpg、summary-project-theme-dark.jpg，青绿色文字与中性卡片底色确认正常。之前 Folo 截图保留为改色前证据。交互代码未变，不重复云数据构建；临时验证页面和服务已清理。
- Web 全部 81 个测试文件、300 项测试通过；`pnpm --filter @rss-site/web check-types` 通过，组件 Biome 与 `git diff --check` 通过。
- 本地真实 ArticleReader + ArticleSummary，临时文章夹具与模拟 Nest HTTP 响应：默认不请求（calls=0）；503 显示错误/重试，重试后按钮禁用并显示骨架；成功展示概述和五条要点，Enter 折叠/展开与 aria-expanded false/true 通过；刷新后 IndexedDB 自动恢复。总调用数保持 2（一次失败、一次成功），折叠/刷新不调用后端。
- 默认桌面视口及 390x844 手机，明暗主题均核验。截图保存到本次聊天 visualization 目录：summary-folo-desktop-light.jpg、summary-folo-mobile-light.jpg、summary-folo-desktop-dark.jpg、summary-folo-mobile-dark.jpg；另有生成与错误状态截图。截图为本地模拟数据，不代表模型事实质量已修复。
- `pnpm --filter @rss-site/web build` 编译和 TypeScript 通过，62 页预渲染时 /news/xinhua、/ai/openai 的 Supabase 网络出现 TimeoutError/ECONNRESET，新华三次重试后退出；完整生产构建未通过。与既有开发文档的本机云 REST 网络限制一致，没有修改数据读取或掩盖失败。
- 临时页面、模拟服务、验证标签页和临时环境副本已清理；主工作区与生产保持不变。

## Review
已按开发文档验收项和仓库/UI Skills 规则复核 diff 与截图：仅调整呈现和折叠可访问性，生成、错误、存储逻辑不变；移动端正文换行、低饱和色层级和键盘可用。无代码阻塞发现或本次 UI 范围的已接受后续项，不创建空 roadmap。原有模型事实失真保留为独立风险。完整构建受外部网络限制，仍需 PR CI 验证真实预渲染。

## Risks
模型内容失真为原有生产回归发现，不通过样式修改掩盖；需要另行改进总结质量。视觉预览若使用模拟响应，将明确区分于生产回归。
