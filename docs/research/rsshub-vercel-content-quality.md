# RSSHub Vercel 部署与文章内容质量核查

> 调研日期：2026-09-12（Asia/Shanghai）  
> 范围：RSSHub 官方文档与官方 GitHub 源码。路由实现核对固定在 RSSHub 提交
> [`0a4ecdb`](https://github.com/DIYgod/RSSHub/tree/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc)，部署文档固定在
> [`0e30260`](https://github.com/RSSNext/rsshub-docs/tree/0e3026065bee4a969667a168815fac4c25420e2f)。

## 结论

本次点名的五条路由——`/10jqka/realtimenews`、`/zhihu/hot`、
`/steam/search/filter=topsellers`、`/v2ex/topics/hot`、`/chinanews`——**都不依赖
Puppeteer、Playwright 或 Chromium**。因此目前看到的短正文、空摘要、只有价格和评分，不能归因于
Vercel 没有配置浏览器运行时。

它们的实际原因分别是：

- 同花顺路由只保存列表 API 的 `digest`，不抓详情页；
- 知乎热榜只保存热榜 API 的 `excerpt`，该字段不存在时主动输出空字符串；
- Steam 搜索路由只把搜索结果页里的价格、折扣和评分拼成描述，从未进入游戏详情页；
- V2EX 热门路由直接保存主题首帖，首帖很短时 Feed 也会很短；
- 中新网路由会抓详情页，但只认识三类正文容器。视频页若正文容器本来只有“责任编辑”，或页面采用了未覆盖的模板，路由就可能只产出这一小段。

Vercel/Serverless 对**其他确实要求浏览器的路由**仍然可能是问题。官方文档明确区分不含浏览器的普通镜像和含 Chromium 的镜像，也提供浏览器 WebSocket 或本地 Chromium 的配置入口；但 Vercel 部署章节没有承诺内置 Chromium。普通 Vercel 部署若没有可用浏览器，真正依赖浏览器的路由更可能直接报错或失败，而不是在返回成功 Feed 的同时静默缩短正文。最后一句是根据 RSSHub 路由调用方式作出的工程判断。

## 逐路由核对

| 路由 | 官方源码实际做法 | 是否可能因 Vercel 缺浏览器而变短 | 对当前现象的判断 |
| --- | --- | --- | --- |
| `/10jqka/realtimenews` | 请求同花顺 `tapp/news/push/stock` API，将每项的 `item.digest` 同时写入 `description` 和 `content`，不访问文章详情页；元数据明确为 `requirePuppeteer: false`。[源码：取数与字段映射](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/10jqka/realtimenews.ts#L13-L51)、[功能声明](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/10jqka/realtimenews.ts#L91-L95) | 否 | “正文就是摘要”是路由设计，不是部署异常。 |
| `/zhihu/hot` | 请求知乎热榜 API，只把 `target.excerpt` 包成描述；没有 excerpt 时明确写入空字符串。`ZHIHU_COOKIES` 是可选配置，且 `requirePuppeteer: false`。[源码：路由特性](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/zhihu/hot.ts#L9-L25)、[API 与字段映射](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/zhihu/hot.ts#L37-L56) | 否 | 短文本或空文本来自热榜 API 的 excerpt，路由没有尝试抓回答全文。`antiCrawler: true` 意味着整个请求可能受风控影响，但这与“成功返回后正文短”不是同一问题。 |
| `/steam/search/filter=topsellers` | 使用普通 HTTP 请求抓 Steam 搜索页并用 Cheerio 解析；描述只拼接 Bundle 信息、折扣、原价、售价与评价摘要，没有详情页请求，也没有浏览器调用。[源码](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/steam/search.ts#L22-L64) | 否 | “详情只有价格和评分”正是该搜索路由定义的输出，不是正文抓取失败。 |
| `/v2ex/topics/hot` | 请求 V2EX `api/topics/hot.json`，把 `item.content` 与 `item.content_rendered` 作为正文；元数据明确为 `requirePuppeteer: false`。[源码：路由特性与 API](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/v2ex/topics.ts#L27-L44)、[字段映射](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/v2ex/topics.ts#L53-L63) | 否 | 路由保存的是主题首帖，不包含回复；“如题”或十几个字很可能就是发帖人原文。 |
| `/chinanews` | 先抓滚动新闻列表，再对每一篇使用普通 HTTP 请求抓详情页，以 Cheerio 从 `div.content_desc`、`div.t3` 或 `div.left_zw` 中选择正文。[源码](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/routes/chinanews/index.ts#L27-L75) | 否 | 只剩“责任编辑”更像视频页面内容本来很少，或详情模板没有被这三个选择器完整覆盖。此路由默认逐篇请求详情，Serverless 超时会造成整次路由失败风险，但不会自动把正文截成编辑信息。 |

## Vercel 与浏览器运行时的官方边界

RSSHub 官方中文部署文档提供了以下明确事实：

1. 普通 `latest` Docker 镜像不支持 Puppeteer，`chromium-bundled` 镜像支持；官方同时说明浏览器支持会占用更多资源，但能支持更多路由。[官方部署文档源码](https://github.com/RSSNext/rsshub-docs/blob/0e3026065bee4a969667a168815fac4c25420e2f/src/zh/deploy/index.md#L37-L55)
2. 单容器部署也明确把“不含 Puppeteer”和使用 `chromium-bundled` 的方式分开。[官方部署文档源码](https://github.com/RSSNext/rsshub-docs/blob/0e3026065bee4a969667a168815fac4c25420e2f/src/zh/deploy/index.md#L107-L126)
3. 官方配置文档提供 `PUPPETEER_WS_ENDPOINT` 连接外部浏览器，以及 `CHROMIUM_EXECUTABLE_PATH` 指向本地 Chromium；并说明 Docker 应优先使用 `chromium-bundled` 镜像。[官方配置文档源码](https://github.com/RSSNext/rsshub-docs/blob/0e3026065bee4a969667a168815fac4c25420e2f/src/zh/deploy/config.md#L151-L157)
4. 当前官方 `docker-compose.yml` 展示的是两种浏览器方案：改用 `chromium-bundled`，或运行 `browserless/chrome` 并设置 `PLAYWRIGHT_WS_ENDPOINT`。[官方 Compose](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/docker-compose.yml#L1-L28)。这里与中文配置页仍使用 `PUPPETEER_WS_ENDPOINT` 的命名存在版本迁移痕迹，实际部署应以所部署提交的代码和 Compose 为准。
5. Vercel 部署章节只说明导入仓库、自动同步和一个 ESM 兼容环境变量，没有说明 Vercel 部署自带 Chromium，也没有给浏览器运行时配置步骤。[官方 Vercel 部署章节](https://github.com/RSSNext/rsshub-docs/blob/0e3026065bee4a969667a168815fac4c25420e2f/src/zh/deploy/index.md#L390-L405)。RSSHub 当前 `vercel.json` 也只是 Hono 框架和输出/重写配置，[没有浏览器配置](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/vercel.json)。

所以，不能把“Vercel 一键部署”理解成“所有标记为需要浏览器的路由都天然可用”。对需要浏览器的路由，应单独验证浏览器运行时和函数资源限制；但这个风险与本次五条路由的内容质量问题无关。

## 生产实例对照

2026-09-12 对 [`rss.ljhboard.cn`](https://rss.ljhboard.cn) 做了匿名只读验证。响应头显示当前实例运行在 Vercel。

- `/10jqka/realtimenews?mode=fulltext&limit=3` 返回 HTTP 200，三条正文分别为 480、222、294 字符，约 5.8 秒完成。
- `/zhihu/hot?mode=fulltext&limit=3` 返回 HTTP 200，三条正文分别为 353、747、414 字符，约 4.9 秒完成。
- `/chinanews?mode=fulltext&limit=3` 返回 HTTP 200，三条正文分别为 1924、1105、1730 字符，约 3.5 秒完成。
- Steam 的 3 条全文请求在客户端 25 秒上限内未完成；改为 `limit=1` 后返回 HTTP 200，正文约 166 KB。缓存命中后同一请求约 0.6 秒完成。

这说明 Vercel 上的当前实例能够执行 RSSHub 的通用 `mode=fulltext`；该模式使用普通 HTTP 请求和 Mercury Parser，并不等于 Puppeteer。不过它会显著增加详情请求数量、响应时间和输出体积，尤其不适合未经逐源验证就对 20–30 条榜单全量开启。全文解析失败时 RSSHub 会保留原有描述，因此“HTTP 200 但仍是摘要”也不能证明已经成功提取全文。[官方中间件实现](https://github.com/DIYgod/RSSHub/blob/0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc/lib/middleware/parameter.ts)

## 对本站排查的直接含义

- 不需要为了修复这五个来源的短正文而先迁移 RSSHub 部署或给 Vercel 加 Chromium；这不会改变路由当前选择的字段。
- 同花顺、知乎热榜、Steam 搜索、V2EX 热门应该按“摘要/榜单条目”建模，而不是承诺它们一定有完整文章正文。
- 中新网应单独抽样视频页 HTML，并决定是扩展 RSSHub 的模板选择器、对短内容标记为摘要，还是直接引导用户阅读原文。
- 只有当某条路由的官方元数据或源码确实调用浏览器工具，而且线上表现为 5xx、超时或浏览器缺失错误时，才应优先把问题归到 Vercel/Puppeteer/Chromium 配置。
