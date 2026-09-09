# 来源页缓存失效后返回 404

## Background
生产六分区首个来源返回 404，Anthropic 也受影响。线上与 origin/master 均为 6424548；静态 HTML、RSC、meta 和 manifest 中的来源记录都存在。源站直接请求复现 404，日志包含 NoFallbackError；Cloudflare 为 DYNAMIC。

## Scope
六个来源列表页的缓存缺失恢复能力及生产模式回归验证。

## Out of scope
布局、来源链接、数据采集、数据库和 Cron。复用既有来源导航设计，无新增 UI 决策。

## Acceptance criteria
- 六分区首个来源在缓存缺失后仍返回 200，且不显示“这里没有热点”。
- 无效来源继续返回 404；保留来源预渲染及原有 2h/6h ISR 周期。

## Feasibility
可行。Next 16.3.4 app-page-runtime 在缓存无法命中且 fallback 为 NOT_FOUND 时抛出 NoFallbackError。现有 dynamicParams=false 禁止回退生成；改为 true 后，现有 proxy 和页面白名单仍限制合法来源。无需新依赖或数据迁移。

## Implementation
- 六个来源页允许动态参数回退，保留 generateStaticParams、force-static 和 revalidate。
- scripts/check-source-regeneration.mjs 对新启动的本地生产服务器模拟 HTML 缓存缺失，检查六个实际 HTTP 页面，finally 恢复缓存文件。

## Verification
- 修改前生产构建成功（55/55）；普通访问 OpenAI/Anthropic 均为 200。
- 修改前运行 node apps/web/scripts/check-source-regeneration.mjs：六个来源均为 404，断言失败，复现生产症状。
- 修复后生产构建 55/55，通过构建内 TypeScript 检查；Web 35 个测试文件、116 项测试通过。
- 修复后同一回归脚本六来源均为 200，实际 HTML 不展示 404 标题；六分区 unknown-source 均为 404。RSC 备用错误模板不计为实际页面内容。
- 修改文件 Biome 检查和 git diff --check 通过（统一修改文件的原有 CRLF）。
- 完成标准及验收条件自查，无阻塞问题，无需新增 roadmap 后续项。

## Risks
生产需发布本分支后恢复；本地验证不能替代发布后检查。允许重新生成可能触发一次数据库只读查询，沿用既有超时及错误处理。
