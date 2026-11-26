# 中英文界面与 AI 摘要

## Background

站点此前以简体中文显示界面，文章和 Skill 的 AI 摘要也固定生成中文

## Scope

- 公共页面的导航、筛选、阅读控件、状态提示、日期与站点说明支持中英文
- 页面根据浏览器首选语言列表匹配简体中文或英文。没有匹配时使用简体中文
- 英文界面使用原标题和正文，隐藏文章与 AI 事件的中文翻译入口
- 文章和 Skill 的 AI 摘要按页面语言生成

## Out of scope

文章、预生成的日报和事件内容、管理后台、面向爬虫的站点元数据及独立静态资源的翻译

## Acceptance criteria

- 中英文浏览器环境显示相应界面，文章正文可继续阅读
- 同一条内容的两种语言分别生成和命中，切换语言后只显示当前语言的摘要
- 两套缓存维持现有过期策略，已有中文结果可继续使用

## Feasibility

主站已有共享的 React Aria provider 和稳定的 ISR 页面。浏览器语言通过共享 React context 提供，静态服务器首屏继续使用中文，水合后切换为匹配语言。公共 URL 和缓存不需要按请求头分流

ai-base 独立执行摘要推理。主站和 Nest 都校验可选的 `locale`，英文语言参数需要先上线到 ai-base。无参数请求继续生成中文

## Implementation

- 沿用 [内容导航](refine-content-navigation.md)、[双语阅读](bilingual-and-reading-list.md) 和 [文章摘要](article-summary-agent.md) 所用页面、布局、控件及状态。导航、文章和摘要区域继续适配桌面与手机。中英文使用原有 React Aria、Tailwind 和配色。此次只改文案与行为，未使用视觉设计 registry
- 原站文案由 humanizer-zh 核对。标题、正文、来源文章内容和专名直接使用已收录的数据
- 浏览器语言变化会更新 React Aria 语言和文档 `lang` 属性。摘要面板按内容和语言重新挂载，离开原面板时取消旧请求
- 英文 Redis、进程内去重及 IndexedDB 键使用独立语言前缀。旧中文键、既有 TTL 和内容指纹继续生效。英文提示词覆盖 Gemma 与 Cloudflare 回退

## Verification

- 主站全仓类型检查与单测通过，338 项通过，22 项依赖本地数据库或 Redis 的集成测试跳过
- 流式与 JSON 路由、语言变更时的缓存恢复、英文原文和去重隔离都有回归测试

## Risks

- 英文浏览器在水合完成前会收到中文服务器首屏
- 按 ai-base、rss-site 的顺序发布。摘要模型请求测试使用模拟上游
