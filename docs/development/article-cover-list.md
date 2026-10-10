# 左侧封面的紧凑文章列表

## Background
用户要求参考 RSS 阅读器，将分区/来源页的普通文章改为左侧封面列表，抽出图片组件，支持懒加载及可配置默认图，并用 TDD 实现。
封面来源调查见 [数据排查](../research/article-cover-audit.md)。

## Scope
- 普通文章列表左侧横向封面，右侧标题、两行摘要、来源与时间；去掉普通文章的大号序号。
- 独立 `CoverImage` 组件：src、fallbackSrc、fallback、alt、width/height、loading、className。
- 用户补充：无图/图片失败时显示平台图标；ReactNode fallback 插槽也可传自定义占位内容，保留 fallbackSrc 与本地 SVG 通用回退。原生懒加载、固定比例；无文章的平台维持原空状态。
- 分页文章来源查询传递 image_url，并调整加载骨架。

## Out of scope
新页面、运行依赖、数据库迁移、线上部署及 GitHub 排行样式改动。

## Acceptance criteria
- 用户确认只对封面组件做 TDD；缺图、加载失败、配置默认图、懒加载、更换 src 的公开行为可验证。
- 列表的文章跳转、来源入口、收藏和分页继续可用。
- 桌面/手机、真实封面/默认图均视觉核验；前端测试和类型通过。

## Feasibility
可行。HotItem 已有 imageUrl；分页查询尚未读取数据库字段。复用现有 HotList、SourceIcon、ArticleBookmarkButton 和主题，不添加运行依赖。
现有 Vitest 运行在 Node；静态输出用 Vitest，图片错误事件通过现有 Vite 的独立浏览器检查页验证，使用真实 React DOM，不模拟 React hooks，不添加 DOM 库。
在既有 `feat/cloudflare-blog` 分支继续已记录的前端后续工作。当前 server/api/src/ingestion/feed.ts 有本地回退，保留该改动且不纳入前端提交；用户未回答该回退的处理选择，未进行依赖该选择的后端操作。

## Implementation
UI Skills 使用已读取的 interface-design、baseline-ui，复用现有设计方向。
Intent：快速扫描 RSS 文章并决定阅读/收藏；标题是主焦点，封面提供识别线索。
Hierarchy：左侧 8:5 图片，右侧标题 16px 半粗、摘要 14px 两行、元信息 12px；图片宽度手机 96px、桌面 144px。
Palette/Depth：继承 background/foreground/muted/border/primary，细分隔线和现有 hover，无额外阴影/动画。
Spacing：4px 基础间距，行内 12–16px 间隔，收藏按钮保留可点击区域。
组件失败地址记忆按资源 URL 工作；新 src/fallbackSrc 可正常尝试，不添加定时重试或图片代理。无具体标志的 SourceIcon 以平台 code 字母兜底，避免空占位。
本地浏览器行为检查入口：`node scripts/check-cover-image.mjs`（在 apps/web 执行），打开输出地址并运行检查。

## Verification
- TDD 逐项 red/green：默认图用例先因组件不存在失败；实现后通过。配置 src/fallbackSrc/尺寸/loading/alt/className 用例先失败，补实现后通过。
- 浏览器原生图片事件：缺失封面 URL 起初保持失败地址，确认 red；错误回退实现后 green。自定义默认图 URL 无效时起初失败，加入本地默认图回退后 green。
- 用户补充平台图标后，新增 CoverImage fallback 插槽静态用例先失败，补实现后通过。组件浏览器检查覆盖加载失败、默认图失效、新 src/新默认图和平台图标回退，最终 PASS；未模拟 React hooks 或图片 DOM。
- Web 270 项测试全部通过、Web TypeScript 检查通过；变更文件 Biome 与 diff 检查通过。按用户要求，只为封面组件新增测试，其余修改是既有列表测试同步更新旧排名/图片断言。
- 默认浏览器桌面与 390px 手机检查：真实 Cloudflare 图片加载正常，宽度分别 144/96px；手机 document.scrollWidth 不超过 innerWidth。Hacker News 无图片时正确显示平台标志；浅/深主题、收藏加入/移除已核验。
- ChatGPT 当前无文章，浏览器确认 articleRows=0、原“暂无内容。”空状态保留；未添加封面条目。
- 六个分区 articles API 均 HTTP 200、各 30 条；本地时间轴已显示真实已发布事件；补齐 hot_items/source_status 预览后 Skills 可正常加载。最初 Cloudflare-only 快照造成其他分类缺数据，现已导出 1,153 篇跨来源真实云文章及热点、状态、已发布事件，并重启本地服务。
- 标准 Next 构建编译/类型阶段通过，但直接云 REST 预渲染因本机 ECONNRESET 失败；使用忽略提交的真实云快照 preload 后 63/63 页面生产构建、early hints 与 service worker 生成通过。此构建不能替代 CI 的真实网络部署验证，快照与连接信息均未提交。
- Standards/Spec 自检无阻塞项；未新增未请求的页面、依赖或动画，无需新增 roadmap。
- 提交 `48f03bf` 已推送 `origin/feat/cloudflare-blog`，由用户创建并合并到 master 的 PR 后发布；本地服务继续运行。

## Risks
上游图片可能防盗链、过期或不可访问；图片组件本地回退。外部图片不经过新代理或后端抓取。
本机云 Supabase REST 连通性失败时，使用真实云数据库快照验证并明确记录限制。
