# 免费文章翻译 API 调研

> 调研日期：2026-10-08（Asia/Shanghai）。目标是将 RSS 英文文章正文翻译成中文，减少现有 MTran 本地推理开销；不是管理网站按钮、菜单的多语言文案。本次只查官方资料和本地实现，未调用带凭据的翻译接口、未测线上性能、未部署或修改产品代码。

## 建议

优先评估 **Azure Translator F0**：每订阅月 200 万字符、用尽停止、支持 HTML。Google Cloud Translation 可作为备选，但需开启 Billing，超出免费额度会收费。这个排序是依据免费额度、HTML 能力和接入复杂度作出的推断，实际质量、延迟和生产网络连通性尚未验证。

用户提供的列表混合了翻译管理和机器翻译额度。免费管理字符串、开源项目免费、自托管软件免费，都不能直接等同于免费文章翻译算力。

## 直接翻译 API

| 服务 | 当前免费条件 | 正文 / HTML 能力 | 判断与官方依据 |
| --- | --- | --- | --- |
| Azure Translator F0 | 每订阅月 200 万字符；免费层用尽后停止，到下个订阅月恢复 | Text Translation 支持 `textType=html`；英文到简体中文可用 `from=en&to=zh-Hans`，HTML 标签应完整 | 首选候选。见 [FAQ](https://www.microsoft.com/en-us/translator/business/faq/) 与 [Translate API](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate) |
| Google Cloud Translation NMT | 每月前 50 万字符，通过每月 $10 抵扣实现，Basic / Advanced 共享；超额 $20 / 百万字符 | 支持 HTML，翻译标签之间的内容；需启用 Billing | 有长期免费额度，但需控制超额费用。见 [价格](https://cloud.google.com/products/translate/pricing?hl=en)、[设置](https://docs.cloud.google.com/translate/docs/setup)、[文本翻译](https://docs.cloud.google.com/translate/docs/translate-text) |
| DeepL | 新 Developer 计划为 100 万字符总量，不按月重置；旧 API Free 每月 50 万字符，但已停止新购 | 支持 `tag_handling=html` | 新账号不能按旧免费表理解为永久每月额度。见 [API plans](https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-plans)、[HTML 翻译](https://developers.deepl.com/docs/translate/translating-html) |
| Cloudflare Workers AI | 每账户每天 10,000 Neurons，与其他模型共享；不是字符额度。Free 超额失败，Paid 超额计费 | `m2m100-1.2b` 有运行时 REST API；本次未找到保留 HTML 的模式 | 备选；需按文本节点翻译再还原 HTML，且需实测质量。见 [价格](https://developers.cloudflare.com/workers-ai/platform/pricing/)、[模型 API](https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/) |
| 腾讯机器翻译 | 自 2026-10-01 停止发放新免费资源包；文本翻译和批量文本翻译下线，不支持新用户 | 旧账号需另查实际权益 | 不作为新接入免费方案。见 [2026-09-21 更新的快速入门](https://cloud.tencent.com/document/product/551/104415) |
| 百度通用翻译 | 当前产品页确认完成认证最高每月 200 万字符；本次未抓取到细分档位价格页 | 需确认实际账户计划和 HTML 处理策略 | 可继续核实，不采用旧列表的“标准版无限免费”说法。见 [产品页](https://fanyi-api.baidu.com/product/11) |

按每篇 10,000 个计费字符粗算，Azure 免费额度约支持每月 200 次首次全文翻译，Google 约 50 次。它们是翻译次数，不是用户数；缓存命中可复用，缓存过期或同文重译仍消耗额度。各厂商实际计数规则需在接入时核实。

## 用户列表中的重点服务

| 服务 | 免费额度及 API 事实 | 对文章正文的适合程度 |
| --- | --- | --- |
| AutoLocalise | 当前主页仍列每月 10,000 字符、1 个项目、100+ 语言。计费是源字符数乘目标语言数。Next.js 文档公开 `translateServerStrings`，说明它确实能调用云端翻译，而不只是管理文件 | 可以作为小规模试用，但额度约等于一篇 10,000 字符文章。文档的 `tf` 保留 React 嵌套格式，不能据此推定原始 HTML 正文可直接完整翻译；本次未确认通用 HTTP 正文翻译协议和 HTML 模式。见 [主页价格及计数](https://www.autolocalise.com/)、[Next.js 服务端文档](https://www.autolocalise.com/docs/nextjs-ssr) |
| Lingo.dev | 当前官方 `/en/pricing` 已改为 Sandbox / Production 的按量模式；Production 基础费 $99 / 月，另有引擎费、上游 LLM 成本和基础设施计费。页面的 Sandbox `$0/mo` 不代表请求算力免费。旧语言首页仍能搜到“每月 10,000 单词”，与当前价格页不一致，不能据此推荐长期免费生产 API | 确实有同步 `POST /process/localize` 和异步正文翻译 API。同步接受键值对象并保持 JSON 结构，文档推荐长内容用异步；未确认专门的 HTML 保留模式。见 [当前价格](https://lingo.dev/en/pricing)、[API 总览](https://lingo.dev/en/docs/api)、[Localize](https://lingo.dev/en/docs/api/localize) |
| Tolgee | Cloud Free 当前列 30,000 hosted words、3 个席位；hosted words 是源文本加译文的存储量，不能当作每月免费翻译量。官方说免费计划有 MT credits 限制，但本次当前公开价格页未确认 Free 的具体 MT 数值。自托管免费版需要自带机器翻译服务 API key | 有机器翻译 API，但官方端点针对项目内已有 keys 启动批量作业。可用于本地化流程，增加项目、字符串和导出管理，不是本文需求的最短路径。见 [价格](https://tolgee.io/pricing)、[自托管条件](https://tolgee.io/pricing/self-hosted)、[MT API](https://docs.tolgee.io/api/machine-translation)、[额度耗尽规则](https://docs.tolgee.io/platform/projects_and_organizations/organization_settings) |
| POEditor | Free 为 1,000 strings 的管理额度；官方 FAQ 另列每账户 10,000 免费 Automatic Translation 字符，没有声明每月重置，更多需购买。机器翻译 API 实际调用 Google / Microsoft / DeepL | API 按项目源语言发送已有字符串，示例有 `format=html`。能自动翻译，但免费字符串数不等于长期免费翻译字符数。见 [FAQ](https://poeditor.com/help/faq)、[API v2](https://poeditor.com/docs/api) |

本次没有逐个重新核实其余十余家平台，所以不将它们一概标为“没有机器翻译 API”。已有证据足以说明：若目标是动态 RSS 正文翻译，应优先寻找直接机器翻译接口，而不是依据免费翻译管理清单选型。

## 本地实现与后续接入边界

主代理读取本地代码发现：`apps/web/lib/article-translation.ts` 当前调用 MTran，最多并发 2 个请求，缓存版本包含 `mtran-4.0.33-en-zh-v1`；`apps/web/lib/redis-cache.ts` 已有 7 天缓存，缺少 `REDIS_URL` 或 Redis 失联会跳过缓存。这些是代码层观察，未测线上 CPU、内存和缓存命中率。

接入外部 API 时，保留已有缓存、请求去重、HTML 清洗和双语 UI，更新翻译缓存版本避免混用结果。若目的是释放本地推理资源，不应默认在云 API 超限后自动回退本地 MTran。先用真实文章验证英文到中文的术语、链接、代码块、段落结构、延迟和字符计数，再决定上线方案。
