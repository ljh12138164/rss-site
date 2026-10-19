# Worker 缓存刷新兼容性修复

## Background

2026-10-19 回归 Antigravity 生产上线时，采集成功但 `publication=failed`，来源页仍显示“暂无内容”。远程 Cloudflare 预览复现：`fetch` 使用 `redirect: 'error'` 会同步抛出 `Invalid redirect value`，请求未到达 Web。生产 Web/API 凭据在内存中核对一致，未输出密钥；服务器自身调用刷新接口 HTTP 200。

## Scope

只修复采集后通知 Web 的重定向模式，增加兼容性与重定向拒绝回归，记录 Antigravity 生产验收。

## Out of scope

UI、数据库结构、通知重试机制、CLI 专用发布流程、其他来源配置与生产自动合并部署。

## Acceptance criteria

- Cloudflare Workers 能发出通知，真实 Web 返回 `revalidated: true`。
- 保持禁止重定向携带凭据，301/302/307/308 均返回 `failed`。
- 原有未变化跳过、分批通知和 Skills 行为保持通过。
- 记录正文、封面和列表/阅读页的生产验证；修复发布前不将自动刷新判定为通过。

## Feasibility

可行。复用 `list-page-isr.md`、`cloudflare-worker-api.md` 与 `edge-cache-indexnow.md` 的既有通知协议及禁止转发凭据决定，无新增架构或 UI 决策。Workers 远程预览直接确认运行时不支持 `error`。使用 `manual` 后原有 `!response.ok` 会拒绝 3xx，不跟随 Location；不需额外分支或依赖。只更改一个 Fetch 配置字段，保持五秒超时和事务后通知顺序。

## Implementation

- 基于最新 `origin/master` `0ffbe59` 创建 `feat/fix-worker-revalidation`。
- `publishSourceUpdate` 使用 `redirect: 'manual'`。
- 既有测试模拟 Workers 拒绝 `error`，并覆盖四类跳转；先验证失败再修复。
- Antigravity 的迁移、云端采集和页面人工刷新证据见 [接入记录](antigravity-feed.md)。
- 修复 PR：https://github.com/ljh12138164/rss-site/pull/46。

## Verification

- 生产 Worker 等价远程预览：旧模式 HTTP 请求前抛错，elapsed 0 ms。
- 修改前回归 8 项中 6 项失败，包含正常批量/Skills 通知与重定向模式检查。
- 修复后直接导入本分支 `publishSourceUpdate` 的 Cloudflare 远程预览成功刷新正式 Web，返回 `publication=revalidated`，耗时 1,357 ms；未修改生产 Worker 代码。
- `pnpm --filter @rss-site/api test`：11 文件、111 项全部通过。
- API 类型检查、Worker `deploy:check` 打包、两个变更代码文件 Biome、`git diff --check` 通过。
- Standards/Spec 自审：一行运行时代码变更，保持不跟随跳转、五秒超时、原有通知协议及分批；无阻塞发现或接受的后续项，不创建空 roadmap。

## Risks

修复需合并并由 Cloudflare 构建发布后，才能确认正式采集 API 的 `publication=revalidated`。本轮手动刷新已恢复页面，但不代表自动刷新修复已上线。
