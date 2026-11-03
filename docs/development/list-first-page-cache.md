# 分类与平台首屏 Redis 缓存

## Background

用户已确认：一次缓存全部分类和各平台的第一页，滚动分页继续查库；现有采集成功后更新数据及页面缓存；每次上线主动预热当前列表。复用这次对话中完成的方案评审，无新增设计决策或视觉界面。

## Scope

- 全部六个文章分类、43 个来源及 Skills 双榜单，按来源注册表生成约 50 组
- SSR 与 API 共享首屏数据缓存，保留游标和分页行为
- 采集通知、管理员修改后的缓存失效、回填与页面发布
- 部署健康检查后的独立内部预热命令，低并发、可报告和重试失败

## Out of scope

新界面、上游采集逻辑、数据库迁移、Cron 配置、历史分页/搜索/个人筛选缓存、生产直接部署

## Acceptance criteria

- 全范围首屏命中后不执行对应列表查询，后续页仍查 Supabase
- 缓存保留原始 nextCursor，错误不写入，合法空列表短 TTL，翻译 TTL 不变
- 并发失效及预热时旧查询不能覆盖新缓存，元数据淘汰也不能复用旧数据
- 来源更新只刷新所属范围，Redis 先失效，数据回填后重新失效页面并发布 CDN
- 缓存故障不影响读库或已提交的数据，失效失败有安全日志及有限重试
- 上线健康检查后主动预热全部首屏，预热失败不触发部署回滚

## Feasibility

结论：可行。基于已 fetch 的远端默认分支 `73d83b00dcf229fca62db80a43baf5ae3286dc2b`，使用干净独立工作树 `rss-site-list-cache`，保留原工作区的包缓存删除变更。已检查 HERMES、根目录及 Web AGENTS；CONTEXT.md 不存在。

- 现有 Redis 7.4 / ioredis 6 和私网连接可复用，无新依赖；Supabase 公共客户端/RLS 不变
- 六个分类及来源 SSR 与 API 均走 getHomeArticles；Skills 在查询原始行后恢复 Date
- 关键竞态使用 Redis 原子脚本和随机版本令牌，数据及版本独立淘汰时按未命中处理
- 缓存缺失时合并同进程查询，独立数据库超时避免访客取消影响其他请求
- 采集通知截止 5 秒，读库回填放在 after 回调；通知只等待有限的 Redis 失效
- 部署为 Bun standalone，内部预热脚本须打包进镜像并验证运行，不经过公开 CDN
- 既有页面缓存仍有独立过期策略；Redis TTL 不构成整页新鲜度承诺
- 已复用前期核验的 Redis SET/事务/内存与 Supabase 查询文档；未增加 Supabase 功能或 schema

## Implementation

- `list-cache-scopes.ts` 从注册表生成 6 个文章分类、43 个平台和 1 组 Skills，共 50 组；单平台请求统一键，不缓存来源组合、全站任意筛选和历史页
- `list-cache.ts` 使用原子 Lua 读取/换代/条件写入；随机版本元数据丢失时同时丢弃旧数据。正常列表 TTL 为 300–330 秒，合法空列表 30 秒；翻译 30 天 TTL 不变
- 合并同范围同版本的冷查询，数据库截止独立于单个访客；旧查询条件写入失败后，普通读取重读当前版本一次，预热明确报失败，避免旧 SSR 结果再次生成旧页面
- `getHomeArticles` 的共享读取同时服务 SSR 与 API，原始 nextCursor 完整缓存；Skills 缓存原始行及状态，沿既有映射恢复 Date，缺状态或错误不缓存
- 浏览器使用的筛选解析拆到纯 `article-filter.ts`，保留旧导出兼容现有服务器调用；客户端构建不引入 Redis/Node 网络模块
- 采集通知和管理员编辑先等待 Redis 失效，再立即失效 Next 页面；`after` 回调回填失败范围最多两次，完成后再次失效页面并执行既有 CDN/页面预热发布，清除回填期间生成的页面
- 失效失败返回可重试 503，同时保留恢复任务；采集端只重试通知最多三次，重定向/永久错误不重试，不重复已经提交的采集。异步回填失败使用批次和范围安全日志，可独立重放原通知
- 已核对云端清理迁移：删除通知按 section/source 调用同一 `/api/revalidate`，因此现有清理也进入新缓存失效链路，无需迁移
- `prewarm-lists.ts` 是内部命令，读取当前数据库并主动覆盖全部列表，最多并发 2，失败范围重试一次；整体 5 分钟后停止调度新读，进行中的单次查询受 10 秒截止约束
- Docker builder 复用现有 Bun 镜像的二进制打包内部命令，runtime 携带独立 bundle；部署通过健康检查并结束错误回滚区域后执行预热，失败只报告不回滚。内部命令可传范围参数，只重试指定列表
- CI 增加 Redis 7.4 测试服务、打包命令运行检查；Turbo test 显式传递 TEST_REDIS_URL，防止环境过滤导致集成测试被跳过

部署后手动重试命令（使用服务器现有 Compose 目录）：

```sh
docker compose --project-directory /opt/stacks/rss-site exec -T web bun apps/web/scripts/prewarm-lists.mjs
docker compose --project-directory /opt/stacks/rss-site exec -T web bun apps/web/scripts/prewarm-lists.mjs source:zhihu section:social
```

一次性部署预热只更新 Redis 数据，不强制清除所有现有静态页面；正常来源变更通过发布通知失效相应页面。已有页面/CDN 缓存策略继续保留。

## Verification

- `pnpm test`：Signals 8、API 164、Web 381 项通过；当时未配置集成 Redis，5 项集成测试跳过。随后补充 SSR 并发竞态与部署截止测试，最终单独运行完整 Web 测试并启用真实 Redis：103 文件、388 项全部通过，无跳过；三包合计最终覆盖 560 项
- 本地临时 Redis 7.4.0（从官方 release 编译，独立 WSL 进程）：6 项真实集成测试通过，覆盖 TTL/过期、并发冷加载合并、旧预热晚到、旧 SSR 结果重读、版本元数据淘汰及损坏数据/失败查询；退出时只清理测试自身键
- 使用现有云端 Supabase 公开只读数据、Bun 和临时本地 Redis：内部 bundle 首次执行 50/50 成功；再用相同源模块测量完整预热及命中，50/50 成功，总耗时 12,223 ms（包括量测），51 次数据库 HTTP 请求；随后读取全部 50 组新增数据库 HTTP 请求为 0
- 上述快照：50 个数据键及 50 个版本键，JSON 1,792,661 字节，`MEMORY USAGE` 合计 1,807,992 字节（约 1.72 MiB），TTL 25–327 秒，URL/日期异常 0；这是本次数据快照，不是未来容量上限。空列表使用 30 秒 TTL，正常过期后可以少于 50 个数据键
- 本地 Bun + Next 生产模式：平台首屏 HTTP 200/30 条、无 section 的同平台请求复用同一游标、下一页 HTTP 200；模拟来源通知 HTTP 200，Redis 版本改变且回填完成，平台 HTML HTTP 200，后台记录 listCache=succeeded。模拟通知未运行上游采集、未写云端数据库、未配置 CDN/IndexNow 写操作
- `pnpm build`：API 类型检查、Web 生产编译与 TypeScript、67/67 静态页面生成、early hints 与 service worker 生成全部通过
- `pnpm check-types`：三包通过。曾与 Next 构建并行执行时撞上 `.next/types` 重建窗口导致缺文件，改为构建结束后顺序执行即通过，无产品代码改动
- 全部 22 个变更 JS/TS/JSON 文件 Biome 检查通过；`git diff --check` 通过；生成的浏览器静态 JS 中未出现 Redis 模块/配置或列表缓存键
- WSL `python3 deploy/server/test-release-packaging.py`：3 项通过，包含实际执行部署末尾逻辑并模拟预热失败，确认不会触发回滚；部署 bash/sh 语法检查通过
- Bun 内部命令 bundle：119 模块、约 0.92 MB，未配置 Redis 时安全报告 disabled 并退出
- 本机无 Docker/shellcheck，Linux 镜像构建、镜像内命令和 shellcheck 留待 PR CI；CI 工作流已经包含这些检查，尚未创建 PR 或运行该 CI
- 未修改生产 Redis、Supabase schema、Cron、线上配置或生产服务

## Risks

- 列表和翻译共享 128 MiB allkeys-lru 预算，完整范围约 3–5 MiB 仅为估算，必须实测
- 生产通知或异步任务失败需独立重试，不能依赖下轮 changed=false 的采集补发
- 页面/CDN/浏览器缓存均独立存在；已打开页面不会自动替换内容

## Review

- 已按根目录/Web 指令及本文件验收条件审查全部变更
- Blocking，已解决：筛选模块的客户端导入曾把 Redis 带入浏览器，拆分纯筛选模块后生产构建通过
- Blocking，已解决：旧查询虽然不能覆盖 Redis，仍可能返回给 SSR 生成旧页面；条件写入失败的普通读取改为重读当前版本，并以真实 Redis 测试验证
- Blocking，已解决：Turbo 默认环境过滤会让 CI 集成测试静默跳过，显式声明 TEST_REDIS_URL
- Blocking，已解决：预热必须确认 Redis 条件写入成功，不能把成功读库误报为缓存已更新；失败独立报告并重试
- 审查结束，无剩余本地阻塞项；无已接受的范围外跟进项，不创建空 roadmap。生产上线及镜像验证仍须经过用户创建 PR 后的 CI/合并流程
