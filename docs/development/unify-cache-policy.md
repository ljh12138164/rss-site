# 统一全站缓存与边缘失效 (Unify Cache Policy & Edge Revalidation)

## Background

在完成信号源注册中心、服务端采集管道与前端读取层收拢之后，全站的缓存配置与失效逻辑仍存在散落问题：
1. **ISR revalidate 常量硬编码**：全站 26 个路由页面与 Route Handler 中散落着直接硬编码的数值（如 `7200`、`21600`、`86400`）。若调整刷新策略，需要跨 20+ 个文件逐一手改。
2. **特殊失效路由分支散落**：在 `app/api/revalidate/route.ts` 中，对 `skills` 专区与 `github` 开源榜的处理依赖多处特定的 `if (section === '/skills')` 与 `source === 'github'` 条件判断，缺少统一的路径解析器。

## Scope

1. **集中声明全站缓存策略与常量**：
   - 在 `apps/web/lib/cache.ts` 中统一定义 `CACHE_TTL`（`FAST = 7200` (2h)、`NORMAL = 21600` (6h)、`DAILY = 86400` (24h) 等）以及统一的 HTTP `Cache-Control` 头常量 `CACHE_HEADERS`。
   - 在各 `page.tsx` 与 Route Handler 中统一引用集中定义的 TTL 常量。
2. **统一边缘失效路径生成器**：
   - 在 `apps/web/lib/revalidate-paths.ts` 中抽取高内聚纯函数 `resolveRevalidationPaths`，根据 `section`, `source`, `eventSlugs` 自动推导需要失效的静态页面和通配页面，并处理 GitHub 开源榜与 Skills 等专区特化。
   - 在 `app/api/revalidate/route.ts` 中接入 `@rss-site/signals` 校验来源合法性，并使用 `resolveRevalidationPaths` 替代手工拼装路径。
3. **验证与回归**：
   - 验证 `route.test.ts` 中的所有断言完全兼容，包括外部发布通知与标签失效。
   - 运行全仓类型检查、单元测试与生产构建。

## Out of scope

- 变更 Cloudflare 边缘 Cache Rules 配置。
- 变更 API 服务端或 Worker 端逻辑。

## Acceptance criteria

1. 全站各路由页面引用统一的缓存 TTL 常量。
2. `apps/web/app/api/revalidate/route.ts` 消除裸写硬编码逻辑，接入 `resolveRevalidationPaths`。
3. `pnpm check-types` 零错误。
4. `pnpm test` 全量单测通过。
5. `pnpm build` 生产构建成功。

## Feasibility

- **纯代码重构**：Next.js Turbopack 编译时支持模块导出的常量，零运行时破坏性风险。
- **结论**：Feasible（可行）。

## Implementation

1. 创建 `apps/web/lib/cache.ts`。
2. 创建 `apps/web/lib/revalidate-paths.ts` 并在 `revalidate/route.ts` 中接入。
3. 规范化各页面中的 `export const revalidate` 常量。
4. 运行全仓测试与构建验证。

## Verification

1. **单测套件 (`pnpm test`)**：
   - `@rss-site/signals`: 7 项全部通过。
   - `@rss-site/api`: 10 个测试套件，83 项全部通过。
   - `@rss-site/web`: 52 个测试套件，180 项全部通过（新增 4 项 `revalidate-paths.test.ts` 纯函数单测）。
   - 全仓共 63 个测试套件，270 项测试 100% 通过。
2. **全仓类型检查 (`pnpm check-types`)**：
   - `@rss-site/signals`, `@rss-site/api`, `@rss-site/web` 3 个包全部零类型错误。
3. **生产构建 (`pnpm build`)**：
   - Next.js Turbopack 生产构建成功，57/57 静态页面全量生成，Early hints 注入正常。
4. **格式检查 (`pnpm exec biome check`)**：
   - 全部变更代码通过 Biome 检查，0 错误，0 警告。

## Risks

- **Next.js 路由段配置解析**：经生产构建验证，全仓 57 个静态页面全量成功生成预渲染 HTML，证明集中式缓存定义与路径解析表现稳定。

