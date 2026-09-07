# 全分区站内阅读与 Feed 正文保存

## Background
用户要求全部分区进入站内详情、保存第三方全文并研究 RSSHub 的阅读效果。研究见 [RSSHub](rsshub-article-content-research.md)。当前解析器剥掉 HTML，且详情仅支持新闻。

## Scope
所有分区使用 /{section}/{source}/{slug}；保留原新闻 URL。保存 Feed 实际提供的 HTML（content:encoded 优先），正文仅详情查询。统一来源、时间、标题、正文、原文链接的阅读页面。

## Out of scope
绕过付费/登录、给所有来源盲目开启 fulltext、自动宣称完整性、生产部署和 Cron 改动。额外网页抽取需要逐源验证，不把摘要伪装成全文。

## Acceptance criteria
列表与搜索均进入站内详情；六分区合法来源可读；旧数据仍显示摘要；正文保存不丢段落结构；HTML 清洗覆盖脚本、事件属性、危险链接、嵌入和样式；404/410、失效和原新闻 URL 保持一致。

## Feasibility
Feed 已提供 HTML，保留它即可恢复原有结构；RSSHub mode=fulltext 失败会回退摘要，因此不能据字段存在判断全文。增加可空 content_html，旧行不回填伪正文；数据库迁移先于 API 部署。原有只读 RLS 沿用。Web 清洗存储的非可信 HTML，只使用 HTTP(S) 链接；正文限制 512 KiB，超限保留摘要，避免单条异常导致内存放大。

## Implementation
用户本次明确修改之前“不保存正文”的范围，沿用当前分支。UI 采用现有 React Aria、Tailwind 和冷蓝主题，新增的是已要求的各分区阅读页，无新 UI 库。阅读栏约 46rem，标题与来源在上、正文在下、原文入口在首尾；约 18px 正文、宽松行距；手机缩小字号，代码表格局部横滚。保留此前不展示文章图片的偏好，正文图片暂不渲染。UI Skills 未暴露，按 frontend-design 与仓库参考回退。

## Verification
- Web 93 项、API 56 项测试通过；Web/API 类型检查通过；改动文件 Biome 和 git diff --check 通过。
- 使用仅对该构建进程有效的 SITE_URL=http://localhost:3000，生产构建通过（54/54 静态页面）；未写入正式域名配置。此前一次构建遇到 Supabase 超时，复跑成功。
- 真实 GitHub Blog 官方 Feed HTTP 200、10 项；抽样三篇保存 HTML 长度 486395 / 4339 / 9165 字符，摘要长度 333 / 243 / 264，均保留段落与标题。这是解析验证，没有写入云端。
- 浏览器检查首页已显示今日热点与分类高亮，社交文章链接指向 /social/hupu/{slug}。
- 云端只读迁移列表目前止于 20260906022000，缺失 20260907095143_complete_content_lifecycle 和本次正文迁移；本地详情预检实际 HTTP 503。未绕过保护逻辑，未应用云迁移、部署后端或触发生产抓取。真实详情的桌面/手机/主题视觉验收仍被该前置条件阻断。

## Review
- 标准：延续既有来源注册表与阅读壳，清理已失效的 internalArticles 开关。无新增 UI 库；sanitize-html 2.17.7 与类型包 2.16.1 精确固定。
- 验收：六分区路由生成、可见性预检、404/410/503、HTML 清洗、超大正文和新闻摘要兼容有回归覆盖。列表、搜索与来源入口共用详情规则；正文只在详情查询读取。
- 修正：为详情数据库请求设置 10 秒上限；正文变化更新内容时间；所有分区删除均记录 tombstone，保留历史 news kind 避免旧链接兼容问题。
- 交付前置条件：应用生命周期和正文迁移，更新 API 后重新采集，验证真实保存与渲染。此项仍未验收，不能作为已完成工作或普通后续优化。
- 已接受的独立后续：按来源验证 RSSHub 额外全文提取，见 [正文增强路线图](../roadmaps/article-content.md)。

## Risks
旧记录直到后端重新抓取才有结构化正文；只有摘要的源仍只能显示摘要。保留原文归属与 noindex，不把复制内容视为本站原创。云迁移及生产真实写入未执行前不能标记上线完成。

## 2026-09-08 云端接通与发布状态
- 用户要求继续执行接通步骤。通过 Supabase 迁移工具已应用 add_github_blog_source、complete_content_lifecycle、preserve_article_content；工具分配的版本分别为 20260907160405、20260907160408、20260907160426，本地对应 SQL 文件已同步重命名。此前其他历史迁移的既有版本差异未在本任务调整。
- 迁移后 2,405 篇文章，content_html 列存在，content_tombstones 开启 RLS，公开角色非 SELECT 授权为 0；活跃 Cron 仍为 25。Security Advisor 只有 ingestion_runs 不公开的预期 INFO。
- 本地社交详情已恢复正常：真实虎扑文章显示来源、作者、日期和旧摘要。桌面与 390px 手机布局检查通过，手机 document scrollWidth=375 < innerWidth=390；主题切换可用，最终恢复浅色和默认视口。丰富正文仍待生产重新采集后验收。
- Vercel 项目 rss-site-api（Root Directory=server/api）已用已登录账号尝试 CLI 发布。首次上传网络失败且未创建部署；第二次归档上传创建 dpl_HWJqd5uWgcBwbUSnrYNMqNe6cP5F，但 Vercel API 明确返回 BLOCKED，原因：无法为提交作者找到 Git 账号。当前 HEAD 4f50c24 的作者为 Vitality <vitality@kreator-inc.com>，Vercel 登录账号为 ljh12138164。
- 未伪造作者或绕过作者检查；旧 API 生产 /health 仍为 200。未手动采集、未增加 Cron、未发布前端。下一步需用户确认正确的 Git 提交身份或完成该邮箱的 GitHub 关联，再发布并验证正文真实落库。
- 新增 .vercelignore 排除本地环境文件、依赖与构建缓存，避免 CLI 上传；未将任何密钥写入部署配置。
