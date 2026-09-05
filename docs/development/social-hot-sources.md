# 社交媒体热点来源

## Background

在现有科技、国内新闻与 AI 平台分区之外，增加独立的社交热点入口。来源选择以匿名访问、真实 RSS 数据和
当前部署运行时可用为前提；微博与小红书当前都依赖浏览器运行时或登录态，不能通过生产数据门禁，因此不以
固定话题或假数据替代。

## Scope

- 首批接入哔哩哔哩综合热门、知乎热榜、酷安热榜、虎扑话题、少数派 Matrix 与今日头条热榜。
- 新增 `/social` 六来源总览、`/social/[source]` 来源详情、首页社交摘要和主导航入口。
- 扩展 API 来源白名单、通用采集入口、Supabase 约束和错峰 Cron。
- 从 RSS 条目 HTML 中提取第一个合法 `<img>` HTTP(S) 地址，写入可空的 `hot_items.image_url`。
- 新增通用媒体预览组件：默认懒加载；加载中、缺图和加载失败时显示统一占位；真实图片成功后平滑替换。
- 社交总览与详情列表只在条目具有真实图片地址时展示媒体区域，避免为无图来源制造内容图片。

## Out of scope

- 需要 Cookie、登录账号、代理或 Playwright 的微博与小红书来源。
- 把固定小红书话题榜伪装成全站热榜，或使用演示新闻、假封面、自动生成封面。
- 视频站内播放、弹窗播放器、评论、点赞或跨平台统一热度分数。
- 新 UI 库、图片代理、图片持久化或 CDN 转存。

## Acceptance criteria

- `/social` 展示六路来源各自前三条，`/social/[source]` 展示该来源完整列表；未知或跨分区来源返回 404。
- 首页新增社交分区，每个来源展示一条，外链继续经过 `/out` 并能返回社交分区。
- B 站条目保留 `bilibili.com/video/BV...` 直链、UP 主、发布时间和真实封面。
- RSS 解析只接受 `<img>` 的 HTTP(S) URL，不误取 iframe 播放器，不接受脚本协议；无图时写入 `null`。
- 通用预览固定 16:9，默认 `loading="lazy"` 和异步解码；加载完成前、缺图和失败时布局稳定并显示统一占位。
- 图片本身不成为额外操作目标；条目标题仍是清晰可访问的离站入口。
- 任一来源为空或失败时不清除最后成功数据，也不影响其他来源。
- 所有来源完成部署、云端 Supabase 迁移和手动生产采集验证后，才能启用对应 Cron。
- 格式、lint、类型检查、API/Web 测试和生产构建通过。

## Feasibility

结论：可行。

- 当前自建 RSSHub 匿名实测 `/bilibili/popular/all` 返回 200 和 20 条；条目含 B 站视频直链、UP 主、
  发布时间和 `i2.hdslb.com` JPEG 封面，封面 HEAD 请求返回 200。
- 知乎、酷安、今日头条、虎扑、少数派对应公开路由已匿名返回非空 RSS。B 站热门搜索、微博热搜和小红书
  路由在当前 Vercel RSSHub 部署会触发 Playwright/登录依赖，因此采用 B 站综合热门并后移微博、小红书。
- 数据库需新增可空 `image_url` 并扩展来源/分区组合约束。现有公开只读 RLS 不需要放宽。
- HTML 图片提取是主要数据风险：实现只解析 `<img>` 标签的 `src`，先解码实体再进行 URL 协议校验，
  避免把 B 站 iframe 的播放器地址当作封面。
- 外部图片可能防盗链、过期或加载缓慢。客户端不代理图片，使用 `referrerPolicy="no-referrer"`、原生懒加载、
  固定宽高比和常驻占位兜底；失败不会影响正文与链接。
- UI Skills MCP 注册表未在当前环境暴露，因此不声明 UI Skills 审查；使用 `frontend-design`、仓库现有 token
  和 UI 质量清单作为替代基线。

## Implementation

- 读者是快速扫描多平台热点的人；主动作仍是阅读标题后通过受控中转打开原内容。
- 复用既有平面信号台、信号橙、系统中文字体和等宽数据标签。媒体占位使用低对比度频谱线作为本产品的
  识别元素，不增加渐变、阴影或卡片层级。
- 媒体预览是可复用客户端小组件，固定宽高比以避免布局偏移；仅透明度参与状态切换并尊重减少动态效果。
- 社交页覆盖 loading、ready、empty、source error、图片 loading/success/error 和 404；桌面与移动端、
  键盘和触摸输入均在范围内。
- 技术栈维持 Next.js 16.3.4、React 19.2.8、React Aria Components 1.17.0、Tailwind CSS 4.3.3 和
  lucide-react 1.40.0，不新增依赖。静态图片展示不需要 React Aria 交互原语。

## Verification

已完成：

- 真实 RSS 回归全部匿名返回 HTTP 200：B 站 20 条（20 张封面、20 个发布时间）、知乎 30 条、酷安
  20 条（18 张封面）、虎扑 30 条、少数派 20 条（20 张封面）、今日头条 15 条（15 张封面）。
- B 站首条解析结果为 `www.bilibili.com/video/BV...`，封面主机为 `i2.hdslb.com`；没有把同一描述中的
  `html5mobileplayer` iframe 当成图片。
- API Vitest 45 项、Web Vitest 33 项通过；Biome 格式与 lint、TypeScript 类型检查、生产构建通过。
- 生产构建包含 `/social` 与 `/social/[source]`。使用本地生产服务器做无界面 HTTP 回归：总览和 B 站详情
  返回 200，未知来源与跨分区 `/social/github` 返回 404，离站页可返回 `/social`。
- 本地 `supabase test db --local` 因 Docker 数据库未运行而无法连接 `127.0.0.1:54322`；这只是补充检查，
  不作为云端验证替代品，也不阻塞代码审查。
- [Supabase 2026 年 Data API 自动暴露变更](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
  不影响本迁移：这里只给既有 `hot_items` 增加列，不创建新表，且既有只读授权与 RLS 保持不变。

生产验证已完成：

- PR #6 合并提交 `5c3467e` 已由生产 API 加载；健康检查返回 200，未授权访问新社交入口返回 401。
- 云端迁移 `20260905070524_add_social_sources_and_previews` 已应用，迁移历史一致，`public` schema lint
  无错误。
- 六路生产采集均返回 HTTP 200；最终批次及条目数为：B 站
  `5b2e6c26-4c1f-44cc-b8ee-da7a2ca6e19b` / 20、知乎
  `46f1b4d8-bcde-49d8-9893-5ed2befc023d` / 30、酷安
  `2749df3c-0739-4a2d-b67b-060bb2ba4351` / 19、虎扑
  `bf0efea1-a3f3-434b-90fa-272b51aa7ead` / 30、少数派
  `7ebf8252-81d4-4ca2-b712-413ac5a52329` / 20、头条
  `8f721405-3a36-4064-ade7-813e183d39e0` / 15。
- 六路 `ingestion_runs`、`source_status` 和 `hot_items` 批次一致，共 134 条；标题非空、链接为 HTTP(S)、
  排名均从 1 连续到条目数且每路至少有一个发布时间。图片数为 B 站 20、酷安 17、少数派 20、头条 15，
  知乎和虎扑为纯文字。
- `pnpm setup:cron` 对全部 24 路重新完成 API 与云端行验证，共写入 495 条后才调度。云端查询确认 24 个
  五小时来源任务全部 active 且 24/24 从 Vault 读取 `signal_ingest_base_url` 与 `signal_cron_secret`；
  30 天保留清理任务也 active。
- 使用 Web 的 publishable key 匿名读取 B 站首条成功：位置 1、视频域名 `www.bilibili.com`、封面域名
  `i2.hdslb.com`、发布时间非空，封面 HEAD 返回 200。

## Review

- Standards：来源白名单、分区约束、HTTP(S) 图片校验、公开只读 RLS、鉴权顺序和单源失败隔离保持成立；
  动态外部图片不经过站内代理，避免开放任意主机的 Next 图片优化入口。
- Spec：六路社交来源、独立路由、首页摘要、视频直链、真实封面、懒加载、加载/失败占位、真实 404 和
  Cron 前云端复核均有代码与测试覆盖。
- Blocking：审查发现社交动态路由未进入代理白名单，导致未知来源出现软 404；已补齐并以生产服务器验证
  HTTP 404。没有剩余阻塞项。
- Accepted follow-up：微博与小红书的匿名可用性复评记录在
  [社交热点来源 roadmap](../roadmaps/social-hot-sources.md)。

## Risks

- 上游公开接口和 RSSHub 输出结构没有 SLA；每路失败必须保持隔离。
- 外链图片由第三方托管，无法保证长期可用；统一占位是正常状态，不应视作采集失败。
- `section` 与来源 ID 仍分散在 Web、API 和 SQL，修改时需通过测试防止漂移。
- 微博、小红书暂不满足匿名生产门禁，后续只能在合法且稳定的无凭据方案出现后重新评估。

相关后续：[社交热点来源 roadmap](../roadmaps/social-hot-sources.md)。
