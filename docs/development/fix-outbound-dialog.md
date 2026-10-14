# 外链确认弹窗跳转修复

## Background

用户视频显示：弹窗与悬停链接为 Anthropic 原文地址，点击“继续访问”却在新标签打开本站首页。真实 Chromium 加载 `OutboundDialog` 后复现相同问题：点击回调同步清空 `pending`，仍在退出过程中的链接被重渲染为兜底 `/`，浏览器随后按更新后的地址执行默认跳转。

## Scope

- 修复“继续访问”的跳转与关闭顺序。
- 为完整组件增加真实 DOM 点击回归测试，并验证真实浏览器的新标签地址与关闭行为。

## Out of scope

来源数据、采集、数据库、Cron、弹窗布局与样式、生产部署。

## Acceptance criteria

- 普通外链和历史 `/out?url=...` 确认后均打开对应原文，且弹窗关闭。
- 新标签保留 `noopener`、`noreferrer`；不会同时触发原生链接的第二次跳转。
- 取消只关闭弹窗。
- 原有静态渲染测试、Web 类型与相关格式检查通过。

## Feasibility

可行。沿用 `docs/development/direct-outbound-links.md` 和 HERMES 中已接受的弹窗、真实外链、历史链接兼容与新标签交互，设计与技术栈无变化。

技术难点为 React 离散事件更新与浏览器默认导航的先后顺序。点击时阻止默认导航，使用当前链接地址同步调用 `window.open`，然后关闭弹窗；在用户点击调用栈内打开新标签，保留安全参数。增加 jsdom 作为测试环境，以完整组件的 DOM 点击验证顺序，避免仅验证静态 HTML。

分支 `feat/fix-outbound-dialog` 基于最新 `origin/master` `238a613`，不包含之前文章总结分支的未合并工作。

## Implementation

- “继续访问”阻止原生默认导航，以点击时的 `event.currentTarget.href` 同步打开新标签，再调用关闭回调。保留原 `<a>` 地址、目标与安全属性。
- 新增完整组件 DOM 点击测试，覆盖普通外链、历史 `/out` 链接与取消操作；验证打开地址、调用次数、安全参数、阻止默认导航、打开先于关闭以及最终关闭状态。测试先失败（两项跳转失败、一项取消通过），修复后通过。
- 固定测试依赖 jsdom 30.1.2，仅该交互测试启用 DOM 环境，其余测试保持原配置。

## Verification

- 修复前 Chromium 最小复现：按钮地址为 Anthropic 原文，新标签地址为 `https://news.ljhboard.cn/`，失败。
- 诊断中取消同步关闭回调后，新标签为预期 Anthropic 原文地址，通过；该诊断改动未写入产品代码。
- `pnpm --filter @rss-site/web test components/outbound-dialog.interaction.test.tsx components/outbound-dialog.test.tsx lib/outbound-link.test.ts`：17 项通过。
- `pnpm --filter @rss-site/web test`：82 个文件、303 项测试通过。
- `pnpm --filter @rss-site/web check-types`：通过。
- `pnpm exec biome check apps/web/components/outbound-dialog.tsx apps/web/components/outbound-dialog.interaction.test.tsx apps/web/package.json`：通过。
- 实际 Chromium 加载产品组件：普通外链与历史链接分别用鼠标点击、键盘 Enter 确认，均只打开一个正确原文标签，`window.opener === null`，弹窗关闭；取消不打开标签。网络响应以本地 fixture 替代，验证浏览器实际导航地址而非第三方网站可用性。
- 完成标准与验收审查：改动限定于跳转顺序和对应验证，无阻塞项，无接受的后续事项，不创建空 roadmap。此变更不涉及 Next 路由、服务端或构建配置，使用类型检查、全量 Web 测试与真实浏览器回归作为相称验证。
- 修复提交 `22b9135`。普通 push 与 HTTP/1.1 重试均因 GitHub 443 端口连接失败而未发布。恢复网络后执行 `git push -u origin feat/fix-outbound-dialog`，由用户创建并合并该分支到 `master` 的 PR。

## Risks

浏览器新标签数量、地址、安全参数与关闭行为已验证。未部署生产，需用户合并后按现有发布流程上线。
