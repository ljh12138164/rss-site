# 总结卡片边框可见性

## Background
用户截图反馈 AI 总结卡片的中性边框不明显；前一轮 PR #40 已合并。

## Scope
仅调整 ArticleSummary 边框为 border-2 border-primary/70，保留现有底色、布局及交互。初版 1px/40% 主色仍被用户反馈不明显，改为 2px/70% 提高可见性。

## Out of scope
不修改其他卡片、全局主题、总结接口或模型。

## Acceptance criteria
卡片轮廓更清晰，明暗主题沿用项目青绿色，变更通过格式检查和视觉检查。

## Feasibility
可行。沿用 summary-folo-ui 文档已确认的 UI 面板、技术栈、响应式与状态。项目已有半透明主色边框先例，本次按用户反馈提高厚度与不透明度，无新组件或依赖。主色 token 随主题切换。

## Implementation
单行 className 调整；标题仍为主，总结轮廓更明确，保留中性底色与 16/20px 内边距。复用上一轮已读取的 interface-design/baseline-ui 指南，用户本次明确要求提高边框可见性。

## Verification
- 后续加粗：2px/70% 主色已用真实 ArticleReader + ArticleSummary 配模拟 HTTP 返回的五条要点验证展开态，明暗截图为 summary-border-strong-light.jpg / summary-border-strong-dark.jpg，控制台无错误。组件 Biome/diff 检查通过；临时页面、模拟服务及标签页已清理。
- 基线 origin/master e5525d2（已合并 PR #40）。组件 Biome 与 git diff --check 通过。
- 本地真实 ArticleSummary 的浅色/深色默认态核验通过，截图为本次 visualization 目录的 summary-border-light.jpg / summary-border-dark.jpg。独立预览 origin 排除旧资源缓存后，控制台无错误。
- 仅修改颜色 class，无逻辑变化，不新增测试或重复已完成的行为回归与受云 REST 网络限制的全站构建。临时验证页面、服务与标签页已清理。

## Review
单行产品代码 diff 已按范围与 UI 指南复核，未影响相邻组件和主题 token，无阻塞发现及已接受后续项，不创建空路线图。交付 feat/summary-card-border，由用户创建并合并到 master 的 PR；未部署。

## Risks
只有边框色变更，生成、缓存与折叠逻辑不变。
