# 热点更新：掘金热点采集与展示设计

## 目标

构建一个可继续扩展数据源的中文热点门户。第一期仅接入 RSSHub 的掘金本周热门，
由定时任务约每五小时采集一次，通过 Supabase PostgreSQL 在独立前后端之间传递数据。

目标读者是希望快速浏览中文开发者社区热点的技术从业者。首页帮助读者识别当前已有的
内容分区与来源，掘金子页承担完整扫榜和打开原文的主要任务。

## 范围

- `/`：热点门户首页，展示科技区及掘金前五条热点。
- `/technology/juejin`：科技区下的掘金完整榜单。
- `server/api`：部署到 Vercel 的 Hono 服务，提供受保护的掘金采集端点与健康检查。
- RSSHub 路由：`/juejin/trending/all/weekly`。
- Supabase 项目：`rss-site`，项目引用 `pnjsrihfpyvkhyidzgfq`。
- Supabase Cron 约每五小时调用一次 Hono 采集端点。
- Hono 使用 Drizzle ORM 写入 Supabase PostgreSQL。
- Next.js 前端使用 Supabase publishable key 读取公开数据。

## 不在本期范围

- 用户登录、收藏、评论或任何前端写操作。
- 搜索、分页、人工触发采集和管理后台。
- 科技区聚合页 `/technology`；增加第二个科技来源后再创建。
- 榜单历史曲线、文章全文存档和 AI 摘要。
- 掘金以外的数据源。
- 生产域名和 GitHub 远程仓库创建。

## 系统结构

```text
Supabase Cron
      | HTTP + Bearer secret，约每五小时
      v
Hono / Vercel
      | fetch
      v
RSSHub /juejin/trending/all/weekly
      | parse + normalize
      v
Drizzle ORM -> Supabase PostgreSQL
      ^
      | public SELECT under RLS
Next.js -> Supabase Data API
```

前端不调用 Hono。Hono 不为前端提供内容查询接口。Supabase 是两者唯一的数据交接面。

## 数据模型

### `hot_items`

保存当前榜单，而不是永久快照：

| 字段 | 含义 |
| --- | --- |
| `id` | UUID 主键 |
| `section` | 固定为 `technology` |
| `source` | 固定为 `juejin` |
| `source_key` | 从 RSS guid 或规范化链接得到的稳定来源键 |
| `title` | 文章标题 |
| `url` | 掘金原文地址 |
| `summary` | RSS 摘要清理后的纯文本，可为空 |
| `author` | 作者，可为空 |
| `published_at` | 来源发布时间，可为空 |
| `position` | 当前 RSS 顺序，从 1 开始 |
| `first_seen_at` | 首次采集时间 |
| `last_seen_at` | 最近一次仍在榜时间 |
| `batch_id` | 最近一次成功采集批次 UUID |

`(source, source_key)` 建立唯一约束；`(section, source, position)` 建立读取索引。

### `ingestion_runs`

记录最小可观测信息：批次 ID、来源、开始/结束时间、状态、读取条数和安全截断后的错误说明。
该表仅供后端诊断，匿名用户不能读取。

### `source_status`

保存可公开展示的来源状态：来源、最近成功时间、当前条目数和最近批次 ID。前端通过该表
显示更新时间，不接触 `ingestion_runs` 的内部错误信息。`source` 是主键，本期只有 `juejin`。

### 榜单替换规则

采集器先完整解析并验证 feed，再在一个数据库事务内：

1. 创建运行记录。
2. 按唯一键 upsert 本批次条目，并更新排名与 `last_seen_at`。
3. 删除同一来源中不属于本批次的旧条目。
4. 更新 `source_status` 并标记本次运行成功。

解析失败或条目为空时不删除现有榜单。重复调度使用相同唯一约束安全收敛，不增加重复数据。

## 定时与运行边界

Supabase Cron 使用 `0 */5 * * *`，按 UTC 在 00:00、05:00、10:00、15:00、20:00
附近触发；午夜前后的间隔为四小时，因此界面文案使用“约每五小时更新”，不承诺精确倒计时。

Cron 通过 `pg_net` 请求 Hono 端点。共享密钥保存在 Supabase Vault 和 Vercel 环境变量中，
请求使用 `Authorization: Bearer <secret>`。端点拒绝缺失或错误密钥。采集超时、RSSHub 非成功
响应和无效 XML 都返回非 2xx，并写入失败运行记录；失败不会覆盖最后一次成功榜单。

## 数据库访问与安全

- `hot_items`、`source_status` 和 `ingestion_runs` 均启用 RLS。
- `anon` 和 `authenticated` 只允许读取 `hot_items` 与 `source_status`。
- `ingestion_runs` 不向 `anon` 或 `authenticated` 授予读取权限。
- 浏览器只持有 Supabase publishable key。
- Hono 只持有池化 PostgreSQL 连接字符串和 Cron 共享密钥。
- 数据库写入不使用前端 key；任何 secret、数据库密码和 service role key 都不进入客户端包。
- 生产连接使用 Supabase transaction pooler；Drizzle 的驱动关闭 prepared statements，适配事务池。

## 前端技术方案

- Next.js 16 App Router、React 19、TypeScript。
- Tailwind CSS 4。
- shadcn/ui，使用 CSS 变量和本地组件源码，不使用默认视觉主题。
- `next-themes` 管理明暗主题，避免首屏主题闪烁。
- Supabase JavaScript client 负责公开只读查询。
- Biome 负责格式与 lint，Vitest 负责单元测试。

shadcn/ui 仅引入实际使用的组件：`Button`、`Badge`、`Breadcrumb`、`Separator`、
`Skeleton` 和 `Tooltip`。榜单行保持语义化自定义组件，不包装成 Card；不添加表格、侧边栏、
弹窗或表单组件。

## 界面设计

### 视觉方向

延续 `C:\Users\PC\Desktop\front\TEST\blog` 的窄幅技术手记风格：纸张感背景、细分割线、
清晰的中文排版、等宽数据标签和克制的层级。站点名称为“热点更新”。标志性元素是首页
五段采集节拍线，它表达更新频率而不是装饰。

信号橙红是唯一全局强调色：

| 语义 | 浅色 | 深色 |
| --- | --- | --- |
| 背景 | `#F7F9FC` | `#111827` |
| 主要文字 | `#1E293B` | `#E8EDF5` |
| 次要文字 | `#64748B` | `#94A3B8` |
| 分割线 | `#D9E1EA` | `#2A3546` |
| Primary | `#E4572E` | `#FF785A` |
| Primary 浅底 | `#FDE9E3` | `#3B211D` |

shadcn 的 `background`、`foreground`、`primary`、`muted`、`border`、`ring` 等语义
变量映射到以上颜色。基础圆角设为 `0.375rem`；列表不使用阴影、渐变、发光或大面积填充色。
掘金品牌蓝只允许出现在来源 Badge 或图标，不作为页面交互色。

### 公共页面框架

- 68px 粘性顶部导航，左侧“热点更新”，右侧“首页”“科技”和主题切换。
- 内容最大宽度 720px，桌面左右留白 20px，移动端 14px。
- 页脚显示数据来源说明、RSSHub 与本站更新时间口径。
- 中文正文采用系统中文无衬线字体；排名、日期、状态和英文 eyebrow 使用等宽字体。

### 首页 `/`

- Hero：`TODAY'S SIGNALS`、标题“今天，大家在讨论什么？”、更新口径。
- 五段采集节拍线、最近成功采集时间和当前条目数。
- `TECHNOLOGY / 科技` 分区，仅展示掘金来源及前五条标题。
- “查看掘金完整热榜”进入 `/technology/juejin`。
- 没有数据时给出一个明确空状态，不展示虚构分区。

### 掘金页 `/technology/juejin`

- Breadcrumb：`首页 / 科技 / 掘金`。
- 页面标题、来源、榜单周期、最近更新时间和条目数。
- 完整榜单按 `position` 排序。
- 每行包含排名、标题、最多三行摘要、作者、发布时间和外链动作。
- 原文使用新标签页打开，并带 `noopener noreferrer`。

### 状态与响应式

- 加载：与真实榜单行尺寸一致的 Skeleton，不使用居中 Spinner。
- 空数据：说明尚未成功采集，并保留数据来源说明。
- 查询失败：说明热点暂时无法读取，建议稍后刷新；不吞掉错误状态。
- 桌面、平板和手机宽度均在范围内；触摸与键盘输入均可使用。
- 标题和错误信息自然换行；仅作者、来源等短标签允许单行截断。
- 交互元素至少 44px 高，焦点使用 `ring` 主题色，遵循 reduced motion。

## 测试策略

- RSS 解析：有效 feed、缺失可选字段、空 feed、无效 XML。
- 规范化：稳定来源键、摘要纯文本、RSS 顺序到排名的映射。
- 同步事务：重复 upsert 不产生重复项，空/失败 feed 不清空现有数据，旧榜项正确移除。
- Hono：健康检查、Cron 鉴权、成功采集和上游失败响应。
- 数据库：RLS 允许匿名读取热点，拒绝匿名写入和读取内部错误详情。
- 前端：首页只取前五条、完整页排序、加载/空/失败状态。
- 交付：格式、lint、类型检查、单元测试、生产构建与两种主题的响应式截图检查。

## 可行性与风险

方案可行。Supabase 项目当前处于 `ACTIVE_HEALTHY`，PostgreSQL 17.6，`public` schema 和迁移
历史均为空，适合从第一份迁移建立约束。

主要风险及处理：

- RSSHub 公共实例可能限流或短暂失败：保留最后成功榜单，设置超时并记录运行结果。
- Cron 可能漏发或重复：同步过程幂等，旧数据只在完整成功后替换。
- Cron 表达式无法严格形成连续五小时间隔：产品文案明确使用“约每五小时”。
- Vercel 与 Supabase 连接数：使用 transaction pooler，限制单次批量写入并复用单个请求连接。
- RSS 内容包含 HTML：仅保存和渲染清理后的纯文本摘要，不使用 `dangerouslySetInnerHTML`。
- 当前没有 Git 远程：先完成本地分支和验证，远程建立后才能 push、创建 PR 和检查 CI。

## 已确认决策

- Supabase Cron 调用部署在 Vercel 的 Hono 服务。
- 后端数据库访问使用 Drizzle ORM。
- 前端和 Hono 不直接通信，仅通过 Supabase 交接数据。
- 首页加科技分区，掘金完整榜单位于 `/technology/juejin`。
- UI 使用 shadcn/ui，但主题参考现有博客而非 shadcn 默认样式。
- 站点名称为“热点更新”，全局主题色使用信号橙红。
