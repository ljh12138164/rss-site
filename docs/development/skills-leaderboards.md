# Skills 热门榜单

## Background

站点已经有独立的 GitHub 开源排行，但没有集中发现 Agent Skills 的入口。自部署 RSSHub 已提供 skills.sh 的最热门和增长最快两个真实 Feed，并包含作者提供的描述与榜单元数据。

## Scope

- 新增顶部导航入口与 `/skills` 页面。
- 用页面顶部 Tab 切换“最热门”和“增长最快”，一次只显示一个纵向榜单。
- 展示排名、Skill 名称、描述、来源、安装量；增长榜额外展示小时增长量。
- 两个独立来源通过现有采集管线写入 Supabase，每六小时更新。
- 覆盖桌面和手机、明暗主题、加载、空数据和错误状态。

## Out of scope

- Skill 分类、搜索、安装命令复制和站内详情页。
- 从 skills.sh HTML 抓取生成式摘要或主题。
- 新增 UI 依赖或改变其他内容分区。

## Acceptance criteria

- 主导航可进入 `/skills`，且只有该入口高亮。
- 两个可键盘操作的 Tab 分别显示最热门与增长最快榜单。
- 条目始终按上游排名展示，缺少描述或数值时不虚构数据。
- 点击 Skill 经现有离站确认页打开 skills.sh 详情。
- `skills-trending` 与 `skills-hot` 每六小时错峰采集一次。
- API、迁移、生产采集和 Cron 严格通过新来源生产门禁。

## Feasibility

结论：可行。生产 RSSHub 的 `/skills-sh/trending` 和 `/skills-sh/hot` 均已无凭据返回 HTTP 200 与 100 条数据。Feed 使用标准 RSS，现有解析器和采集存储可以复用。新增独立 `skills` section 可避免两个榜单混入科技文章列表。

主要技术难点是 RSS 描述最长可超过现有 500 字符摘要上限，而安装量和增长量位于描述尾部。API 在入库前把首段描述和稳定元数据压缩为不超过 500 字符的结构化摘要，确保长描述不会挤掉榜单指标。两个来源各 100 条，六小时一次；RSSHub 详情缓存与 10 分钟级 Feed 缓存限制上游压力。

生产仍受门禁约束：先部署 API，再应用云端迁移，手动调用两个来源的生产采集并核验 `ingestion_runs`、`source_status`、`hot_items` 数据，最后才能启用 Cron。

## Implementation

交付面为新增 `/skills` 页面和顶部导航入口。用户确认用顶部 Tab 代替双列：桌面与手机均为单列榜单，Tab 固定在页面标题下方。页面面向快速发现可用 Skills 的开发者，焦点是排名与 Skill 名；描述辅助判断用途，安装量和增长量形成紧凑数据带。

沿用现有语义色、冷蓝交互强调、平面分隔线、sans 标题与 mono/tabular 数字。增长值使用克制的绿色文字作为唯一新增状态色。复用 Next.js 16、Tailwind CSS 4、React Aria Components 1.17、Lucide 图标、`SiteShell` 和现有 Feed 状态组件，不增加依赖。UI Skills registry 未暴露指定指南，按仓库 UI quality 清单、`frontend-design` 与既有设计系统回退实现。

## Verification

- 生产 RSSHub `/skills-sh/trending` 与 `/skills-sh/hot` 均返回 HTTP 200 和 100 条真实数据；描述、安装量、来源、小时增长量字段符合解析契约。
- API 全量 66 项测试通过，包含长描述下保留 Skills 指标、两个来源注册及六小时错峰 Cron。
- Web 全量 159 项测试通过，包含 Tab、元数据解析、导航、缓存失效和 sitemap。
- API 与 Web 类型检查通过。
- 使用联网权限完成生产构建，55/55 个静态页面生成成功，`/skills` 显示为 6 小时 ISR。
- 修改文件 Biome 与 `git diff --check` 通过。全仓 Biome 仍报告 169 个既有 CRLF 格式错误和 165 个警告，未改动这些无关文件。
- 线上 API、迁移、采集、Cron 与最终视觉验证待生产门禁完成后补充。

## Risks

- skills.sh 或 RSSHub 改变元数据标签时，数值可能暂时缺失；页面仍显示名称和描述。
- 冷缓存 RSSHub 请求约需 14–16 秒；采集任务允许 45 秒，页面只读取 Supabase，不直接等待上游。
- 新来源在 API 部署和云端迁移前不能成功入库，也不能提前启用 Cron。
