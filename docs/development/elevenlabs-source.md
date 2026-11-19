# ElevenLabs Blog 全文来源

## 背景

[ElevenLabs 官方 RSS](https://elevenlabs.io/blog/rss.xml) 提供标题、时间、分类和部分作者署名。站内阅读需要从官方文章页提取正文，沿用 Modal 和 vLLM 已采用的 RSSHub 接入流程。

## 范围

- RSSHub 路由 `/elevenlabs/blog` 读取官方英文 Feed，按需补抓文章正文、封面、FAQ、表格、代码块和发布者提供的音视频。
- `rss-site` 的 AI 分区注册 `elevenlabs`。使用现有来源页、阅读器和品牌图标组件，单次最多抓取 20 篇。
- ECS PostgreSQL 新增迁移 `015-elevenlabs-source.sql` 和错峰 Cron。发布后由现有生产门禁验证并启用。

## 验收标准

- 官方 Feed 的当前条目在 RSSHub 默认、`limit=1` 和 `limit=100` 下可抓取。全量逐篇核对标题、链接、日期、可用作者、封面和正文富内容。
- `ingestSignal` 能对自建 RSSHub Feed 生成 20 条有日期、正文的唯一记录。业务任务清单和数据库来源约束包含新来源。

## 可行性

官方 Feed 当前提供 50 条英文条目。文章主体统一使用 `article .rich-text-blog > .typography`。RSSHub 所需的媒体地址可从正文或同页 Next.js Flight 数据读取。使用每批 5 个详情请求和详情缓存，数据库沿用现有约束重放模式。

## 实现

- RSSHub 还原折叠 FAQ、语义表格和 MP4、Vimeo、YouTube、音频。音视频同时附有可在站内阅读器打开的链接。
- 保留官方提供的作者，跳过通用封面并在正文图片可用时补封面。使用现有 `limit`，默认 20 篇。
- Cron 使用 `55 5,11,17,23 * * *`（UTC）。发布清单共有 86 个业务任务，其中 82 个来源任务和 4 个维护任务。旧迁移由 015 的完整约束接管。

## 验证

- 官方 RSS 匿名 HTTP 200，50 条，33,802 字节。基于上游 `fd1051c4c8` 的 RSSHub 路由提交为 `a9625b8464`。
- 本地 RSSHub 的 `limit=1`、默认、`limit=100&format=json` 均返回 HTTP 200，分别取到 1、20、50 条。逐篇核对所有正文段落、链接、发布时间和封面，以及 46 篇的官方作者。保留 113 个 FAQ、20 张语义表格、7 个代码块、11 个 MP4、5 个外部视频嵌入及 1 个音频。
- RSSHub 的文档构建、全仓 ESLint、类型检查、变更文件的 Oxfmt、CI Oxlint 和复杂度检查通过。站点全仓本地测试 324 项通过，22 项集成测试跳过，生产构建生成 94 个静态页面。全仓类型、变更文件 Biome、发布打包、Cron SQL 渲染及清单一致性检查通过。
- 2026-11-20 自建 RSSHub 主实例发布提交 `d09520a4b5`，Vercel 部署成功。公网 `limit=1`、默认和 `limit=100&format=json` 都返回 HTTP 200，分别为 48,209、525,214 和 1,164,495 字节。[公网 Feed](https://rss.ljhboard.cn/elevenlabs/blog)
- 用真实公网默认 Feed 调用 `ingestSignal`，替代存储收到 20 条唯一记录。20 条均有正文、发布时间和 HTTPS 封面，18 条有作者，单篇最大正文 58,885 字节。ECS 生产试抓及页面回归随站点 PR 合并发布执行。

## 风险

官网改动正文或媒体结构时，需要复核选择器和媒体映射。RSSHub 保留作者缺失状态，站内阅读器按现有规则使用媒体链接。
