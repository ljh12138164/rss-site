# Skills 榜单与详情页方案

状态：待用户 review。本文只规定实现范围，不表示功能已完成或已部署。

## 1. 本次交付

让用户从榜单进入站内详情，了解用途、阅读 SKILL.md，并复制指定 Skill 的安装命令。

第一版包含：

- 保留“最热门 / 增长最快”两个榜单，增加列表 / 卡片切换，默认列表。
- 名称进入站内详情；仓库和 skills.sh 保留独立外链。
- 清楚区分累计安装量和近 24 小时安装量，显示当前榜单排名及采集时间。
- 详情展示作者描述、安装命令、完整 SKILL.md、来源信息和同仓库条目。
- 支持 GitHub 与 well-known 两类来源。
- 正确处理缺少正文、详情请求失败、下榜、非法路径、复制失败和数据库故障。

第一版不加入仓库分组模式、全站 Skill 搜索、用途分类、AI 生成介绍、翻译、评论、收藏、趋势曲线或排名升降。它们可单独安排，避免详情页与其他功能绑定。Stars、安全审计、上游首次收录时间也不作为本次必交字段，原因见第 3 节。

## 2. 页面与交互

### 榜单 `/skills`

保留既有导航、两个 Tab 和榜单顺序。工具区只放视图切换、条数及实际更新时间。

- 列表：排名、名称和两行用途描述；安装量右对齐；仓库和详情入口紧凑排列。
- 卡片：桌面两到三列，手机一列；展示相同字段，不改变榜单含义。
- 名称使用站内链接；仓库是单独链接，不嵌套在另一个链接或按钮内。
- 同一 Skill 同时出现于两榜时可标“热门 · 趋势”；不把它称为综合评分。
- 返回榜单时保留所选 Tab 和视图。普通浏览器后退保持滚动位置；首版不引入专门的滚动恢复框架。
- 视图偏好可存浏览器本地；初次渲染使用默认列表，避免服务端与客户端状态不一致。

### 详情 URL

使用 `/skills/[...skillId]`，按上游稳定 ID 建立唯一地址：

- GitHub：`/skills/anthropics/skills/frontend-design`
- well-known：`/skills/mintlify.com/mintlify`

同一 Skill 从哪个榜单进入都使用同一 URL。榜单名称、排名、文章 UUID 不进入地址。页面只查询已采集的数据，任意地址不会触发上游抓取。

校验分段数量、长度和来源类型；拒绝空分段、点路径、编码斜杠及无效标识。保留上游标识的含义，不用显示名称反推 ID。

### 桌面布局

```text
首页 / Skills / frontend-design

frontend-design                          anthropics/skills ↗
作者提供的用途描述
累计安装 …  · 热门榜 #… · 近 24 小时 … · 趋势榜 #…

安装
npx skills add https://github.com/anthropics/skills --skill frontend-design
                                                   [复制命令]

SKILL.md                               来源信息
正文，标题、列表、表格、代码块           GitHub / well-known
                                       来源仓库或网站 ↗
                                       skills.sh ↗
                                       采集时间
                                       本站首次收录时间

                                       目录（正文有多个标题时）

同仓库 Skills（最多 4 条，只取本站已有条目）
```

正文是页面主体，桌面约占可用宽度的四分之三；右侧只放辅助信息与目录。安装区位于正文前，代码可选择、可复制。手机按标题、描述、指标、安装区、来源信息、折叠目录、正文、同仓库条目排序，避免固定底栏遮挡阅读。

沿用 SiteShell、主题 token、现有字体、React Aria 和 Lucide。链接与主操作使用现有强调色；数字用等宽数字；正文留足行距。代码块内部横向滚动，页面本身不横向溢出。只在安装区使用浅底色，不把每段内容包成卡片，不增加装饰动画。

## 3. 字段及准确口径

| 字段 | 数据来源 | 展示规则 |
| --- | --- | --- |
| 名称、稳定 ID、来源、来源类型、安装 URL、skills.sh URL | 官方榜单 API | 使用上游值；不把 github 当作“开发”分类 |
| 用途描述 | SKILL.md front matter | 原样表达作者用途；缺失则省略，不展示“暂无描述”占位 |
| SKILL.md 正文 | 官方详情 API 的 files | 只取 SKILL.md；保留完整正文，不用 500 字符摘要代替 |
| 累计安装量 | 详情 API 的 installs；必要时使用累计榜明确口径的数据 | 不能取趋势榜数字作为累计值 |
| 近 24 小时安装量 | trending 榜对应数据 | 标注窗口；不称为增长率或历史差值 |
| 当前排名 | hot_items 的两个来源 | 没进入本站采集的前 100 名则不显示该榜排名；不推测全站排名 |
| 仓库 / 来源网站 | installUrl | 只允许有效 HTTP(S) URL；well-known 不强行拼 GitHub 地址 |
| 采集时间 | 本站成功同步时间 | 表示本站同步时间，不冒充作者发布时间 |
| 本站首次收录 | 去重后的详情记录 first_seen_at | 不写成上游 First Seen 或 Skill 创建时间 |
| 同仓库条目 | 本站已有、按 source 精确匹配的数据 | 最多 4 条；没有则整区省略 |

官方详情 API 明确提供稳定 ID、累计安装量、文件 hash 和 files；审计是另一个 API。官方网站详情页还展示 Stars、主题和 First Seen，但这些字段没有出现在已核对的详情 API 文档中，因此不能承诺同一次请求就能拿到。

- Stars：后续可从 GitHub API 获取；必须标明是仓库 Stars，同仓库 Skills 共用该数字。
- 安全审计：后续可接官方 audit API，展示服务商、结果与审计时间；404 表示暂无审计，不能显示“通过”。
- 主题分类及上游首次收录：等待可靠接口或有证据的解析方案，不根据名称猜分类。
- SKILL.md 的原始 YAML 可留在原文视图中；阅读视图将已识别 front matter 与正文分开，不重复显示描述。

第一版正文提供“阅读 / 原文”切换：阅读为渲染后的正文，原文为可选择的完整 SKILL.md。只加载这一份文件，不做辅助文件浏览器，也不自动执行其中的命令。

## 4. 采集方案

保持现有数据链路：

```text
现有 Supabase Cron（两个来源，仍每 6 小时）
  → rss-site Hono 采集器
  → RSSHub 详情版榜单
  → skills.sh 官方榜单 + 详情 API
  → Supabase：当前榜单 + 去重后的 Skills 详情
  → Next.js 页面读取 Supabase
```

原因：RSSHub 当前 getDescription 已请求详情 API，拿到 files 后只提取 description。可以缓存并复用完整详情，避免为详情页再给每条 Skill 增加一次相同的上游请求。rss-site API 当前部署使用 Worker，不能假设它自带 Vercel OIDC；认证继续留在已有 RSSHub 侧。

### RSSHub 传输契约

新增 `/skills-sh/details/:view?`，仅用于提供正文完整的榜单；现有 `/skills-sh/all-time`、`/skills-sh/trending` 保持原行为。

采集器使用 RSSHub 内置 `format=json` 输出 JSON Feed。它是现有公共格式参数，不新增路由查询配置。已核对当前 `lib/views/json.ts`：支持 summary、content_text、content_html、authors、tags 和 `_extra`。

- 标准字段：id、url、title、summary、content_text（原始 SKILL.md）、content_html（正文）、authors、tags（来源类型）。
- 在类型已定义的 `DataItem._extra` 中提供一个有版本的 Skills 扩展：source、sourceType、installUrl、榜单窗口及数值、累计安装量、hash、详情状态。rss-site 明确校验这个契约；不向 DataItem 添加会被忽略的顶层自定义字段。
- description 只放渲染后的正文，排名、作者和指标不混入正文。
- 使用 RSSHub 已安装的 markdown-it；关闭原始 HTML执行，Web 再经过现有 sanitize-html 清洗。
- 缓存完整详情，仍使用 cache.tryGet 与有限并发；两个榜单的相同 Skill 共用详情缓存。改变缓存结构时更换缓存 key 版本，避免读取旧描述字符串。
- 没有 SKILL.md、无 snapshot、请求失败分别返回明确的详情状态，仍保留有效榜单条目。

### 体积与超时

现有采集器默认 30 秒超时、5,000,000 字节上限。首版保持这些全局默认，只为 Skills 按真实数据验证是否需要单独延长超时；若需要，建议上限 45 秒。

详情同时传原文与 HTML，必须计算最终 JSON 的 UTF-8 大小，而非只算 Markdown 字符数。单条正文超过现有 512 KiB 内容限制时完整省略正文并标记，不截取半份假装完整；整个 Feed 保留体积预算，超限条目保留指标与描述，正文标为未收录。实测若频繁触及上限，需 review 后改成分离详情采集，不通过提高全局体积上限掩盖问题。

两个来源仍只获取第一批 100 条，不翻页。并发与缓存先复用现有设置；冷缓存实测需要覆盖耗时、响应体积和详情成功数。

## 5. 存储与权限

新增 `skill_details`，按上游 skill_id 唯一存储；不把两个榜单各自的 signal_articles 当作两份详情。

| 字段组 | 建议字段 |
| --- | --- |
| 标识 | skill_id 主键、slug、name、source、source_type |
| 来源链接 | install_url、upstream_url |
| 用途与正文 | description、skill_markdown、content_html、content_hash |
| 指标 | total_installs、total_installs_synced_at |
| 同步状态 | detail_state、last_attempt_at、last_success_at、content_synced_at |
| 生命周期 | first_seen_at、last_seen_at |

当前排名和 24 小时指标继续使用 hot_items，不再复制到详情表。明确允许数值为 0；缺失用数据库 NULL，页面省略，不能将缺失当作 0。

同步时按 skill_id 去重 upsert。详情成功时更新正文与对应时间；失败或未提供正文时保留已有好数据，不用空值覆盖。累计安装量也有独立时间，避免把某次详情失败后保留的旧数字标成最新。

first_seen_at 只在首次插入设置。下榜后保留详情，页面显示“当前未进入榜单”，不立即 404。未知 ID 返回 404；上游临时故障不表示删除。第一版不设置自动删除详情的 Cron，数量由每天两个前 100 榜单的并集决定；后续若需要保留期限再单独制定，不沿用普通文章清理规则误删详情。

新表启用 RLS，anon / authenticated 只读已采集记录，客户端没有写权限。写入复用采集器的服务端数据库连接；内部错误不通过公开表暴露。迁移包含权限与索引，并验证匿名读、拒绝写和按来源查询。

## 6. 发布与缓存

- 页面使用项目现有 6 小时 ISR 策略；访问只读取数据库，不等待上游。
- Skills 同步成功后失效 `/skills` 和动态详情模式 `/skills/[...skillId]`。
- 详情正文改变必须参与 changed 判断，不能仅比较榜单摘要或排名。只更新尝试时间不触发整站发布。
- 核对 `revalidate-paths.ts`、发布路径验证、Cloudflare 缓存清理和现有缓存层：目前它们只处理 `/skills`，新增详情路径需显式支持。
- 动态 Next 模式失效不等于 CDN 逐页失效。发布通知传递变更 Skill ID，生成精确详情 URL，分批清理；保留现有单批上限和超时，不把通配符当作 URL 提交。
- 页面元数据使用 Skill 名称、作者描述、本站 canonical 和面包屑。内容缺失的详情 noindex；正文完整且链接有效的页面再进入 sitemap。初次采集没到的页面不预先生成假内容。
- Skills sitemap 单独查询详情表，不把两个榜单都改成普通文章来源，也不接入新闻文章的 AI 事件发布规则。
- 安装复制只复制文本，不执行、不触发远端写操作；Clipboard 失败时提示“复制失败，请手动复制”，命令始终可选择。

## 7. 页面状态

| 情况 | 页面表现 |
| --- | --- |
| 有正文 | 标题、指标、安装区、正文、来源及可用目录 |
| 有基本信息，无正文 | 基本信息照常显示；正文区“暂未收录 SKILL.md”，提供“查看来源” |
| 更新失败，但有旧正文 | 保留可读正文；显示其真实采集时间，不把内容清空 |
| 当前下榜 | 保留详情；不显示旧排名为当前排名 |
| ID 未采集 / 路径非法 | 404 与“返回 Skills” |
| 数据库暂不可用 | 可重试的加载错误；不返回 404 |
| 无安装 URL / 命令不适用 | 省略复制操作，保留来源入口，不生成猜测命令 |
| 首屏加载 | 与标题、安装区、正文布局对应的骨架 |
| 无同仓库条目 | 省略整个推荐区 |

普通情况下不显示“数据来自 Supabase”“使用缓存”等实现说明。时间、数值口径和正文缺失属于读者需要知道的信息，保留。

## 8. 改动范围

RSSHub：

- skills-sh 路由中的完整详情缓存与详情版榜单输出。
- 新路由的配置和说明；复用现有依赖，不新建路线 README 或 radar 文件。
- 保持原路由默认参数与示例；为新增路由提供可工作的 example。

rss-site：

- packages/signals：两个 Skills 来源使用详情版 Feed，明确 JSON 格式；其余来源仍走原 XML 解析。
- server/api：Skills JSON Feed 解析、详情 upsert、正文变化检测、发布通知。
- db/schema 与版本化迁移：skill_details 及 RLS。
- apps/web：技能数据读取和路径工具、详情页及加载/错误状态、榜单列表/卡片切换、安装复制组件。
- 既有 HTML 清洗、正文样式、操作按钮和站点外壳尽量复用；只为 Skill 需要的目录和原文切换补齐支持。
- 缓存失效、路径验证和 sitemap 支持新详情页。

不重构其他来源，不把 Skills 强塞入普通新闻阅读器，不额外添加 UI 或 Markdown 依赖。

## 9. 实施顺序与验收

1. 先用真实 GitHub 和 well-known 样本验证详情 API、缓存与 JSON Feed 契约；记录非敏感字段、状态、体积与耗时。
2. 实现 RSSHub 详情版榜单，验证原榜单不受影响。RSSHub 按仓库规定不新增路由测试文件，以真实 Feed 和自动 route example 验证。
3. 实现 rss-site 解析、迁移和详情存储；测试两个榜单去重、数值口径、详情失败保留旧值、正文变更发布以及非法 URL。
4. 实现详情页与榜单切换；验证 GitHub / well-known、缺失正文、长命令、代码表格、复制失败和下榜场景。
5. 检查类型、格式、相关测试和生产构建；检查 360px、768px、1280px，明暗主题、键盘操作及页面横向溢出。
6. 生产上线采用渐进顺序：先部署 RSSHub 新路由，应用云端迁移，再部署采集器；先手动调用两个既有生产来源，验证榜单和详情入库，再切换 Web 入口。不能只有页面上线、正文数据仍为空。
7. 云端证据至少包括：两个榜单 item_count、详情成功数、缺失原因分布、重复 ID 去重、原始命令、正文长度、RLS、缓存刷新结果。已有 Cron 不增加第三个任务，不改变采集周期；如需临时暂停调度，将恢复安排纳入上线步骤。
8. 回退时恢复两个来源旧 Feed 和榜单外链；新表暂时保留，不在回退时删除数据。

验收结果应是：两个榜单中的已收录 Skill 都能进入同一个稳定详情；有正文的条目能读完整 SKILL.md、复制正确命令；缺失和失败有明确处理；一条详情故障不导致整个榜单消失；两个榜单数值不混用；数据更新能同步到 Next 与 CDN。

## 10. 后续可选项

另一次 review 可增加 Stars、官方审计、真实主题、辅助文件查看、按仓库分组。历史趋势需先建逐批快照，不能从当前表拼出历史。

本次建议确认的范围为：站内详情 + 列表/卡片切换 + 安装复制 + 完整 SKILL.md（阅读/原文）+ 现有真实指标。第 3 节列明的数据缺口和第 4 节的体积限制属于实施前需验证的条件。

## 参考与核对依据

- [skills.sh API 文档](https://www.skills.sh/docs/api)：标识、认证、文件快照、安装 URL、审计与缓存。
- [frontend-design 官方详情](https://www.skills.sh/anthropics/skills/frontend-design)：页面结构与指定 Skill 安装命令参考。
- RSSHub：lib/routes/skills-sh/index.ts、lib/types.ts、lib/views/json.ts、lib/views/rss.tsx。
- rss-site：skill-leaderboard.tsx、hot-feed.ts、ingestion/feed.ts、ingestion/store.ts、ingestion/fetch.ts、revalidate-paths.ts、content-publication.ts、sitemap-service.ts。
- 方案采用项目 frontend-design、Supabase、ponytail 指南；UI Skills interface-design 与 baseline-ui 已读取。现有文字按 humanizer-zh 审阅。此阶段尚未进行页面实现或视觉验收。
