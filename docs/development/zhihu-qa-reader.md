# 知乎热榜问答详情页阅读体验优化

## Background

在伴随仓库 `RSSHub`（`DIYgod/RSSHub#24043`，自建 `master` @ `ba2f7f7c31`）为 `/zhihu/hot` 补全登录态下的前 3 条高赞回答全文后，知乎热榜 30/30 条均已具备可读正文，但在 `rss-site` 详情页以通用长文模板渲染时存在四个具体阅读问题：

1. 知乎热榜接口每条问题的 `author` 固定为占位词 `"用户"`，导致详情页元信息栏和 JSON-LD 输出无意义作者。
2. 回答正文内部常含 `<h2>`，而 RSSHub 答主标题为 `<h3>`，导致视觉字号与文章目录（`ArticleReadingTools`）层级倒挂。
3. 知乎纯图问题的摘要可能为 `[图片]` 或 `[5 张图片]` 等占位词，直接展示为顶部引用块显得生硬。
4. 知乎回答 HTML 常带有空 `<h2></h2>`、首尾空白 `<p><br /></p>`，且多条高赞回答按普通文章分段展示缺少问答辨识度。

## Scope

- 仅针对 `source === 'zhihu'` 的站内详情页（`/social/zhihu/[slug]`）：
  - 新增纯解析模块 `apps/web/lib/zhihu-qa.ts`：识别经 `renderArticleContent` 消毒后的知乎高赞回答结构，提取可选“问题背景”与每条回答的答主名、赞同数、原回答直链及清洗后的正文 HTML（过滤 `[图片]`/`[N 张图片]` 占位背景、移除空标题与首尾空段落、将回答内部 `h2–h5` 降一级为 `h3–h6`），并提供占位作者 `"用户"` 识别函数。
  - 新增知乎问答渲染组件 `apps/web/components/zhihu-qa-body.tsx`：顶部按需展示“问题背景”引导块，主体以“精选高赞回答”分区逐条展示答主 `<h2>` 标题、赞同数徽章（`tabular-nums`）与“原回答 ↗”外链，复用 `ArticleHtmlBody` 呈现回答正文并自然接入 `ArticleReadingTools` 目录跳转。
  - 在 `apps/web/components/article-reader.tsx` 与 `apps/web/components/article-translation.tsx` 中仅对 `source === 'zhihu'` 接入该问答视图，并隐藏占位作者 `"用户"`；历史或无回答条目自动无感回退现有渲染。
  - 在 `apps/web/app/globals.css` 补充轻量的 `.zhihu-qa-context` / `.zhihu-qa-answer-body` 间距微调，并在 `apps/web/messages/{zh-CN,en}.json` 补齐双语 ICU 文案。
  - 随本 PR 一并提交本轮产出的文档更新：移除外部 Codex 审查要求的规范调整（`AGENTS.md`、`.agents/skills/develop-with-pr/SKILL.md`、`docs/research/rsshub-route-candidates-and-workflow.md`）以及线上空正文排查路线图（[empty-article-content-audit.md](../roadmaps/empty-article-content-audit.md)）。

## Out of scope

- 不改动其它来源（虎扑、B 站、OpenAI 等）的详情页渲染或列表页逻辑。
- 不改动数据库表结构、迁移、Cron 调度或采集管线。
- 不引入任何新的前端 UI 依赖库，不改动已开启的上游 `DIYgod/RSSHub#24043`。

## Acceptance criteria

1. 仅当 `source === 'zhihu'` 且正文包含结构化知乎高赞回答链接（`https://www.zhihu.com/question/<id>/answer/<id>`）时，详情页渲染 `ZhihuQaBody`；其它来源或无回答的知乎旧条目行为完全不变。
2. 当问题背景为 `[图片]` 或 `[N 张图片]` 等纯图占位时，不渲染“问题背景”空块；当存在真实问题描述时，正常渲染“问题背景”区块。
3. 每条回答展示序号、`<h2>` 答主名、赞同数徽章（>0 时）与直达原回答的外链，回答内部 `h2–h5` 降级为 `h3–h6`，空 `<h2></h2>` 与首尾空白段落被清理，目录组件 `ArticleReadingTools` 自动以答主为顶级条目、答主内小标题为次级缩进条目。
4. `source === 'zhihu'` 且 `article.author === '用户'` 时，详情页元数据栏和 JSON-LD 均不输出 `"用户"`。
5. 支持 `zh-CN` / `en` 双语、浅色/深色主题，桌面端与移动端保持 `max-w-[46rem]` 单列不溢出；`pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm --filter @rss-site/web build` 全绿。

## Feasibility

- **可行性结论**：完全可行（Feasible）。
- **架构与约束验证**：
  - `parseZhihuQaContent` 消费的是 `renderArticleContent` 消毒后的白名单 HTML，无额外 XSS 风险；外链仍带 `target="_blank" rel="nofollow noopener noreferrer" data-outbound="true"`，沿用全站外链提示与安全规范。
  - 知乎回答结构由 `RSSHub` `/zhihu/hot` 模板稳定输出，兼容 `<h3>` 与未来可能升级的 `<h2>` 回答标题；若上游结构变化无法匹配，返回 `null` 自动降级回原有 `ArticleHtmlBody`，不会造成白屏或内容丢失。
  - UI 设计复用仓库既有 Tailwind v4 语义 token（`border-border`、`bg-card`、`text-primary`、`text-muted-foreground`、`tabular-nums`）、`lucide-react` 图标与 `next-intl` 文案体系；当前环境未暴露 UI Skills MCP 工具，遵循 `references/ui-quality.md` 回退规则直接沿用仓库既有设计系统，不声称执行了外部 UI Skills MCP 审查。

## Implementation

- `apps/web/lib/zhihu-qa.ts`：实现 `isPlaceholderZhihuAuthor` 与 `parseZhihuQaContent`（兼容 `<h2>`/`<h3>` 回答头、过滤 `[图片]`/`[N 张图片]` 占位背景、清理空标题与首尾空段落、回答内标题降级 `h2–h5 -> h3–h6`）。
- `apps/web/components/zhihu-qa-body.tsx`：实现知乎问答主体组件（可选“问题背景”块 + “精选高赞回答”有序列表 + `ArticleHtmlBody` 复用）。
- `apps/web/components/article-reader.tsx`、`apps/web/components/article-translation.tsx`：仅在 `source === 'zhihu'` 接入 `ZhihuQaBody` 并过滤占位作者 `"用户"`。
- `apps/web/app/globals.css`、`apps/web/messages/{zh-CN,en}.json`：补充问答区块细节样式与双语 ICU 文案。
- `apps/web/lib/zhihu-qa.test.ts`、`apps/web/components/article-translation.interaction.test.tsx`：补充单元测试与交互渲染测试（含真实线上 `/zhihu/hot` 结构回归样本）。

## Verification

- `pnpm exec biome check apps server packages shared`：`363` 文件通过，0 错误。
- `pnpm check-types`：`3/3` 包（`@rss-site/signals`、`@rss-site/api`、`@rss-site/web`）全部通过。
- `pnpm test`：
  - `@rss-site/signals`：`9/9` 通过。
  - `@rss-site/api`：`130/130` 通过。
  - `@rss-site/web`：`218 passed | 22 skipped`（含新增 `apps/web/lib/zhihu-qa.test.ts` 5 项、`apps/web/components/article-translation.interaction.test.tsx` 1 项及 `apps/web/lib/site-i18n.test.tsx` ICU 对齐校验）。
- `pnpm --filter @rss-site/web build`：Turbopack 生产构建通过（`137/137` 静态页 + early-hints + `sw.js`）。
- **浏览器视觉验收**：使用线上实时 `https://rss.ljhboard.cn/zhihu/hot` 数据 + 生产编译 CSS 实渲染验证 4 个视口/状态（桌面 `1280×900` 深色/浅色/无背景过滤、移动端 `390×844` 深色），确认 0 横向溢出、无 `[5 张图片]` 残留、答主 `<h2>` 与赞同徽章/原回答链接排版对齐、对比度清晰。
- **自审结论**：对照 `AGENTS.md`、组件边界与实测数据完成完整 diff 自审，无阻塞项；无衍生新 roadmap（沿用已关联的 [empty-article-content-audit.md](../roadmaps/empty-article-content-audit.md)）。

## Risks

- 若未来知乎或上游 RSSHub 改变回答标题链接格式（不再包含 `https://www.zhihu.com/question/<id>/answer/<id>`），`parseZhihuQaContent` 会返回 `null` 并自动回退至通用 `ArticleHtmlBody`，最坏情况仅为退回普通排版，不会丢失正文。
- 关联路线图：[线上空正文与内容质量治理路线图](../roadmaps/empty-article-content-audit.md)。
