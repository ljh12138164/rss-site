# 文章翻译功能调研与可行性评审

## Background

本项目（rss-site）聚合了国内外科技、AI、开源与资讯平台的数据（如 GitHub Blog、OpenAI、Anthropic、Google AI、Hacker News 等）。对于海外英文资讯与深度文章，中文用户在站内阅读时存在语言障碍。

用户提出需求：**调研文章的翻译功能实现，且明确要求以免费方案为主**。

本调研针对此目标，系统评估当前主流免费翻译技术方案、核心技术瓶颈（如 HTML 富文本结构保全、长文 Token/Payload 上限、并发限流与缓存机制）、架构落地形态，并给出最优实现方案与验证规划。

---

## 免费方案全景调研与选型评估

经过对行业现有免费方案的深度对比与验证，主要分为四大技术路线：

### 1. 现代化大模型免费层（LLM Free Tiers / Zero-Cost APIs）⭐ 综合最优

| 方案 | 提供商 | 免费额度 / 政策 | 翻译质量与长文能力 | 网络环境要求 | 综合评分与定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **智谱 GLM-4-Flash** | 智谱 BigModel | **官方永久免费**（0 成本调用） | 极高，128k 超大上下文，中文地道，懂技术行话 | **国内直连，高可靠** | ⭐⭐⭐⭐⭐ **国内首选**，最适合本项目服务端默认配置 |
| **Google Gemini 2.0 Flash** | Google AI Studio | **完全免费**（15 RPM, 1,500 RPD） | 顶尖，1M 上下文，HTML 结构指令遵循极佳 | 需要海外出口或反代（Vercel 环境直连） | ⭐⭐⭐⭐⭐ **海外部署首选**，适合海外 API/Vercel 环境 |
| **百度千帆 ERNIE-Speed/Lite** | 百度智能云 | **永久免费** | 良好，中文通顺 | 国内直连 | ⭐⭐⭐⭐ 备用方案 |
| **Groq Llama-3.3-70B** | Groq Cloud | **免费层**（30 RPM, 14.4k RPD） | 极快（300+ t/s），英文理解优秀 | 海外节点 | ⭐⭐⭐⭐ 极速备用 |

**优势总结**：
- **HTML 结构保全度极高**：通过严格的 System Prompt 约束（“仅翻译文本节点，禁止修改任何标签、属性和属性值，禁止翻译 pre/code 内容”），大模型能够完美输出合法且未破坏排版的 HTML。
- **语境理解力**：在技术术语、专业代码库、极客行话翻译上显著优于传统逐字机器翻译。

---

### 2. 专业机器翻译平台的免费开发者层（Dedicated MT Free Tier）

| 方案 | 提供商 | 免费额度 | 优势 | 瓶颈与限制 |
| :--- | :--- | :--- | :--- | :--- |
| **Azure 翻译服务 (F0)** | 微软 Azure | 200 万字符 / 月 | 原生支持 `textType: 'html'`，自动避开 HTML 标签 | 需要绑定信用卡；200 万字符约仅够 100-150 篇长文，超出后停机或扣费 |
| **DeepL API Free** | DeepL | 50 万字符 / 月 | 翻译质量业界顶尖，支持 XML/HTML 标签跳过 | 注册难度极高（需海外信用卡严格风控）；50 万字符仅够约 25-40 篇长文 |

---

### 3. 免 Key / 逆向公共翻译接口（不推荐用于生产）

- **Google 免 Key 逆向接口**（`translate.googleapis.com`） / **Edge 朗读翻译逆向** / **自建 DeepLX**：
  - 虽然完全零门槛，但属于未经授权的逆向调用，极易触发 HTTP 429 / 403 封锁；国内网络无法直连 Google；且**无法稳定保全 HTML 富文本标签**（经常把标签转义或错位），极易导致排版崩溃或 XSS 隐患。
  - **结论：明确排除在核心生产依赖之外。**

---

### 4. 浏览器端原生翻译能力（Progressive Enhancement 渐进增强）

- **Chrome Built-in AI Translation API (`window.translation` / Gemini Nano)**:
  - 优点：100% 免费，纯端侧运行，零服务器成本，零隐私泄露。
  - 缺点：目前仅在最新 Chromium 实验版本（Origin Trial / Experimental Flags）中可用，Safari、Firefox、iOS 及移动端微信内置浏览器均不可用。
  - **结论：可作为前端渐进增强（若浏览器支持且已下载本地模型则优先端侧翻译），但必须有服务端统一方案作为基石。**

---

## 架构方案对比与推荐

### 三种触发与存储模式对比

1. **模式 A：采集期全量预翻译（Eager Ingestion Translation）**
   - 做法：Cron 抓取到英文文章时立即翻译并存库。
   - 缺陷：大量非热点或低阅读频次的长文空耗免费 API 额度，大幅拖慢 Cron 任务执行时间，易导致 Cron 超时。
2. **模式 B：纯前端无状态实时翻译（Stateless Client-side Translation）**
   - 做法：每个用户访问时都在浏览器临时发起请求，不存库。
   - 缺陷：重复访问重复调用，免费额度极快被打爆，每次进入页面都要等待数秒。
3. **模式 C：服务端按需翻译 + 数据库持久化沉淀（On-Demand with DB Persistence） ⭐ 强烈推荐**
   - 做法：
     1. 默认展示原文（保持现有 SSR/ISR 秒开和纯净体验）。
     2. 用户首次在文章页点击“翻译为中文”时，前端请求 `/api/translate`。
     3. 服务端查询数据库缓存：
        - 若已存在该文章译文，直接 0 延迟返回；
        - 若未翻译，服务端调用免费 LLM（智谱 GLM-4-Flash 或 Gemini 2.0 Flash）完成结构化翻译，并将译文写入数据库 `article_translations` 表，同时流式或完整返回给客户端。
     4. 后续任何其他用户访问该文章的译文，**直接从数据库命中缓存**，0 消耗外部 API 额度！

---

## 核心技术瓶颈深度评审与解决方案 (Technical Bottlenecks & Mitigations)

### 难点 1：HTML 富文本标签保全与防错位破坏 (DOM Preservation & XSS Safety)
- **难点**：`contentHtml` 含有复杂的段落、列表、代码块（`pre`, `code`）、表格与链接。传统机翻经常破坏闭合标签、把链接地址篡改，或将代码翻译成中文。
- **解决方案**：
  1. **Prompt 边界防护**：在服务端设计严格的 System Prompt，要求模型：
     - 输出必须保持原 HTML 的所有标签树形层次和属性不变；
     - 绝对保留 `<code>` 与 `<pre>` 标签内的代码原样不翻；
     - 仅翻译标签间的普通文本节点；
  2. **双重清洗保证**：大模型输出的翻译结果在入库和渲染前，必须再次通过 `apps/web/lib/article-content.ts` 中的 `renderArticleContent()` 严格白名单过滤，彻底防范注入与损坏。

### 难点 2：长文章 Token 上限与输出截断 (Output Token Truncation)
- **难点**：大模型单次生成通常限制在 4096 或 8192 tokens。如果文章达到万字以上，大模型生成到一半会因超长直接截断，导致文章后半部分丢失。
- **解决方案**：
  - **块级安全切片（Semantic Chunking）**：对于超出 6,000 字符的超长 HTML，服务端在顶层块标签（`</p>`, `</h2>`, `</blockquote>`）处做安全切片，分段送译并无缝拼接；
  - 短于 6,000 字符的常规文章（占 95% 以上）直接单次完整调用。

### 难点 3：免费 API 的速率限制与并发雪崩 (Rate Limit & Thundering Herd)
- **难点**：多名用户同时打开一篇新发布的英文热文并点击翻译时，可能发起重复的第三方 API 调用，耗尽免费并发配额（如 15 RPM）。
- **解决方案**：
  - **SingleFlight / 请求去重机制**：在服务端针对同一个 `article_id` 维护正在进行中的翻译 Promise。多并发请求命中同一篇文章时，共享同一个翻译任务，避免重复调用外部 API。

### 难点 4：译文存储与数据库 Schema 演进
- **难点**：避免污染或锁死现有 `signal_articles` 核心抓取表。
- **解决方案**：
  - 采用**独立外键表**设计，新建 `article_translations`：
    ```sql
    CREATE TABLE article_translations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      article_id UUID NOT NULL REFERENCES signal_articles(id) ON DELETE CASCADE,
      language TEXT NOT NULL DEFAULT 'zh',
      title TEXT NOT NULL,
      summary TEXT,
      content_html TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (article_id, language)
    );
    CREATE INDEX idx_article_translations_article_id ON article_translations(article_id);
    ```
  - **解耦性**：对现有 `signal_articles` 和 Cron 抓取流程完全无侵入，扩展性极佳。

---

## UI 交付界面与交互设计 (UI Delivery Surface)

1. **界面入口**：
   - 针对非中文来源（或由程序检测出的英文文章），在 `ArticleReader`（文章阅读页 `/[section]/[source]/[slug]`）头部显示翻译控制栏。
2. **交互状态**：
   - **未翻译状态**：提供直观的“翻译为中文 (AI)”按钮（带 Languages/Globe 图标）。
   - **翻译中状态**：按钮变为“正在翻译中...”，正文区域显示轻量骨架加载效果。
   - **已翻译状态**：
     - 提供三态切换按钮组（Segmented Control）：
       - `[中文]`：全文显示中文翻译（代码和特殊结构保持原样）。
       - `[双语对照]`：英文原句/段落与中文段落上下对照，极大提升极客体验。
       - `[原文]`：还原至初始英文。
   - **失败状态**：提供轻量重试按钮与错误提示，不影响原文正常阅读。
3. **视觉风格与响应式规范**：
   - 沿用当前项目的 Tailwind CSS v4 设计规范，完美适配明/暗两套主题；
   - 严格适配桌面端（居中 `max-w-[46rem]`）与移动端（390px 触摸区域，按钮高度保持 >= 44px）。

---

## 结论与后续落地步骤

- **可行性结论**：**完全可行（Feasible）**。
- **首选落地组合**：
  - 核心翻译引擎：**智谱 GLM-4-Flash**（国内直连永久免费，无网络门槛，128k 上下文）作为默认配置，兼容 **Google Gemini 2.0 Flash**（海外直连免费层）。
  - 架构机制：**服务端按需调用 + Supabase `article_translations` 持久化沉淀 + 双重 HTML 安全净化**。
  - 前端呈现：**三态切换（译文 / 双语对照 / 原文）**。
