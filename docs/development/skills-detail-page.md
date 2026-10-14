# Skills 详情页第一版

## Background

用户 review 方案后要求先实现一版，在本地查看效果。沿用 docs/superpowers/specs/2026-10-14-skills-detail-page-design.md 的页面、数据口径和已有设计系统；本轮不部署生产。

## Scope

- `/skills` 列表 / 卡片切换，两个榜单，名称进入站内详情；按会话保留 Tab 与视图。
- `/skills/[...skillId]`：描述、真实指标、安装命令复制、来源、目录、阅读 / 原文、同仓库条目。
- RSSHub `/skills-sh/details/:view?` 提供带完整 Markdown 的 JSON Feed；原路由保持兼容。
- Skills JSON 解析、去重详情表及迁移；正文和累计指标缺失时保留旧值；Next 详情模式失效。
- 删除首页和空状态的重复文案。其余文案建议保留在独立 review 文件中。

## Out of scope

本次交付上线 PR，不执行生产部署、持久云迁移或 Cron 修改。Stars、历史趋势、分类、辅助文件浏览器不在本轮范围。

## Acceptance criteria

本地榜单及详情可访问；完整正文支持阅读与原文切换；复制命令正确；缺失正文有来源入口；累计与趋势数值分开；页面在手机、桌面、明暗主题可用。

## Feasibility

复用 RSSHub 已有详情请求与缓存，JSON Feed 支持 content_text / summary / _extra；不新增运行依赖。Web 只读 Supabase。上游鉴权留在 RSSHub，Worker 不假设拥有 Vercel OIDC。

本地无需提前部署 RSSHub 或修改云数据库：开发模式读取被 Git 忽略的 `.skills-preview.json`；生产模式始终忽略此文件。准备脚本读取公开 RSSHub 榜单，再按稳定 ID 请求 Skills 官方详情接口，获取 GitHub 和 well-known 来源的完整快照。鉴权或网络请求失败时终止更新并保留已有文件，不将请求失败标成正文缺失。

## Implementation

新增表 `skill_details`，skill_id 主键，区分全文、描述、累计安装量及同步时间；排名与 24 小时指标仍读 hot_items。迁移文件为 20261014112632_add_skill_details.sql，尚未应用。

新 RSSHub 路由复用 handler，使用已定义的 DataItem 字段和 _extra；128 KiB 原文单条上限，完整 Feed 的正文预算约 4 MB，超限仅省略正文。Web 继续对 HTML 清洗，原文按文本渲染；安装 URL 和 ID 校验后才生成复制命令。

本地准备前，先在相邻 RSSHub 项目刷新 Vercel OIDC 凭据（需要已登录 Vercel CLI）：

```powershell
cd D:\code\RSSHub
vercel env pull .env.skills-preview.local --environment=development --yes
```

凭据文件被 Git 忽略，脚本只在本地加载，不输出 Token。然后从 rss-site 项目根目录运行：

```powershell
node apps/web/scripts/prepare-skills-preview.mjs
pnpm --filter @rss-site/web dev
```

脚本依赖本机已安装的相邻 RSSHub 项目依赖，仅供此工作区预览。正常开发启动后访问 http://localhost:3000/skills；示例详情为 /skills/anthropics/skills/frontend-design。

UI 沿用 React Aria、Tailwind、Lucide 和站点主题；不改第三方 SKILL.md 内容。已参考 frontend-design、ponytail、Supabase、interface-design、baseline-ui；本站文案按 humanizer-zh 清理。

## Verification

- Web 300 项测试通过；API 104 项测试通过；signals 7 项测试通过。
- Web、API、RSSHub TypeScript 通过；改动文件 Biome、RSSHub eslint 及 git diff --check 通过。
- RSSHub 原有 6 项路由回归通过，未新增路由测试文件。
- 本地真实快照：两个榜单各 100 条，合并 143 个 Skills，官方接口成功返回其中 142 个 SKILL.md；tdd 正文为 3,629 字节。剩余 open.feishu.cn/lark-slides 的接口未提供正文。
- 浏览器验证卡片切换、frontend-design 完整正文、原文切换、复制成功、目录；1280px / 360px 检查没有整页横向溢出，明暗主题可读。
- 生产构建的编译和类型阶段通过；静态生成在既有 /news/xinhua 和 /ai/openai 的 Supabase 请求出现 ECONNRESET / 超时后失败。未宣称完整生产构建通过。

## Risks

本轮交付本地第一版。生产前需先部署 RSSHub 新路由、应用云迁移、部署 API 并完成两个既有来源的手动云端入库验证，然后发布 Web。不得只切换 Feed 配置而未部署依赖。

已补齐详情 URL 的 CDN 发布通知及 Skills sitemap。采集器发送具体变化 ID（包括退出榜单的条目），每批最多 100 个；Web 校验后复用现有 Next 失效、Cloudflare 精确 URL 清理和 IndexNow 通知。sitemap 仅纳入已有正文的合法 ID，正文未收录页面保持 noindex。

真实冷缓存 JSON Feed 验证：all-time 100 条、2,036,915 字节、28.3 秒，99 条正文；trending 100 条、2,525,745 字节、11.4 秒，100 条正文，两个榜单均包含 tdd。Skills 上游请求超时设为 90 秒，生成的 Skills Cron HTTP 超时为 120 秒，其他来源仍保持 30 / 45 秒。详情批量读取及 upsert，避免每个条目额外执行两次查询；更新时通过 SQL 保留获取失败的旧正文与安装量。

云库事务验证采用真实 Feed 的两个条目，验证两个来源入库、榜单与状态更新、tdd 正文、失败保留正文/指标/首次收录时间，以及 anon 可读不可写。全部回滚；复查 skill_details 不存在，两个线上榜单仍各 100 条。此验证不替代部署后的生产验收，也没有写入迁移历史。

本地快照的首次收录时间表示本次预览采集，不代表上游首次收录日期。预览中缺失正文不说明上游本身没有正文。

## AI 总结（2026-10-14）

用户追加了 Skill 内容总结，后端位于 D:/code/ai-base。详情页在安装区下方提供手动“AI 总结”入口，只为已收录 SKILL.md 的条目显示；结果可收起、展开，失败可重试。

Web 新增 `/api/skills/summarize`，只验证并转发 Skill ID；Nest 读取可信服务端正文，不能由浏览器替换内容。复用现有总结 UI、结果验证和 30 天 IndexedDB 缓存，独立 Skill 版本及正文哈希隔离文章缓存。已合并主分支最新总结卡片样式，Skill 使用自己的加载提示和说明，不从榜单简介生成全文总结。

用户已配置本地 Cloudflare 凭据；Web 与 Nest 的本地连接配置保存于忽略的环境文件。Web 302 项测试和类型检查通过，Nest 20 项测试、类型检查、lint、构建通过。真实推理已从 frontend-design 页面验证，尚未部署生产。

## 榜单搜索（2026-10-14）

用户追加搜索功能。`/skills` 增加 React Aria SearchField，按名称、作者、描述、来源及稳定 ID 筛选当前榜单已采集的条目；支持中文、全角字符、大小写归一和空格分隔的多个关键词。所有关键词都需匹配，保留原榜单排名，不从上游搜索或抓取全站目录。

关键词与既有 Tab、列表 / 卡片视图一同保存在当前浏览器会话。结果显示匹配数量，无匹配时可清除搜索；来源本身为空或失败时仍保留原状态，不误报为搜索无结果。

搜索逻辑与榜单组件相关 4 项测试、Web 类型及改动文件 Biome 通过。浏览器验证名称 / 来源组合查询、卡片视图、跨榜单保留关键词、无结果清除，以及进入详情后返回恢复搜索。

## 本地正文获取修复（2026-10-14）

原预览脚本猜测 GitHub 文件路径，导致 tdd 等已有官方快照的条目显示“暂未收录 SKILL.md”。已改用带 Vercel OIDC 的官方详情接口，不再依赖仓库文件位置。GitHub、well-known 来源和鉴权失败处理的 3 项回归测试通过；真实 tdd 缺失断言从失败变为通过。

## 上线交付与顺序（2026-10-14）

三个仓库的功能分支均合并最新 origin/master。已确认的 UI 方案继续适用；本轮只补齐索引、通知、超时与批量存储。审查已修复 JSON Feed 将标题回退为 content_text 的问题：只有 metadata.state=ready 才将内容认作 SKILL.md。没有接受的额外产品功能后续项，不创建空路线图。

1. Review 并合并 RSSHub PR，确认 Vercel OIDC 与缓存配置有效，再用无凭据请求验证生产 `/skills-sh/details/all-time?format=json` 和 trending 均返回完整 JSON Feed。
2. Review rss-site PR 后，先从该分支应用版本化云迁移 `20261014112632_add_skill_details.sql`。确认 RLS、anon/authenticated 只读，以及现有 Nest 数据库账号能查询该表；不要上传本地预览文件。
3. 从审核过的分支部署 API，使用服务端 CRON_SECRET 手动调用两个生产 `/cron/signals/skills-*` 入口。核验成功批次、source_status、各 100 条 hot_items、skill_details 正文和去重、真实安装量、无伪造发布日期，并记录非敏感验收证据。旧 Web 在这一步尚不接受新的 skills 通知字段，publication 可能暂时失败；它不影响已经提交的入库事务，不能将该结果写为缓存发布成功。
4. 完成采集验收后才更新已有 Skills Cron 的 HTTP 超时到 120 秒，保留原 schedule、active 和 Vault 引用。使用 `pnpm setup:cron` 时会先验证所有配置来源再调度，不得绕过生产数据门槛。
5. 合并 ai-base PR 部署 Nest；复用生产 DATABASE_URL、REDIS_URL、AGENT_SERVICE_TOKEN 和 Cloudflare 配置，不设置 SKILLS_PREVIEW_PATH。直接验证有正文 ID 的总结接口及无认证拒绝。
6. 确认前三项依赖可用且 Web CI 构建通过后，最后合并 rss-site PR；master 合并会自动发布 Web。验收 tdd 阅读/原文、搜索/视图切换、真实总结、sitemap 和更新后的具体详情 CDN 通知；此时通知字段已受支持。已有数据在新的 Web 部署中直接读取，不依赖步骤 3 的旧缓存通知。

回退时先回退 Web，再回退 Nest/API；数据库迁移为新增表，保留已采集数据，旧程序无需该表。RSSHub 原榜单路由保持兼容。

当前检查：Web 全量 313 项测试、上线相关 33 项回归、Web/API 类型通过；API 107 项测试、Worker 打包 dry-run 通过；RSSHub 7 项既有路由/JSON 序列化测试及路由生成通过；Nest 21 项测试、类型、lint、构建通过。本机完整 Web 生产构建仍在既有新华/OpenAI 数据请求超时或 ECONNRESET 后失败，编译和类型阶段通过；GitHub CI 构建必须通过后才能合并。持久迁移、生产路由部署、正式采集与生产总结验收仍待 review 后执行。

上线 PR：[RSSHub #5](https://github.com/ljh12138164/RSSHub/pull/5)、[ai-base #4](https://github.com/ljh12138164/ai-base/pull/4)、[rss-site #43](https://github.com/ljh12138164/rss-site/pull/43)。PR 已相互关联；未合并，CI 结果以各 PR 检查为准。快照文件也被 Docker context 忽略。合并远端时 pnpm 钩子被依赖元数据网络请求阻断，使用已安装 Biome 对同一暂存范围执行等价检查后提交；上线改动的暂存检查通过。
