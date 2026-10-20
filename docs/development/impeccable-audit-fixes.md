# Impeccable 审计问题修复

## Background

用户授权修复 [2026-10-20 界面审计](../audits/2026-10-20-impeccable-ui-audit.md) 的四项问题。分支 `feat/impeccable-audit-fixes` 基于刚 fetch 的 `origin/master`；原工作区保留初始化文件，独立工作区用于本次修复。

## Scope

共享 ActionButton 焦点；文章标题、原文和译文语言；页头稍后读目标 44px；OpenAI 正文中可明确识别的重复上游目录。

## Out of scope

新增页面、视觉重设计、依赖升级、翻译/总结服务、其他来源清洗、数据库及采集写入、生产部署和 Cron。

## Acceptance criteria

- 明暗主题下，主题与关注/隐藏按钮的键盘焦点可见；保留禁用、点击与弹窗行为。
- 英文标题/原文为 en、中文译文为 zh-CN，原文/译文/双语模式均正确，中文界面仍 zh-CN。
- 页头稍后读目标至少 44×44px，390px 页面无横向溢出。
- 已识别的 OpenAI 同文目录被移除，本站阅读工具目录保留；正文列表、跨文章链接及其他来源不被删除。
- 相关回归测试、Web 测试与类型检查、变更文件 Biome、渲染回归及比例适当的构建检查完成。

## Feasibility

可行，无需迁移或新依赖。Next.js 16.3.4、React 19.2.8、Tailwind 4.3.3、React Aria 1.17.0，复用 ActionButton、ArticleTranslation、ArticleHtmlBody、ArticleReadingTools 与 semantic tokens。已阅读本地安装版 Next accessibility 指南。

技术难点：utility 层 outline-none 覆盖 base 的焦点规则，修复放在共享 utility 中；混合语言不能改根 html，按标题/正文与译文分别标注；上游 HTML 清理必须局限 OpenAI、纯链接列表、同篇 URL 和正文标题匹配，不能泛删 ul/ol。使用现有 sanitize-html 提取文本，清洗后仍执行原安全过滤，不放宽属性白名单。数据库中已有内容也在渲染边界得到修正，无需重采集。

## Implementation

复用本聊天已确认的产品定位及审计范围，用户明确要求修复四项问题；没有新页面、UI 库或视觉方向，现有审查足够，无需重复确认。表面是已有页头、共享按钮、关注页和文章阅读区；用户动作、布局与加载/错误/禁用状态不变。验证桌面和 390px、鼠标与键盘，不声称真机触摸或屏幕阅读器已经验证。

UI Skills MCP 已完整载入 `dammyjay93/interface-design` 与 `ibelick/baseline-ui`。沿用灰白/深色底、青色语义 accent、衬线文章标题/无衬线工具文字、现有分隔线和 4px 间距；文章是焦点，工具退居其次。仅焦点反馈与按钮触控尺寸产生视觉变化。使用 Impeccable harden/craft-floor 指导并保留既有引用及译文侧线。

## Verification

- Web 全量：`rtk proxy node node_modules/vitest/vitest.mjs run`，89 个文件、333 项通过；新增目录边界和阅读模式语言回归。最终标题语言边界补充后再次运行相关测试通过。
- 源码类型检查在构建前通过；生产构建生成路由类型后，整体类型检查存在下述既有失败，不能宣称整体类型/生产构建通过。
- 7 个变更源码/测试文件的 Biome 及 `git diff --check` 通过。
- IAB 实际渲染验证：390×844 与 1280×900，明暗主题的主题按钮和“隐藏OpenAI”键盘焦点为 solid 2px、offset 2px；稍后读为 44×44px；390px 下文档 scrollWidth 为 375px，没有页面横向溢出。未变更关注偏好，主题恢复浅色。
- 真实 OpenAI 样本 `1e4dcf54-a23b-4cf6-bf70-48f53400556d`：标题及正文 `lang=en`，上游重复目录列表从正文移除，本站目录保留 3 节；点击第二节留在本域，标题距顶部约 160px。真实 URL 的尾斜杠差异已纳入回归。
- 翻译服务未调用。组件交互测试模拟翻译响应，验证原文、双语、仅译文及切回原文的语言；英文短标题与中文正文独立标注。
- Impeccable detector 扫描 4 个变更 UI 文件，仅 1 条 `side-tab`：既有双语译文的语义侧线；与原审计一致，人工复核排除，不添加忽略规则。
- `next build --webpack` 编译成功（54s），路由类型阶段失败：17 个既有路由导出 `HomeView`、`AiSourceView`、`createRssResponse` 等非 Next 允许项，另有首页 dev 生成类型的重复报错。路由、tsconfig、Next 配置与 `origin/master` 无差异。使用 TypeScript compiler host 将本次改动模块内容替换成 `origin/master` 后比较诊断，基线和当前具有相同 18 条 TS2344 路由诊断，未发现本次引入的类型诊断。
- 使用 Webpack 是本机工作区 node_modules junction 超出 Turbopack 根目录的验证适配，未修改项目脚本或编译配置。生产构建失败后未运行 early-hints/service-worker 生成，未部署。
- 提交钩子的 pnpm 因同一 junction 安全检查拒绝自动安装；直接调用已安装 Biome 执行相同 `check --write --staged --no-errors-on-unmatched`，通过后仅该次提交跳过钩子，不修改全局或仓库钩子配置。

## Review

Standards：修改集中在共享按钮、页头和文章渲染边界，复用现有 token 与组件，不增加依赖，不放宽 HTML 安全过滤，不修改数据库、采集或生产环境。初始化产品上下文及原始审计随分支保留；临时 Live 状态不提交。

Spec：四项审计修复均有实际渲染或交互/清洗回归证据，本次修复范围无未解决阻塞项。保留原有引用和译文侧线；不因 detector 的语义误报改变设计。

发现分类：

- Blocking（本次修复）：`outline-none` 导致仅添加 outline 宽度仍不可见，以及真实目录 URL 尾斜杠差异，均在浏览器回归时发现并解决、复核。
- Accepted follow-up：既有路由额外导出阻止生产构建，属于独立跨路由工作，不在本次四项界面修复中处理；构建恢复前不能据此记录宣称可发布。见 [后续路线图](../roadmaps/impeccable-audit-fixes.md)。
- Rejected：detector 的译文 `border-l-2` 是双语阅读语义；浏览器现有 React key 警告涉及未修改的 `ArticleReader` 传入子节点，本轮不扩展至无关整理。

## Risks

语言判断复用现有中英文启发式，不新增通用语言识别；目录清理刻意保守，不能识别的上游结构保留。真实翻译请求不在验证中调用，以本地模拟响应覆盖模式切换。
