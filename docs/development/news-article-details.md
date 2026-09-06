# 新闻文章详情与摘要

## Background

新闻来源页当前把文章标题直接送往站外原文，因此 `/news/xinhua/[slug]` 等站内详情并不存在；总览页的紧凑列表也没有展示上游已经提供的摘要。`signal_articles` 已保存稳定 UUID 和文章元数据，但现有 RLS 只允许公开读取已发布 AI 事件关联的文章，无法支撑公开新闻详情。

## Scope

- 为新闻条目生成 `/news/[source]/[可读标题--文章UUID]` 站内链接。
- 在新闻总览和来源页展示上游已有摘要；摘要为空时不生成替代文案。
- 详情页展示来源、标题、摘要、真实作者与发布时间，并保留经 `/out` 的“查看原文”入口。
- 增加动态 metadata，并使用稳定 UUID 查询持久化文章。
- 通过版本化迁移开放 `signal_articles` 的匿名与登录用户只读访问，继续禁止公开写入。
- 补充 RLS、路由、数据映射和渲染测试。

## Out of scope

- 不抓取或镜像第三方全文，不生成 AI 摘要，不保存图片二进制。
- 不改抓取来源、Cron、数据保留周期、Cloudflare、ISR 或部署配置。
- 本轮只为新闻分区启用站内文章详情；其他分区仍保持原文跳转。
- 动态 sitemap、robots 与 IndexNow 继续按既有 SEO roadmap 实施。

## Acceptance criteria

- `/news` 中有摘要的新闻显示简要介绍，没有摘要时不出现占位文案。
- `/news/xinhua` 等来源页中，带 `article_id` 的条目进入站内详情；无法关联的条目仍可打开原文。
- 有效详情 URL 返回文章标题、来源、摘要和原文链接；来源或 UUID 无效时进入 Next.js `notFound()`，输出未找到页面和 noindex。
- 标题变化不影响详情查询，因为 URL 的稳定部分是文章 UUID。
- `anon` 与 `authenticated` 只能 SELECT `signal_articles`，不能 INSERT、UPDATE、DELETE 或 TRUNCATE。
- Web 测试、格式、lint、类型检查与生产构建通过。

## Interface contract

- 读者：正在快速浏览国内新闻、希望先了解大意再决定是否阅读全文的人。
- 主操作：阅读标题和真实摘要，随后进入详情或打开原文。
- 层级：文章标题是焦点；来源和时间为辅助信息；“查看原文”是唯一主按钮。
- 视觉：继续使用现有纸白/深蓝背景、冷蓝强调、单列内容和无图片设计，不增加卡片、渐变或装饰文案。
- 排版与密度：详情正文限制阅读宽度；摘要使用宽松行高；移动端自然换行，交互目标至少 44px。

## Feasibility

结论：可行。`hot_items.article_id` 已完成非空回填，`signal_articles.id` 可直接作为稳定标识，不需要新增 slug 字段或重复保存标题。Next.js 16 动态路由通过 Promise `params` 读取 source/slug，`generateMetadata` 可复用同一文章读取结果。

UI Skills registry 未暴露 `dammyjay93/interface-design` 与 `ibelick/baseline-ui` 的读取工具；本轮沿用已确认的 `frontend-design`、仓库 React Aria/Tailwind 设计系统和 UI quality 清单，不声明完成外部 UI Skills 审查。

## Verification

- 全仓格式、lint、类型检查、API 54 项测试、Web 60 项测试与 Next 16.3.4 生产构建通过。
- 生产构建识别 `/news/[source]/[slug]`。纯 HTTP 读取云端真实数据：`/news` 与 `/news/xinhua` 均为 200；总览含 3 条新华社详情链接，来源页含 30 条，抽查详情为 200 且包含标题、摘要和原文入口。
- 应用迁移前，公开客户端可读取新华社热点和摘要，但无法读取关联持久化文章；应用 `20260906022000` 后，同一记录可见且来源、标题一致。迁移已原子写入云端迁移历史。
- 云端复核时共有 838 条持久化文章；分别 `SET LOCAL ROLE anon/authenticated` 查询，均可读取 412 条新闻，INSERT、UPDATE、DELETE、TRUNCATE 权限全部为 false。
- pgTAP 文件补充两个角色的公开读取和禁止修改断言；本轮未在本地 Docker 执行 pgTAP，以云端实际角色读取和权限核验为验收依据。
- 无效 slug 通过 `notFound()` 显示未找到页面并注入 noindex；由于现有 loading 流式输出已经开始，HTTP 状态为 200（Next.js 流式未找到行为），没有宣称硬 404。
- 未操作可见浏览器；响应式与明暗主题按已有 tokens 和代码检查，未完成截图视觉验收。

## Review

- Standards：复用既有来源、页面外壳、按钮样式和公开 Supabase 客户端。读取按 UUID、news 分区、source 三重约束；数据库异常抛给错误边界，缺失记录进入 notFound。
- Spec：新闻总览展示已有摘要，来源列表进入持久化详情；空摘要保持为空，其他分区保持现有跳转。
- Blocking resolved：原文通知页只接受分区返回地址，详情的返回参数已改为 `/news`；总览摘要移除与 line-clamp 冲突的 block 样式。
- Accepted follow-up：canonical 仅在配置有效 `SITE_URL` 时生成；上线域名、动态 sitemap、ISR 和清理后的硬 404/410 按既有 [SEO roadmap](../roadmaps/seo-cache-and-indexing.md) 实施。
- UI 继续使用已确认的单列、冷蓝强调、无图设计；本次增加阅读宽度限制与详情骨架，不引入新的组件库。

## Risks

- 详情保存的是上游摘要，不是全文；原文入口保留。
- 既有保留任务最终清理文章后，旧 URL 将进入未找到页；当前 UUID 稳定性不代表永久保留数据。
- 当前详情为动态服务端读取；ISR、sitemap 和缓存失效尚未在本轮实现。
