# GitHub 中文开源排行榜

## Background

GitHub Trending 条目当前复用通用文章列表。由于持久化条目带有 `articleId`，仓库链接被错误生成为 `/technology/github/[slug]`，点击后进入文章详情加载骨架，而不是前往 GitHub 仓库。现有榜单也没有把 RSSHub 已提供的作者、语言、Stars 与 Forks 呈现出来，主导航中缺少紧邻“AI 时间轴”的开源排行入口。

## Scope

- 保留 `/technology/github` 作为唯一开源榜页面，在主导航“AI 时间轴”右侧增加“开源排行”。
- 将 GitHub Trending 数据源改为每周、任意编程语言、中文描述：`/github/trending/weekly/any/zh`。
- 为 GitHub 条目提供专用排行榜行，显示真实排名、作者头像与名称、仓库名称、描述、编程语言、Stars 和 Forks。
- 仓库点击使用既有离站确认流程前往真实 GitHub URL，不再生成站内文章详情链接。
- 保留加载、空数据、错误和分页状态，覆盖桌面与手机布局及明暗主题。

## Out of scope

- 全球榜与中文榜切换。
- 按编程语言或日榜、月榜筛选。
- 翻译仓库名称或简介。
- 新增数据库列、UI 库或新的内容来源 ID。
- 本次直接部署 API、修改云端数据或 Cron。

## Acceptance criteria

- 主导航中的“开源排行”紧随“AI 时间轴”，访问 `/technology/github` 时只有该入口高亮，不同时高亮“科技”。
- GitHub 榜单按照上游 `position` 展示，条目能从现有 RSS 摘要解析并显示 Language、Stars 和 Forks；字段缺失时不虚构数值。
- 可识别的 GitHub 作者显示头像与名称；头像失败不影响仓库名称和数据阅读。
- 点击仓库不会进入 `/technology/github/[slug]`，而是通过 `/out` 前往条目的 GitHub URL。
- API 来源配置默认请求中文描述周榜 `/github/trending/weekly/any/zh`。
- 现有非 GitHub 文章列表呈现和详情跳转不变。

## Feasibility

结论：可行。

RSSHub 官方路由为 `/github/trending/:since/:language/:spoken_language?`；`language` 是编程语言，`spoken_language` 是项目自然语言筛选。`weekly/any/zh` 因此表示“周榜、任意编程语言、中文描述”，并不执行翻译。公开 `rsshub.app` 在本地无凭据探测时网络超时，未取得实时 XML；正式发布仍需先部署 API，再手动调用生产采集并核验云端数据质量，不能以本地检查代替。

现有摘要最多保存 500 字符，示例中的尾部元数据格式稳定为 `Language: ... Stars: ... Forks: ...`，可在 Web 展示层解析，不需要数据库迁移。主要风险是上游文案格式变化；解析器按尾部标签识别并在字段缺失时降级显示普通描述。头像可由已校验的 GitHub owner 构造官方头像 URL，无需扩大数据模型。

技术难点与约束：

- GitHub 条目必须在通用 `HotList` 内先于 `articleId` 路由逻辑识别，否则仍会生成站内详情链接。
- `/technology/github` 使用分页查询，摘要不能在元数据解析前截断，否则较长简介会丢失尾部 Stars/Forks。
- 主导航的父级 `/technology` 与具体 `/technology/github` 路径存在前缀重叠，需要显式保证单一高亮。
- RSSHub 路由变更会改变生产快照，代码合并后仍需按生产验证顺序重新采集和核对，现有 Cron 不在本次 PR 中修改。

## Implementation

界面契约：面向快速浏览开源趋势的开发者，首要动作是比较榜单并打开仓库。焦点元素为顺序明确的仓库排行；作者头像和名称作为归属信息，语言、Stars、Forks 组成紧凑的数据带。沿用现有 `background`、`foreground`、`primary`、`muted`、`border` 语义色，冷蓝为唯一交互强调；保持平面分隔线而非新增卡片层级。标题使用现有 sans 字体，排名与数值使用 mono/tabular 数字，4px 间距基准和现有紧凑密度不变。

交付面只有现有 `/technology/github` 页面和共享主导航。桌面为“排名 / 内容”两列，仓库信息内部按作者、名称、简介、数据带纵向排列；手机保持相同信息顺序并允许文字自然换行。加载沿用分区骨架，空态和错误态沿用现有提示，分页沿用现有无限列表。

技术栈沿用 Next 16.3.4、React 19.2.8、Tailwind 4.3.3、lucide-react 1.40.0 和现有组件，不新增依赖。已读取仓库内 Next.js Linking and Navigating 指南。UI Skills MCP registry 未向当前任务暴露，按仓库 `ui-quality.md`、既有组件和已确认视觉决策回退实施。

## Verification

- 回归测试先证明旧行为：GitHub 条目生成站内详情 URL、主导航缺少开源排行、API 仍请求全球榜；实施后对应测试转绿。
- `pnpm test`：API 8 个文件 61 项、Web 37 个文件 120 项全部通过。
- `pnpm check-types`：API 与 Web 均通过。
- 修改范围 Biome 检查及 `git diff --check` 通过。全仓 `pnpm lint` 仍受 152 个既有 CRLF 格式诊断阻断，首个诊断为未修改的 `apps/web/app/about/page.tsx`；本次未机械改写无关文件。
- 首次 `pnpm build` 因环境缺少必填 `SITE_URL` 在 `/robots.txt` 预渲染处停止；设置临时非生产值 `SITE_URL=http://localhost:3000` 后，全仓构建通过，Web 生成 55/55 页面。
- 本地真实 Supabase 快照在桌面和 390px 手机验证：排名、头像、作者、仓库名、简介、语言、Stars 与 Forks 均呈现；仅“开源排行”主导航高亮；页面宽度 375px 时 `scrollWidth` 与 `clientWidth` 都为 375，无页面级横向溢出；明暗主题正常。
- 点击真实首条仓库进入 `/out?url=https://github.com/...&from=/technology`，未进入 `/technology/github/[slug]`。控制台只有既有 AdSense `data-nscript` 警告，无本次功能错误。
- 公开 `rsshub.app` 无凭据探测连接超时；本地旧快照仍为全球榜。中文路由的真实条目数和数据质量必须在 API 部署并重新采集后按生产顺序验证。
- 完成标准与代码审查未发现剩余阻塞项。无适合另立 roadmap 的已接受代码后续；生产重新采集与云端数据核验是本次交付门禁，不能作为可选后续省略。

## Risks

- RSSHub 描述格式变化可能使单个元数据字段缺失；界面必须优雅降级，不能显示错误的零值。
- GitHub 头像是外部资源，网络或隐私插件可能阻止加载；文本作者名始终保留。
- 中文自然语言筛选可能减少榜单条目数量；这是用户确认的默认产品行为。
- 生产 RSSHub 路由需要 `GITHUB_ACCESS_TOKEN`，本地公共实例超时，真实中文榜数据质量必须在代码部署后按生产门禁复核。
