# 边缘缓存与索引通知

Related roadmap: [SEO、缓存与索引发布](../roadmaps/seo-cache-and-indexing.md)

## Background
用户确认 API 已发布并要求继续路线图。复用 SEO roadmap P6–P7 已确认方案及现有受保护 revalidate 接口；不新增 UI。

## Scope
Next 失效后按本站 URL 清除 Cloudflare，有限预热，后台提交 IndexNow；公开根级验证文件；分别记录结果。同步真实来源门禁和正文验证证据。

## Out of scope
前端生产部署、DNS、Dashboard Cache Rules、自动生成事件、Search Console 账号操作。保留已有功能分支与不推送约定。

## Acceptance criteria
鉴权失败或非法范围不执行发布；只接受本站公开路径，不接受第三方 URL、查询参数、片段或路径穿越。Cloudflare 按 URL 分批清除，失败时不预热旧边缘内容。预热顺序执行且有总量上限；IndexNow 有限重试，失败不改变 ISR 成功响应。根级 UTF-8 验证文件仅返回配置的验证值。日志无凭据。

## Feasibility
可行。已读取安装版 Next after/revalidatePath 指南；after 在响应后保留异步工作，适合现有单实例 Node 目标。外部 HTTP 均限制超时并禁止跟随重定向，防止凭据转发。Cloudflare/IndexNow 未配置时禁用，不影响 ISR。实际公网命中、域名和索引接收验收依赖前端上线与服务端配置。

参考：[Cloudflare purge API](https://developers.cloudflare.com/api/resources/cache/methods/purge/)、[IndexNow 协议](https://www.indexnow.org/documentation)。

## Implementation
原有 revalidate 范围保持兼容；后台任务仅由成功鉴权及失效的请求触发。API 在事务中比较前后榜单，只有标题、链接、摘要、作者、时间、正文、图片、排名、增删发生变化时通知 Web；AI 文章变化同时查出已发布的关联事件。Web 完成 Next 失效后，按 30 个 URL 分批清除 Cloudflare，顺序预热最多 5 个 URL，再批量通知 IndexNow。外部请求拒绝重定向、单次 3 秒、整批 25 秒；未配置时明确禁用。

IndexNow 使用 `/indexnow.txt` 验证文件和显式 `keyLocation`。发布入口只接受注册分区/来源及合法事件 slug，限制每次最多 100 个事件；API 对更多事件分批通知。每次结果使用采集 batch ID 关联，日志只含数量、HTTP 状态、步骤状态和时间。

## Verification
2026-09-08 用户确认 API 已发布，health HTTP 200。完整 `setup:cron` 从第一路执行，26 路成功后在金十停止；金十重试三次均因 4 个上游条目全部缺少 Web URL 而失败，安全顺序保证 Cron 未变。停止后云端为 2,914 篇文章，其中 805 篇 content_html 非空；25 个旧活跃 Cron，0 个新调度。

API 61 项、Web 107 项测试通过；全仓类型检查通过。Web 生产构建生成 55/55 个页面，使用仅对构建进程有效的 `SITE_URL=http://localhost:3000`，未写入环境文件。新增路径通过定向 Biome 检查与 `git diff --check`。独立评审提出的“无变化仍通知”与“遗漏关联事件 URL”均已修复并有回归覆盖。

### 后续生产修复与回归

金十已替换为带真实文章链接的早餐专题源；证券时报因详情页把“字号”控件当日期导致门禁失败，RSSHub 已修复并发布。完整 36 路门禁全部通过，共 710 条热点、37 个活跃 Cron，详细批次与部署证据见 [云端来源验收](cloud-source-validation.md)。API 本轮变更已随来源修复部署；Web 仍未生产发布。

最新回归为 API 61 项、Web 108 项测试通过，两包类型检查通过。可选预热失败不会阻止 IndexNow；Cloudflare 清除失败仍跳过后续预热与索引通知。

## Risks
后台任务不是持久队列；进程退出可能丢失通知，依靠 TTL 和结构化日志重试。IndexNow 200/202 仅代表接收。前端未上线前无法完成 Cloudflare、预热、IndexNow key 文件和真实失效的公网验收。
