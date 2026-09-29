# 阅读体验与效率增强路线图 (Reading Experience & Productivity Roadmap)

## Context

- 相关开发记录：[双语段落对照阅读与本地稍后读/历史足迹](../development/bilingual-and-reading-list.md)
- 架构背景：`rss-site` 作为现代化极简编辑风热点枢纽，已沉淀 36+ 全网高价值信息源与 Supabase/Next.js ISR 边缘发布体系。为提升用户阅读留存与深度消费体验，规划分阶段推进内容呈现模式与个人效率工具。
- 阶段范围确认：本阶段严格仅实现 **P1** 内容（双语对照与本地稍后读/历史足迹），**P2**（AI 速读与定时推送）进入 Next 候选，保持单次变更聚焦与交付可控。

## Now (P1 · 本阶段实施)

### 1. 双语段落对照阅读模式 (Bilingual Paragraph-by-Paragraph Reader)

- **Value**：满足技术与国际资讯读者对照查阅的需求。既解决纯机器翻译可能丢失技术术语语境的问题，又避免在“纯英文”与“纯中文”之间反复割裂切换。
- **Evidence**：现有 `ArticleTranslation` 与 `EventTranslation` 仅支持二元整体切换（纯原文或纯译文）；MTran 服务端已生成结构完整的清洗后 HTML，可在客户端按 DOM 块级段落精准穿插对照排版。
- **Dependencies**：复用现有的 MTran 翻译服务及安全 HTML 清洗机制；在客户端实现轻量级块级 DOM 对照对齐与优雅的引用样式。
- **Completion signal**：
  - 文章阅读器与事件详情支持「原文 / 双语对照 / 仅译文」三态切换；
  - 双语模式下正文段落上下穿插（原文在上，译文在下并带有优雅的衬线引导边框），标题双语并置；
  - 兼容移动端与桌面端自适应排版；测试用例覆盖各种状态切换与纯摘要降级。

### 2. 零后端负担的「稍后读」与「历史足迹」 (Local Read Later & Reading History)

- **Value**：为读者提供轻量级的内容收藏与足迹回顾能力，免去复杂的账号登录与用户体系成本（严格践行 YAGNI 与零后端隐私安全原则）。
- **Evidence**：用户在首页与榜单浏览时，常需临时标记感兴趣的文章或回溯刚才读过的热点；利用浏览器 `localStorage` 即可实现低延迟、零服务器数据库负担、隐私无泄露的存储方案。
- **Dependencies**：基于原生 Web Storage 与 CustomEvent 跨组件/跨标签页响应式同步；复用 `SiteShell` 与 `ActionButton`。
- **Completion signal**：
  - 全局导航与详情页提供轻量「稍后读」入口与计数指示；
  - 列表项与文章阅读器提供一键收藏/取消收藏按钮；
  - 用户打开文章自动记录至历史足迹（带防抖与上限 100 条 LRU 淘汰机制）；
  - 新增 `/reading-list` 专属管理页面，支持「稍后读」与「历史足迹」双面板查看、单项移除与一键清空；
  - 列表页面中的已读项目呈现柔和的“已读”视觉弱化。

---

## Next (P2 · 下阶段候选)

### 3. AI 核心观点速读 (AI Key Takeaways / TL;DR)

- **Value**：帮助用户在 10 秒内把握长文脉络，提炼核心事实、行业影响与结论。
- **Evidence**：外媒深度长文和技术博客（如 OpenAI、ArXiv、Caixin）字数较多，直接阅读全文成本较高。
- **Dependencies**：轻量级 LLM API（如 Gemini Flash / Cloudflare Workers AI）异步摘要管道；数据库 `signal_articles` 扩展 `ai_summary` 字段或边缘端点流式响应。
- **Completion signal**：阅读器顶部提供「3 句话核心速读」卡片；离线或未生成文章支持一键触发生成并带状态降级。

### 4. 每日早报 / 晚报自动化推送 (Daily Morning/Evening Digest Automation)

- **Value**：变被动访问为主动触达，提升站点内容的主动消费黏性。
- **Evidence**：全网 36 路热点每日定时产出大量情报，现有的 `HomeDigest` 算法已具备生成分区高价值榜单能力。
- **Dependencies**：基于 Supabase Cron 定时任务（如每日 08:30 / 18:30），调用 Hono API 渲染 Markdown 报告；接入 Webhook（Telegram / 飞书 / 邮件推送）。
- **Completion signal**：定时生成格式优美的 Markdown 简报，支持在前端一键查看/复制今日早报，并可通过 Webhook 推送至订阅群。

---

## Later (远期探索)

### 5. MCP 智能体搜索与全文问答工具扩展
- 为 Cursor、Claude 等 AI Agent 提供 `search_news(query)` 与 `get_article_content(id)` 工具，构建智能体即时事实知识库。

### 6. 跨源同题热点自动聚类 (Story Clustering)
- 自动聚合 24 小时内多家媒体对同一重大事件（如财报、突发事件）的报道，合并为同一个专题卡片，消除信息冗余。
