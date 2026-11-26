# 规范化文章 Slug 编码长度并消除多重编码死循环

## Background

生产日志显示，`rss-site-web-1` 频繁记录 `Failed to update prerender cache ... [Error: ENAMETOOLONG]`，由两层原因叠加引起：

1. **多重 URL 编码脏链接返回 200**：[`apps/web/proxy.ts`](../../apps/web/proxy.ts) 仅对文章路由段执行一次 `decodeURIComponent`，而 [`parseArticleIdFromSlug`](../../apps/web/lib/article-route.ts) 仅校验末尾 `--<uuid>`，导致 `YandexBot` / `BingBot` 请求 `/news/baidu/%252525E9...--<uuid>` 时仍放行进入 Next.js SSR 并返回 `200`，超长编码路径写入磁盘缓存失败且持续穿透查库。
2. **超长中文标题单次编码也会超 Linux `NAME_MAX`（255 字节）**：[`createReadableSlug`](../../apps/web/lib/article-route.ts) 原逻辑按最多 56 个字符截断；中文每字 UTF-8 百分号编码占 9 字节，30 字以上即可超过 255 字节（叠加 `--<uuid>` 38 字节与 Next.js `.segments` / `.prefetch.rsc` 后缀），同样触发 `ENAMETOOLONG`。

## Scope

- 在 [`apps/web/lib/article-route.ts`](../../apps/web/lib/article-route.ts) 中：
  - 将 `createReadableSlug` 改为同时受字符数上限（`56`）与 UTF-8 百分号编码字节上限（`MAX_ENCODED_SLUG_PREFIX_BYTES = 160`）约束，保证完整编码后 slug（含 `--<uuid>` 38 字节）不超过 `198` 字节，叠加 Next.js 缓存后缀仍远低于 Linux 255 字节限制。
  - 新增 `normalizeArticleSlugSegment`，对多重编码（含 `%25`）迭代解码（上限 20 层）并规范化为单次编码且满足长度上限的 canonical slug；对超长旧链接也截断至同口径 canonical slug；对畸形编码或超层数嵌套直接判为 `invalid`。
- 在 [`apps/web/proxy.ts`](../../apps/web/proxy.ts) 中接入 `normalizeArticleSlugSegment`：
  - `invalid` 直接返回 `404`（`X-Robots-Tag: noindex`、`Cache-Control: no-store`），不查询数据库；
  - `redirect` 直接返回相对 `Location` 的 `301`（`Cache-Control: public, max-age=86400, s-maxage=86400`），不查询数据库；
  - `ok` 保持既有流程与数据库状态校验不变。
- 在 [`apps/web/lib/article-route.test.ts`](../../apps/web/lib/article-route.test.ts) 与 [`apps/web/proxy.test.ts`](../../apps/web/proxy.test.ts) 补充长中文字节截断、多重编码 301、历史超长单次编码 301 与超层数嵌套 404 的单元测试。

## Out of scope

- 不修改文章详情页按末尾 UUID 查库的机制，确保历史链接完全兼容。
- 不修改 AI 事件路由（`/ai/events/:slug` 已有严格的 ASCII + 200 字符校验）。
- 不修改页面 UI 或数据库结构。

## Acceptance criteria

1. `createArticlePath` 生成的任意长中文/英文文章 slug，其 `encodeURIComponent(slug).length <= 198`。
2. `proxy` 遇到 `%25` 多重编码或超过 198 字节的历史长中文文章 URL 时，在查询数据库之前返回 `301` 指向规范单次编码短 URL，且二次访问目标 URL 不再重定向（无环）。
3. 畸形编码或超过 20 层嵌套编码的文章 URL 直接返回 `404` + `X-Robots-Tag: noindex`，不查询数据库。
4. 全仓 `lint`、`check-types`、单元测试与 Next.js 生产构建全部通过。

## Feasibility

- 结论：**Feasible**。
- 关键设计考量：
  - `301` 使用相对路径 `Location: /${section}/${encodeURIComponent(sourceId)}/${canonicalEncoded}${search}`，避免在 Docker + Nginx 反代环境下泄露内部回环主机名，同时 `section` 与 `sourceId` 已通过 `articleSource()` 白名单校验，无开放重定向风险。
  - 截断遍历使用 `for (const char of normalized)` 按完整 Unicode 码点推进，不会截断代理对（emoji 等）。
  - 返回 `redirect` 前校验 `canonicalEncoded !== encodedSlug`，从结构上杜绝重定向死循环。

## Implementation

- [`apps/web/lib/article-route.ts`](../../apps/web/lib/article-route.ts)：导出 `MAX_ENCODED_SLUG_PREFIX_BYTES`、`MAX_ENCODED_ARTICLE_SLUG_BYTES` 与 `normalizeArticleSlugSegment`，并在 `createReadableSlug` 中按编码字节数与字符数双重上限截断。
- [`apps/web/proxy.ts`](../../apps/web/proxy.ts)：文章详情路由接入 `normalizeArticleSlugSegment`，在查库前执行 `404` / `301` 处理。
- [`apps/web/lib/article-route.test.ts`](../../apps/web/lib/article-route.test.ts) 与 [`apps/web/proxy.test.ts`](../../apps/web/proxy.test.ts)：新增 6 项单测覆盖边界场景。

## Verification

- `pnpm lint`（`biome check .`）：`393` 文件通过，0 错误。
- `pnpm check-types`：`3/3` 包全部通过。
- `pnpm test`：
  - `@rss-site/signals`：`9 passed`
  - `@rss-site/api`：`130 passed`
  - `@rss-site/web`：`209 passed | 22 skipped`（含 `article-route.test.ts` `7/7`、`proxy.test.ts` `13/13`）
- `SITE_URL=https://news.ljhboard.cn pnpm --filter @rss-site/web build`：`137/137` 静态页 + `generate-early-hints.mjs` + `sw.js` 全部通过。
- 自查覆盖多重编码、超长中文、字面 `%`、坏 UTF-8、超 20 层嵌套与相对 `Location` 安全性，无阻塞项或衍生 roadmap。

## Risks

- 历史已收录的超长中文 URL（>198 编码字节）会通过 `301` 永久重定向至缩短后的同前缀 + 同 UUID 规范链接，权重可平稳转移，且不会再触发 `ENAMETOOLONG`。
- 含合法 UUID 但文章已删除的多重编码 URL 会先 301 至规范短链接，随后在规范链接返回 `404`/`410` + `noindex`，不增加额外数据库压力。
