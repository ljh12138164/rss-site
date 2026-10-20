# Impeccable 界面质量审计

日期：2026-10-20（Asia/Shanghai）。执行 audit，只记录问题，不修改产品实现。

## 实现完整性结论

通过基础一致性检查，有局部阅读内容与交互问题。当前实现具有明确的阅读站结构：来源、文章、分区导航、个人关注与 RSS 工作流一致；共享语义颜色、明暗主题和正文排版延续同一套系统。没有证据支持整体重设计。

机械扫描返回 3 条 `side-tab` 提示；逐项核对后均不作为缺陷计数：正文与编辑器的 blockquote 侧线用于标识引用，双语译文侧线用于区分原文与译文，属于有语义的阅读结构。不能仅凭这些提示认定界面质量差。

## 范围与方法

- 源码扫描：`apps/web/app`、`apps/web/components`，同时人工检查共享样式、正文清洗和阅读工具。
- Impeccable 4.7.0 / engine 0.1.16；通过 Python subprocess 核实原生退出码 **2**（发现提示），stderr 为空，JSON 3 条。RTK 将该非零退出码显示为 1，并非扫描失败。
- 启动本地 Next.js 开发服务，以真实配置读取公开文章，不修改云端数据。
- IAB 浏览器实测：首页、搜索弹窗、OpenAI 英文文章、个人关注首次空状态；浅色和深色主题；390×844 与 1280×900 视口抽查。
- 键盘实测：搜索输入聚焦、Esc 关闭；Tab 到主题按钮和个人关注按钮，并读取实际 computed outline / box-shadow。
- 仅做视口模拟，未合成触屏滑动、未使用真机；不把手机尺寸截图视为触摸手势验收。
- 未遍历全部分区、管理员登录状态、翻译后内容、全部图片预览及 RSS 弹窗；没有调用付费总结/翻译生成。
- 无生产性能指标、Lighthouse、bundle 分析或屏幕阅读器实测。性能与其余分数为本轮抽查评分，不能作为全站合规认证或 Core Web Vitals 结论。

## 健康评分

| 维度 | 分数（0–4） | 依据 |
| --- | --- | --- |
| 可访问性 | 2 | 已复现按钮焦点不可见；英文正文缺少语言标记 |
| 性能 | 3 | 图片有尺寸、lazy、async；列表缓存与分页已有实现，未做生产量化 |
| 主题 | 3 | 共享语义 token，实测明暗主题和搜索弹窗正常；未覆盖所有组件 |
| 响应式 | 3 | 抽查首页与文章没有文档级横向溢出，主导航内部可滚动；36px 控件偏小 |
| 实现完整性 | 3 | 结构一致；样本文章残留重复上游目录且目录链接离站 |
| **合计** | **14/20** | **Good，优先修复可访问性弱项** |

确认问题 **4 项：P0 0、P1 2、P2 2、P3 0**。三条机械提示不计入缺陷数。

## 已确认问题

### [P1] 共享按钮样式取消焦点轮廓，部分调用者没有恢复可见提示

- 位置：`apps/web/components/action-styles.ts:24`；`theme-toggle.tsx`；个人关注页的关注/隐藏按钮。
- 类别：可访问性。
- 复现：首页将“搜索文章”按钮聚焦后按 Tab，焦点进入主题切换；个人关注页将“关注OpenAI”聚焦后按 Tab，进入“隐藏OpenAI”。两者 `:focus-visible` 为 true，computed outline-style 为 **none**，box-shadow 为 **none**。
- 原因：共享 actionStyles 使用 `outline-none`，会覆盖 globals.css 的 base 层 `:focus-visible` 规则；这些调用者没有显式补充焦点样式。不能依赖全局规则兜底。
- 影响：键盘用户无法可靠判断当前位置。对应 WCAG 2.4.7 Focus Visible。
- 建议：在共享按钮样式中统一补充 focus-visible 轮廓或 ring，复核 outline/ghost/primary 三类。保留已有局部焦点规则；不是所有按钮都失效，例如“生成总结”有可见 ring，本轮不将其列为故障。
- 建议命令：`$impeccable harden 共享按钮的键盘焦点`。
- 验收：明暗主题下仅用 Tab 能识别主题、关注/隐藏和其他 ActionButton；弹窗内外均可见且不被裁切。

### [P1] 英文标题及正文继承中文语言，双语组件也缺少分段语言接口

- 位置：`apps/web/app/layout.tsx:35`（`lang="zh-CN"`）；`apps/web/components/article-translation.tsx:101`、`:181`、`:240`；`article-html-body.tsx`。
- 类别：可访问性。
- 复现：打开首页的 OpenAI 文章 “Advancing coding in low-resource programming languages”。DOM 为英文标题及长篇英文正文，但 `main [lang]` 数量为 0，全部继承根节点 zh-CN。
- 影响：支持语言切换的屏幕阅读器可能按中文发音规则读英文，影响理解。对应 WCAG 3.1.2 Language of Parts；这不是产品需要将全站改成英文。
- 建议：根据文章语言在标题和正文块设置 lang，双语模式分别标注原文与译文；保留导航、按钮等中文界面语言。正文组件目前不接收 lang，需要为这一用途做最小扩展；不要放宽清洗器允许任意 HTML 属性。
- 建议命令：`$impeccable harden 文章原文和译文的语言标记`。
- 验收：英文文章正文 en、中文译文 zh-CN，中文站点导航仍 zh-CN；双语逐段标注并由屏幕阅读器抽查。

### [P2] 页头稍后读入口触控面积为 36×36px

- 位置：`apps/web/components/site-header.tsx:55`，`size-9`。
- 类别：响应式。
- 证据：390px 视口 DOM 实测宽高均为 36px；相邻搜索和主题按钮高为 44px。
- 影响：手机端入口较难点击，和同组控件的触控规格不一致。
- 标准说明：低于本次 audit 的 **44×44px** 目标；36px 本身不构成 WCAG 2.2 AA 的 24px 最小尺寸违规，不将其升级为 P1。
- 建议：扩大交互区域到 44px，图标可保持现有大小；复核小屏页头宽度。
- 建议命令：`$impeccable adapt 页头稍后读按钮`。
- 验收：390px 视口目标至少 44×44，页头无溢出。

### [P2] 样本文章保留两份上游目录，且目录跳到原站

- 位置：`apps/web/lib/article-content.ts:65`（链接归一化）；`apps/web/components/article-reading-tools.tsx`（本地目录）；样本 OpenAI 文章的已存正文。
- 类别：实现完整性 / 阅读体验。
- 证据：同一篇文章的“文章内容”开头有两个完全相同的三项目录，页面同时已有“文章目录 · 3 节”。上游目录 href 指向 `https://openai.com/index/low-resource-programming-languages/#…`，不是本站的 `#reader-…`。
- 影响：正文开头出现冗余导航，读者误以为能定位本站正文，实际触发离站路径。缺陷在此样本中已确认，尚不能断言所有来源都有重复目录。
- 原因边界：正文清洗会将锚点解析为原站绝对地址；重复目录可能源于上游抽取，尚未定位具体抽取阶段。
- 建议：先定位该来源目录抽取规则，移除能明确识别的上游目录，或将有效同文锚点映射到本站标题。避免通用删除正文列表，误伤正常文章内容。
- 建议命令：`$impeccable harden OpenAI 文章目录与站内锚点`。
- 验收：该样本只保留明确的一套站内目录；正文列表不被误删，目录点击定位站内标题。

## 扫描提示复核

| 提示位置 | 实际用途 | 处理 |
| --- | --- | --- |
| globals.css:260，3px border-left | 正文 blockquote | 有语义，排除 |
| article-editor.tsx:36，border-l-2 | 编辑器 blockquote | 与正文引用一致，排除 |
| article-translation.tsx:196，border-l-2 | 双语译文区分 | 有语义，排除；本轮未触发真实翻译 |

## 值得保留的实现

- main/nav/header 与标题层级明确，主导航使用 aria-current；图标按钮具有可读名称。
- 搜索弹窗有标题、输入名称和筛选 label，实测初始聚焦、Esc 退出正常，小屏可容纳现有筛选。
- 正文具有合理行高、最大宽度、长词换行及代码/表格内部滚动；样本窄屏未造成页面级横向滚动。
- CoverImage 带 width/height、aspect-ratio、原生 lazy 和 decoding async，有失败回退。
- skeleton-shimmer 的 reduced-motion 使用静态占位替代，没有用全局极短动画覆盖全部交互。
- 个人关注首次使用提供来源选择入口、准确的本地偏好说明及无关注时的状态提示。

## 系统性原因与建议顺序

焦点反馈目前依赖每个调用者补充，容易遗漏；原文、译文和上游 HTML 的语言与导航语义也需要在内容边界集中处理。触控尺寸仅确认页头这一处，不泛化为全站失败。

1. P1：`$impeccable harden`，统一共享按钮焦点与文章分段语言。
2. P2：`$impeccable adapt`，修正页头触控目标。
3. P2：`$impeccable harden`，定位样本目录抽取与站内锚点。
4. 修复后运行 `$impeccable audit` 复测，再以 `$impeccable polish` 收尾。

本轮没有修改界面实现、生产数据或部署；开发服务引起的 next-env.d.ts 自动路径变化已恢复。

## 2026-10-20 修复回归

以上四项问题已在 `feat/impeccable-audit-fixes` 修复，原始发现保留作审计基线。回归证据与构建限制见 [开发记录](../development/impeccable-audit-fixes.md)：共享焦点、语言、44px 目标和重复目录均通过针对性验证；未重新开展全站审计或重评总分。
