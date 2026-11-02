# 知乎 Cookie 每日自动刷新

## Background

用户要求在 rss-site API 中实现刷新知乎 Cookie，并优先使用 Cloudflare Worker 原生 Cron，每天一次。沿用已核对的两步 HTTP 协议：取得 refresh_token，再提交签名、ZseV4 加密表单，接收新的 z_c0；验证后更新 RSSHub 在 Vercel 的生产环境变量并重部署。

## Scope

- 原生 scheduled 入口；每天北京时间 04:00（UTC 20:00）触发。
- 受 CRON_SECRET 保护的手动 POST /cron/maintenance/zhihu-cookie，用于首次验收和失败重试。
- 使用现有 Supabase Vault 加密保存最新凭证与未完成的部署状态；不使用 Supabase Cron。
- 两步刷新、登录态验证、Vercel 变量更新与部署、失败后的继续处理。

## Out of scope

新增来源、抓取知乎回答全文、自动扫码/验证码、修改现有来源 Cron，以及未经真实验收启用自动刷新。

## Acceptance criteria

- Worker 原生 Cron 与手动接口执行同一任务；手动接口拒绝缺失/错误鉴权。
- 签名/加密与参考实现的固定输入输出一致；空或删除 Cookie、错误账号和上游错误不被当作成功。
- 最新凭证在 Vercel 调用前持久化；Vercel 失败后重试同一凭证，不重新轮换。
- 跨 Worker 实例互斥，不依赖进程内锁；返回与日志不包含凭证或上游响应。
- 新部署只有 READY 且 RSSHub 登录态验证成功，才报告发布完成。
- 类型、API 回归、Worker 打包与运行时检查通过；缺少生产凭证时明确记录未执行的验收。

## Feasibility

复用现有 Hono Worker、Hyperdrive 和 Vault。工作区 feat/zhihu-cookie-refresh 为干净分支，基于已 fetch 的 origin/master（e87ade1）；原工作区的其他文档和 scratch 不动。CONTEXT.md 不存在。既有研究与用户指令足以确定后端范围，无 UI 变更。

Cloudflare 原生 Cron 支持此频率，免费账号 5 个 Cron，免费每次 10 ms CPU，等待网络不计 CPU；付费每日任务最高 15 分钟 CPU，Cron 墙钟上限 15 分钟。[限制](https://developers.cloudflare.com/workers/platform/limits/)、[scheduled](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)。调度实现可行；实际知乎出口可达性、账号可刷新性和免费 CPU 预算必须实测，不能用普通 Node 测试代替。

不引入浏览器或原生 Python 库；签名用 Web Crypto，ZseV4 用纯 TypeScript。参考实现的 browser TLS 模拟不能由 Worker fetch 等价复制，403 时应报告失败而非承诺绕过。

Vault 状态不通过公开 API 暴露。使用事务级 advisory lock 覆盖本次任务，另一个连接提交凭证状态，以免后续 Vercel 失败导致轮换后的凭证回滚。锁在数据库事务结束时释放，适应 Hyperdrive 事务池，不使用会话级锁。

## Implementation

已实现原生 `scheduled` 与鉴权手动接口，共用同一任务。`triggers.crons` 为 `0 20 * * *`，每天北京时间 04:00。`ZHIHU_REFRESH_ENABLED=false` 时自动任务直接返回，手动接口仍可验收；没有添加 Supabase Cron。

两步刷新只接受响应 Set-Cookie 中有效的 `z_c0`，保留其他 Cookie，验证账号 ID 后才发布。ZseV4 移植自 MIT 参考实现，许可证保留在 `maintenance/THIRD_PARTY_LICENSES.md`；固定样本与独立 Python 实现一致。

凭证和候选凭证存入现有 Vault 的 `zhihu_cookie_refresh_state` JSON secret。事务 advisory lock 防止并发刷新，独立连接提交状态，避免后续网络失败回滚已轮换凭证。重试先恢复候选验证或未完成部署；23 小时内重复调用不再次轮换。

Vercel 仅更新 Production 专用 `ZHIHU_COOKIES`，用原生产部署的名称和 commit 发起重部署。首次返回 HTTP 202 / `deployment_pending`；后续调用检查 READY 和 RSSHub `/api/zhihu/check-cookie` 后才返回 `published`。失败部署重试同一凭证，构建中的部署不再次刷新。

### 配置与启用

1. 通过 `pnpm --filter @rss-site/api exec wrangler secret put ZHIHU_COOKIES` 和 `pnpm --filter @rss-site/api exec wrangler secret put VERCEL_API_TOKEN` 交互输入 secret，禁止将值放入命令行或提交。初始 Cookie 应与当前 RSSHub 完整 Cookie 一致，包含 `z_c0`；Vercel token 需具备该项目环境变量和部署权限
2. 项目与 team ID 已按现有 `rss-hub` 项目配置；保留已有 `CRON_SECRET`、`REVALIDATE_SECRET` 和 Hyperdrive，无需新增 migration
3. 合并后部署 API，保持自动开关关闭，用服务端 `CRON_SECRET` 的 Bearer 鉴权调用 `POST /cron/maintenance/zhihu-cookie`
4. 返回 202 后等待 Vercel 构建，再调用直到返回 200 / `published`；记录非敏感 HTTP 状态、部署 ID、时间和登录检查结果
5. 验收成功后设置 `ZHIHU_REFRESH_ENABLED=true` 并重新部署，检查 Cloudflare Cron Trigger 和下一次运行结果

Vault 有状态后，Worker 的 Cookie secret 只用于首次初始化，更新 seed 不会覆盖最新凭证。重新登录时先关闭自动开关、等待在途任务结束并停止手动调用，再通过安全管理通道将 Vault 该 secret 重置为仅含新完整 Cookie 的 `{ "cookie": "<new-cookie>" }`，重新手动验收。不得在运行中修改 Vault。

返回与 scheduled 日志只含固定错误码、状态与部署 ID，未增加告警或自动登录流程。

## Verification

- `pnpm --filter @rss-site/api test`：15 个文件、146 项通过，覆盖原生 Cron 开关、接口鉴权、脱敏、签名向量、空/删除/过期 Cookie、错误账号、锁竞争、失败恢复、每日冷却和部署状态
- `pnpm check-types`：API、signals、Web 三个工作区通过
- `pnpm --filter @rss-site/api deploy:check`：Worker dry-run 通过，606.54 KiB / gzip 134.63 KiB，没有生产部署
- 本地 workerd 实测 Web Crypto HMAC、ZseV4 固定样本、两次模拟 HTTP 和 `getSetCookie()` 通过；三次调用墙钟耗时 5 / 3 / 1 ms，不代表整个任务 CPU 使用量，未包含数据库和真实网络
- 修改文件 Biome 检查通过；Cloudflare 自动生成 runtime 类型的既有 lint warnings 保留
- Standards / Spec 自评完成，修正 Cookie 删除属性检测、释放未消费响应、使用部署名称而非 project ID；无已接受的实现后续项，不创建空 roadmap
- 未执行真实知乎刷新、云端 Vault 锁/持久化验收、Vercel 更新或生产 Cron；自动开关关闭，真实账号和完整 CPU 使用量验证仍为启用条件

## Risks

知乎未公开认证协议可能变化；旧会话必须仍可刷新。Worker 的网络/TLS 身份与参考实现不同。部署有异步状态，需保留新凭证和 pending 状态以供下次恢复；不把部署请求接受当作已上线。

每天一次适合保活与轮换检查，但无法保证会话持续有效；401、403 或验证码失败需查看固定错误码并人工重新登录。免费套餐 10 ms CPU 是否足够需完整任务实测；超限需付费 Worker 额度。数据库不可用时不开始刷新；取得新凭证后保存失败的窗口无法完全消除。

仅每日 Cron 时，新部署验收通常在次日继续，期间 Vercel 自行完成构建和域名切换；需要即时确认可重复调用手动接口。手动修改 Vault 或其他发布系统改变生产部署不受本任务锁控制，应避免重叠操作。
