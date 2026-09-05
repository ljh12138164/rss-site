# HERMES

## Active objective

研究科技、国内新闻、AI 与社交之外还可稳定抓取的热点分类，并确定下一轮实现优先级。

## Current state

- 已从 RSSHub 官方源码筛选财经、游戏、体育、影视文化、科学研究、生活消费和汽车七类，共匿名探测
  41 条候选路由；29 条在当前自建实例返回 HTTP 200 与非空 RSS。
- 财经 7/7 成功，推荐从华尔街见闻、财联社、金十数据、第一财经、证券时报、同花顺六个平台开始；
  六路合计 88 条且全部带发布时间。游戏 7/9 成功，列为第二优先。
- 体育只有两个稳定综合平台；影视榜单缺少发布时间；科学类混合趋势与最新；生活消费定位过宽；汽车
  只有一路稳定来源，均暂不直接实现。完整证据在 `docs/research/additional-hot-categories.md`。
- 本轮仅提交研究与开发交接文档，没有修改业务代码、写入云端 Supabase 或配置 Cron。

- 当前分支 `feat/social-hot-sources` 基于 `origin/master` 的 `d502dfd`，实现与验收记录在
  `docs/development/social-hot-sources.md`。
- 已新增 B 站、知乎、酷安、虎扑、少数派和今日头条六路匿名社交热点，以及 `/social`、来源详情、首页摘要、
  主导航和离站返回路径。
- 通用媒体预览已实现固定 16:9、原生懒加载、异步解码、加载/失败统一占位和成功淡入；RSS 解析只提取
  合法 `<img>` HTTP(S) 地址，B 站真实数据 20/20 条封面解析成功。
- Supabase 迁移新增可空 `image_url` 并扩展来源/分区约束；`setup:cron` 现在会在调度前复核云端批次、
  `source_status`、实际条数、字段质量和社交来源发布时间。
- API 45 项与 Web 33 项测试、格式、lint、类型检查和生产构建通过；无界面生产服务器回归覆盖 200、真实
  404 与社交离站返回。UI Skills MCP 未暴露，因此没有声称完成 UI Skills 审查。
- 本地 pgTAP 因 Docker 未运行而无法连接；尚未部署、应用云端迁移、写入生产 Supabase 或启用新 Cron。
- 实现提交 `fc6e21a` 已推送到 `origin/feat/social-hot-sources`；按仓库约定没有通过页面创建 PR。

- AI 首批来源已确定为 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI / Gemini 与 Qwen；来源证据和
  在线抓取结果在 `docs/research/ai-platform-official-article-sources.md`。
- 当前 AI 分支叠加在尚未合并的 `feat/technology-hot-sources` 上，复用其通用信号源基础设施；实现方案与验收
  记录在 `docs/development/ai-platform-articles.md`。
- `/ai`、`/ai/[source]`、首页 AI 摘要、18 路来源注册与 Cron、官方直连 Feed、GLM 标题归一化和数据库白名单
  已实现；API 38 项、Web 26 项测试、格式、lint、类型检查和生产构建通过。
- 五个可直接访问的 AI Feed 已在线通过当前解析器；修复后的 DeepSeek handler 在线返回 17 条官方新闻，
  `D:\code\rss` 的目标测试、类型检查和 lint 通过。
- 浏览器 1440px/390px、明暗主题、键盘焦点、404、无横向溢出与无控制台告警已经复核。
- pgTAP 已扩展为 24 项，但本机 Docker 数据库未运行，仍由 CI 或可用的本地 Docker 环境执行。
- rss-site 实现提交 `f4ab4f2` 已推送到 `origin/feat/ai-platform-articles`；RSSHub 修复提交
  `9b70ce5` 已推送到 `origin/feat/fix-deepseek-news`。

- PR #4 已合并；当前分支从 `origin/master` 的合并提交 `499dbdf` 创建，科技与国内新闻实现已在提交
  `c4e2886` 推送到 `origin/feat/technology-hot-sources`。
- 首页现在按“科技 / 国内新闻”展示十二路摘要；`/technology`、`/news` 与各自六个来源详情页已经实现。
- 新闻首批来源为新华社、央视国内、中国新闻网、澎湃热榜、界面中国和百度热搜；公开 RSSHub 路由无需
  Cookie 或 Token，每次采集最多保留前 30 条。
- API 来源模型已泛化为 `SignalSource`，支持通用 `/cron/signals/:source`、分区入口和旧掘金兼容入口；
  十二个 Supabase Cron 使用通用秘密名并在不同小时、分钟错峰。
- 数据库迁移使用来源/分区组合约束，pgTAP 计划为 21 项；公开热点与状态仍只读，内部运行记录不公开。
- React Aria 继续只承载交互组件，新闻页面复用已经确认的平面信号台视觉、语义 HTML 与响应式断点。
- API 33 项、Web 22 项测试，格式、lint、类型检查与生产构建已通过；生产服务状态码和浏览器桌面/移动、
  明暗主题、键盘焦点、404、无横向溢出及无控制台告警已经复核。
- 本机 Docker Desktop 未运行，`supabase test db` 仍需 CI 或有 Docker 的环境执行；没有修改生产数据库、
  Cron、部署或秘密。
- 国内新闻方案、证据、验收与审查记录在 `docs/development/domestic-news-sources.md`；来源调研记录在
  `docs/research/domestic-news-rsshub-sources.md`。
- UI Skills MCP 注册表未在当前环境暴露，因此不声明 UI Skills 审查；采用 `frontend-design`、现有 token
  与 UI 质量清单作为替代验收基线。

## Next action

用户确认是否优先实现财经分区；确认后再设计页面入口，并按生产门禁完成部署、云端 Supabase 验证和 Cron。

## Delivery constraint

不把 GitHub、Supabase、数据库或 Cron 密钥提交到仓库。只有代码部署与迁移完成后，才允许用生产端点写入
云端 Supabase 并启用已验证来源的 Cron；不通过页面创建 PR。
