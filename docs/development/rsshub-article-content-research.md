# RSSHub 正文保存与站内阅读研究

调研日期：2026-09-07。范围：官方源码、RSS 规范及阅读器/清洗库一手资料；不包含逐源生产全文成功率验证。RSSHub 文档站本次返回 403，因此实现结论以官方仓库源码为依据。

## 结论

所有分区可以共用站内详情。优先保存 feed 已提供的 HTML 正文，再生成独立的纯文本摘要；不要把正文先转纯文本截断。RSSHub 可作为正文上游，但 `mode=fulltext` 是尽力提取，不能保证每篇文章完整。页面应使用“正文 / 来源摘要 / 暂无正文”等诚实状态，不因存在 `description` 就显示“全文”。这是本项目的实施建议。

## RSSHub 能提供什么

- 官方实现的 `mode=fulltext` 会请求每条 `item.link`，使用 `@jocmp/mercury-parser` 提取并缓存；内容长度大于 40 才替换 `description`，失败保留原描述。它不是可靠的全文成功标记。原站脚本渲染、反爬或登录要求可能使普通 HTML 提取无结果，这是由上述请求方式推导出的限制。[官方 parameter.ts](https://github.com/DIYgod/RSSHub/blob/master/lib/middleware/parameter.ts)
- 同一实现会处理懒加载图片、补全相对链接、移除 script；这不能替代本站安全边界。尤其全文覆盖发生在初始 HTML 处理之后。[官方 parameter.ts](https://github.com/DIYgod/RSSHub/blob/master/lib/middleware/parameter.ts)
- 内部条目支持 `description`、`content.html`、`content.text`、`summary`；因此接入层应识别实际 feed 输出字段，而不是只接受一个被截断的摘要字段。[官方类型](https://github.com/DIYgod/RSSHub/blob/master/lib/types.ts)
- RSS 的 `description` 可以是摘要，也可以是完整内容；`content:encoded` 更明确地表达条目完整 HTML，允许和摘要同时出现。建议解析时优先非空 `content:encoded`，再使用相应格式的 HTML content，最后 description；这是一项本项目策略，不是所有 feed 均遵守的保证。[RSS Best Practices Profile](https://www.rssboard.org/rss-profile#namespace-elements-content-encoded)

## 阅读效果参考

RSSHub 的核心产物是 feed。官方 README 将 Folo 作为配套阅读器推荐，而非提供可直接嵌入本站的文章 UI。阅读呈现可参考 [Folo 开源项目](https://github.com/RSSNext/Folo)，不应期待加一个 RSSHub 参数就获得完整站内阅读页面。[RSSHub README](https://github.com/DIYgod/RSSHub/blob/master/README.md)

建议本轮采用轻量阅读版式：清晰标题、来源/作者/时间、独立摘要引言、约 680–760 px 的正文栏；正文保留标题、段落、列表、引用、图片说明、代码及表格。图片宽度不超过容器；代码和宽表格内部横向滚动；链接保持明显下划线；原文入口放在文章信息区和末尾。缺正文时展示已有摘要及原文入口，不伪装成空的“完整文章”。这些是本站设计建议，不是声称已经验证 Folo 的具体实现。

## 安全与保存方案

Mozilla Readability 明确说明正文提取不是安全清洗，建议 sanitizer 与 CSP；Node DOM 不应启用脚本执行或自动资源抓取。[Readability 安全说明](https://github.com/mozilla/readability#security)

建议使用成熟 HTML 解析清洗库，在服务端实施标签/属性 allowlist；保留语义正文标签，拒绝 script、style、iframe、表单、事件属性及任意原站 class/style。URL 仅允许 http/https（链接可另允许 mailto），相对 URL 基于原文地址解析。不要用正则表达式充当完整 HTML sanitizer。`sanitize-html` 支持逐标签属性及 scheme 策略；其维护位置已迁至官方 monorepo。[sanitize-html 文档](https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html)

建议独立保存安全 HTML 正文、正文纯文本、来源类型及抓取时间，列表接口继续只返回摘要，详情接口按需返回正文。已有文章允许无正文，后续正常采集或受控回填补齐。仅保存上游提供的可获取内容不意味着具备任意第三方内容的转载权；RSSHub 的技术能力不构成内容授权。不要实现登录/付费限制绕过，也不要给全部来源默认开启额外逐篇抓取。

## 可操作验收项

1. AI、科技、新闻、社交、财经、游戏条目均可打开稳定详情 URL。
2. feed HTML、`content:encoded`、空内容三种输入有测试；摘要不再覆盖正文。
3. HTML 注入、危险协议、畸形标签、相对链接、图片、代码、表格有验证。
4. 保存后再次查询仍得到正文，列表响应不携带大段正文。
5. 全文增强按来源实测；失败降级摘要且保留已有成功正文，不把短摘要标为完整正文。
6. 旧数据无正文状态可用；新增云端字段及生产采集需要实际部署/迁移后才能验证，研究不代表已完成上线。
