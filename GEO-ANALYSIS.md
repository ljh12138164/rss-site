# GEO / AI Search Readiness Audit & Optimization Report

**Target Project:** 今日热点 (AI 热榜) - `apps/web`  
**Evaluation Standard:** `seo-geo` (May/September 2026 Guidelines)  
**Primary Reference:** Google Search Central: *AI Optimization Guide* (May 2026 / Clarified June 2026)  

---

## 1. GEO Readiness Score: 86 / 100

| Evaluation Dimension | Weight | Score | Evaluation Summary |
|---|---|---|---|
| **1. Citability (可引用性)** | 25% | 21 / 25 | 具备标准定义句与独立问答块，结构化事实清晰，开头直接回答核心问题。 |
| **2. Structural Readability (结构化可读性)** | 20% | 18 / 20 | 完整的 H1→H2→H3 语义层级，清晰的编号列表与步骤卡片，段落精炼。 |
| **3. Multi-Modal Content (多模态与富媒体)** | 15% | 11 / 15 | 包含 SVG 图标、流程交互图（content-flow）、分类徽标；可补充更多可视化数据卡片。 |
| **4. Authority & Brand Signals (实体权威与品牌度)** | 20% | 16 / 20 | 严格标注原始信源、完整 `datePublished` / `dateModified`、直达出处链接，高新鲜度。 |
| **5. Technical Accessibility (技术可访问性与 SSR)** | 20% | 20 / 20 | Next.js 16 App Router 原生全量服务端渲染 (SSR)，AI 爬虫无 JS 渲染门槛；提供 `/llms.txt`。 |

---

## 2. Platform Breakdown (平台适格性分析)

> 注：以下为定性适格性评估（未通过商业 DataForSEO/SE Ranking API 测量特定关键词实时引用量）。

| AI Search Platform | Primary Citation Sources | Project Readiness & Fit |
|---|---|---|
| **Google AI Overviews** | 强相关于经典 Google 排名与段落可抽取性 | **极高**。全站 SSR，规范化 Canonical，结构化面包屑与 Article Schema，首屏文本可快速抽取。 |
| **Google AI Mode (Gemini)** | 弱相关于排名，更侧重内容新鲜度、实体权威与 5 位以后的精准段落 | **极高**。AI 专区 2 小时、全站 6 小时错峰高频快照，`dateModified` 实时更新，契合时效性偏好。 |
| **ChatGPT Search** | 依赖 `OAI-SearchBot` 索引，重视权威引用与来源标注 | **高**。条目全部标明真实信源与原文 URL，具备完整事实追溯能力。 |
| **Perplexity** | 侧重社区讨论、时效聚合与清晰的步骤解答 | **高**。涵盖社交与技术热点聚合，提供直达原文的出处卡片。 |
| **Bing Copilot** | 依赖 Bing 索引与 IndexNow 协议 | **极高**。项目已内置 `indexnow.txt` 与 Bing 站点验证支持。 |

---

## 3. AI Crawler Access Status (AI 爬虫访问状态矩阵)

根据 `seo-geo` 规范，必须严格区分**搜索引用爬虫 (Search Citability)** 与 **模型训练爬虫 (Training Only)**：

| Crawler User-Agent | Controlling Entity | Governed Capability | Project Status | Compliance |
|---|---|---|---|---|
| **Googlebot** | Google | Google 搜索 / AI Overviews / AI Mode 索引与引用 | **Allowed** | 规范允许，核心服务受保护路由已被 Disallow |
| **OAI-SearchBot** | OpenAI | **ChatGPT Search 搜索结果引用资格** | **Allowed** | 准入正常，未被阻拦 |
| **GPTBot** | OpenAI | OpenAI 基础大模型离线训练数据抓取 | **Allowed** (通用规则) | 独立于 ChatGPT Search |
| **Claude-SearchBot** | Anthropic | **Claude 搜索功能引用资格** | **Allowed** | 准入正常 |
| **ClaudeBot** | Anthropic | Anthropic 基础模型离线训练数据抓取 | **Allowed** (通用规则) | 独立于 Claude Search |
| **PerplexityBot** | Perplexity | **Perplexity AI 搜索检索与引用** | **Allowed** | 准入正常 |
| **Applebot** | Apple | Siri、Spotlight 与 Safari 发现与引用 | **Allowed** | 准入正常 |
| **Applebot-Extended** | Apple | Apple Intelligence 生成式模型训练数据 | **Allowed** (通用规则) | 独立于 Safari 发现 |
| **Google-Extended** | Google | Gemini / Vertex AI 训练与 Grounding（非搜索） | **Allowed** (通用规则) | 独立于 Google Search |

> **关键合规确认**：本站 `robots.ts` 对通用爬虫开放根路径 `allow: '/'`，仅安全拦截私有接口 `/api/`、`/cron/` 和外链中转 `/out`，确保所有 AI 搜索引用爬虫均能畅通访问公开内容。

---

## 4. llms.txt Status & Optimization

- **现状状态**：已配置动态端点 `/llms.txt`（位于 `apps/web/app/llms.txt/route.ts`）。
- **本次 GEO 优化**：
  1. 新增 **`## 关键事实 (Key Facts)`** 模块，向 LLM 声明定位于“聚合 35+ 知名官方信源的去噪阅读与 RSS 平台”。
  2. 显式给出数据刷新机制（AI 平台区每 2 小时、全站每 6 小时错峰同步）。
  3. 结构化列出全站六大分区、RSS 2.0 订阅端点（`/feeds/*.xml`）与 MCP 协议接口（`/mcp`）。

---

## 5. Brand Mention Analysis (品牌实体与提及分析)

- **核心品牌词**：`今日热点`、`AI 热榜`。
- **信源实体网络**：项目深度连接 GitHub、OpenAI、Anthropic、DeepSeek、Google AI、新华社、央视等高权重实体。
- **实体关联优化建议**：
  - 在开源仓库、社交平台与相关技术社区中保持品牌名称的统一（`今日热点 - RSS Digest`）。
  - 在 Schema 中强化 `sameAs` 关联至官方代码仓，巩固实体所有权。

---

## 6. Passage-Level Citability (段落级可引用性优化)

- **首屏定义测试 (What is X)**：
  - 在 `apps/web/app/about/page.tsx` 首屏第一句明确定义：“今日热点（AI 热榜）是一个专注 AI、科技、国内新闻、社交、财经和游戏六大维度的轻量化热点聚合与 RSS 订阅平台。”
- **自包含回答块 (Self-Contained Answer Blocks)**：
  - 新增了标准化 `常见问题`（FAQ）区块：
    - *“什么是今日热点？”*（独立自包含描述，80 字）
    - *“内容更新频率是怎样的？”*（明确 2 小时 / 6 小时错峰机制，110 字）
    - *“如何使用 RSS 订阅本站？”*（明确标准 RSS 2.0 接入方式，90 字）
  - 段落长度均落在 80~150 字的高可引用区间内，便于 LLM 直接切片与引用。

---

## 7. Server-Side Rendering Check (SSR 与无障碍分析)

- **框架支持**：Next.js 16 (App Router) + React 19 Server Components。
- **首屏输出**：全量静态/动态服务端生成，HTML 源码中包含全部文字、链接、元数据及 JSON-LD 结构化数据。
- **AI 兼容性**：即使是不执行 JavaScript 的无头抓取器（如 raw-HTTP 模式下的 PerplexityBot、GPTBot），也能获取 100% 完整内容，无白屏或 Hydration 依赖风险。

---

## 8. Top 5 Highest-Impact Changes (核心优化清单)

1. **[已实施] `/llms.txt` 规范化强化**：注入自包含 Key Facts 关键事实与信源覆盖说明，提升 LLM 端点理解深度。
2. **[已实施] `/about` 段落可引用性重构**：植入第一句精准定义与三大核心问答块（FAQ），满足 AI Overviews 提问提取模型。
3. **[已实施] 新增 `/llms-full.txt` 端点**：将完整的 35+ 信源目录、抓取频率及 API/RSS 规格打包为机器可读规格文档，并附带自动化单元测试。
4. **[建议] 建立长期社区提及网络**：在 GitHub、技术博客或论坛分享真实 RSS 信号，积累品牌在知识库中的自然引用。
5. **[建议] 定期运行 `/seo drift` 监控**：追踪页面元数据与 SEO/GEO 基线变动，防止内容在演进中出现退化。

---

## 9. Schema Recommendations (结构化数据最佳实践)

当前 `apps/web/lib/seo.ts` 已包含规范的 `WebSite`、`CollectionPage`、`NewsArticle`、`TechArticle`、`BreadcrumbList`，符合 Google 规范。  
建议保持以下纪律：
- 严格遵循 Google 2026 规定：**不建议**在商业聚合站首页滥用已被 Google SERP 降权废弃的 FAQPage Rich Snippet，保持纯语义 HTML 标签 + WebSite 实体即可。
- 保证 `Article` 的 `isBasedOn` 与 `citation` 准确指向原始上游 URL。

---

## 10. Verification & Test Results

- **测试套件运行**：
  ```bash
  pnpm --filter @rss-site/web test
  ```
  **结果：58 passed (58 文件), 197 passed (197 用例)** 全部通过，无任何回归。
- **TypeScript 类型检查**：
  ```bash
  pnpm --filter @rss-site/web check-types
  ```
  **结果：0 错误**。

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Built by agricidaniel — Join the AI Marketing Hub community  
🆓 Free  → https://www.skool.com/ai-marketing-hub  
⚡ Pro   → https://www.skool.com/ai-marketing-hub-pro  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
