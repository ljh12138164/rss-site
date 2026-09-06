# 来源平台图标

## Background

首页文章来源和六个分类页的来源导航只有文字或首字母，平台之间不易快速辨认。用户要求为每个分类中的平台补充图标，并继续在 `feat/section-rss-feeds` 开发。

## Scope

- 为 36 个既有来源提供本地平台图标。
- 在首页文章来源和分类页来源导航复用同一个图标组件。
- 覆盖桌面、手机及明暗主题。

## Out of scope

新增来源、修改抓取和数据库、远程图标服务、新 UI 依赖、文章配图、部署与合并。

## Acceptance criteria

- 36 个来源均有稳定图标，图标加载不依赖用户浏览器访问第三方服务。
- 图标与来源文本相邻，不重复朗读，分类页当前状态和键盘焦点保持不变。
- 小屏来源导航继续横向滚动，不造成页面级横向溢出。
- 图标资源缺失时能由类型和测试在开发阶段发现。

## Feasibility

可行。现有来源注册表提供稳定的 36 个 ID，可用 `Record<SignalSourceId, string>` 对图标路径做编译期穷举。Simple Icons 16.28.0/15.15.0 提供常见平台的 CC0 SVG；其余站点 favicon 可在开发时取得并压缩成本地 32px PNG。少数没有稳定 favicon 的站点使用按其公开品牌特征绘制的小型 SVG。不会增加运行依赖、外部请求或数据查询。

## Implementation

- 新增 `SourceIcon`，统一 24px 白底圆角容器、20px 图形和现有边框 token；图片为空替代文本并标为装饰，因为相邻平台名称已提供语义。
- OpenAI、Anthropic、DeepSeek、Gemini、Qwen、GitHub、Hacker News、掘金、V2EX、百度、B 站、知乎与 Steam 使用 Simple Icons 图形；可稳定获取的站点 favicon 转为本地 PNG；36氪、GLM、央视、财联社、同花顺、3DM 和 indienova 使用小尺寸可辨识品牌标记。
- 首页用平台图标替换首字母方块；六个分类总览和来源详情共享的 `SourceNavigation` 同步增加图标。
- 复用首页既有冷蓝单强调色、边框分层和 4px 间距系统。未引入品牌色装饰页面，仅让品牌色存在于小图标内部。
- 已读取 `frontend-design`，并通过 UI Skills MCP 完整取得 `interface-design` 与 `baseline-ui`；沿用已确认页面范围和现有 Next Image、Tailwind、React Aria、Lucide 技术栈。

## Verification

- `pnpm --filter @rss-site/web test`：69 项通过。旧测试原本禁止任何 `<img>`，已收窄为验证来源图标数量，文章仍不显示封面图。
- `pnpm --filter @rss-site/web check-types`：通过。
- `pnpm --filter @rss-site/web build`：通过，39 个静态/动态路由正常生成。
- 本地真实数据检查 `/` 和 `/ai`：桌面与 390×844 手机显示图标；手机页面宽度 390px、文档滚动宽度 375px；分类页 6 个图标加载，损坏图片数为 0。
- 静态资源检查：36 个文件齐全，总计 45,746 字节；所有 PNG 签名和 SVG XML 均有效。

## Review

- Standards：只新增本地资源和一个展示组件；路径以 `Record<SignalSourceId, string>` 穷举，新增来源未配置图标会在类型检查失败。没有新增依赖、远程运行请求或客户端状态。
- Spec：主页和分类页均覆盖全部 36 个来源；图标为装饰性内容，平台文字仍是可访问名称，现有链接、当前页状态和焦点样式不变。
- Visual：桌面图标形成稳定的平台识别列；手机维持横向来源导航。明暗背景统一使用白色小底板，避免黑色品牌图形在深色主题消失。
- 无阻塞问题，无需建立空 roadmap。

## Risks

平台商标仍归各自权利人所有，只用于指示内容来源。自绘的小尺寸标记避免声称是官方完整商标；若平台品牌更新，需要替换对应本地资源。
