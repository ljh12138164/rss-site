# 中国国内新闻 / 综合资讯 RSSHub 来源调研

> 调研日期：2026-09-05（Asia/Shanghai）  
> 范围：RSSHub 官方文档、RSSHub 官方仓库源码，以及公开实例 `https://rss.ljhboard.cn` 的只读 HTTP 实测。未读取、传输或配置任何 Cookie、Token 或账号凭据。

## 结论

建议首批接入以下 6 个来源。它们均不需要秘密，且本次公开实例实测返回 `200 application/xml` 和非空条目；组合覆盖权威要闻、电视新闻、滚动新闻、编辑热榜、商业媒体与全网搜索趋势。

| 来源 | 推荐路由 | 内容定位 | 实测条目数 |
| --- | --- | --- | ---: |
| 新华网 / 新华社 | [`/news/xhsxw`](https://rss.ljhboard.cn/news/xhsxw) | 权威综合新闻列表 | 100 |
| 央视新闻 | [`/cctv/china`](https://rss.ljhboard.cn/cctv/china) | 国内新闻频道 | 80 |
| 中国新闻网 | [`/chinanews`](https://rss.ljhboard.cn/chinanews) | 高频滚动新闻 | 50 |
| 澎湃新闻 | [`/thepaper/sidebar/hotNews`](https://rss.ljhboard.cn/thepaper/sidebar/hotNews) | 编辑侧热榜 | 20 |
| 界面新闻 | [`/jiemian/lists/71`](https://rss.ljhboard.cn/jiemian/lists/71) | 中国新闻栏目 | 20 |
| 百度热搜 | [`/baidu/top/realtime`](https://rss.ljhboard.cn/baidu/top/realtime) | 搜索趋势榜 | 51 |

人民网、观察者网和网易新闻也已实测成功，可作为第二批来源；其中网易 24 小时榜单冷请求实测约
23 秒，距离本站 30 秒上游超时较近，因此不进入首批。今日头条虽然本次成功，但官方路由元数据明确
标记 `antiCrawler: true`；微博热搜在当前实例因浏览器运行时缺失返回 503；腾讯新闻只有“作者主页”
路由，没有综合新闻或热榜路由；财新基础列表可用，但全文能力涉及订阅 Cookie。这些都不进入首批。

## 依据与方法

- 官方文档入口：[传统媒体](https://docs.rsshub.app/routes/traditional-media)、[新媒体](https://docs.rsshub.app/routes/new-media)、[社交媒体](https://docs.rsshub.app/routes/social-media)、[其他](https://docs.rsshub.app/routes/other)。具体参数以各路由源码中的 `route` 元数据为准。
- 本地 `D:\code\rss` 当前提交为 `7a622331d1ca613baf4707a8cd6ca16a070aa497`，公开实例错误页也报告 Git Hash `7a622331`。
- 将下列 17 个本地候选路由文件与 RSSHub 官方仓库 `master` 的原始内容按 LF 归一化后逐一比较，内容全部一致，因此下表直接引用官方仓库文件作为事实依据。
- 实测方法：匿名 GET，不附带自定义 Cookie/Token；记录最终状态码、`Content-Type` 和 RSS `<item>` 数。结果只是 2026-09-05 的快照，不代表长期 SLA。

## 候选逐项核对

| 平台 | 路由、参数与类型 | 是否需要秘密 | 源码提取方式 | 稳定性风险与首批判断 |
| --- | --- | --- | --- | --- |
| 人民网 | `/people/:site?/:category?`；默认 `site=www`、默认栏目 `59476`，支持 `?limit=`；首页头条列表，不是热榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/people/index.ts) | 否。处理器不读取配置或凭据。 | 抓频道 HTML，按多个 DOM 选择器取链接，再逐篇抓正文；包含编码识别和同域 meta-refresh 处理。 | 中：依赖多个页面选择器、旧式 HTTP 页面和详情模板。实测成功，但与新华/央视定位重叠，列为第二批。 |
| 新华网 / 新华社 | `/news/xhsxw`，兼容别名 `/news/whxw`，仅有 `?limit=`（默认 100）；新闻列表，不是热榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/news/xhsxw.ts) | 否；官方元数据为 `requireConfig: false`、`requirePuppeteer: false`。 | 从 `xhsxw.htm` 读取 `ul.wz-list` 的数据源 ID，再请求 `ds_{id}.json`，并逐篇补正文。 | 中：依赖页面 data 属性、JSON 文件命名和正文选择器；但接口结构清晰、实测量充足。首批。 |
| 央视新闻 / 央视网 | `/cctv/:category`；可选 `news/china/world/society/law/ent/tech/life/edu` 等；频道列表，不是热榜。[路由](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/cctv/category.ts)、[提取器](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/cctv/utils/news.ts) | 否；`requireConfig: false`、`requirePuppeteer: false`。 | 请求央视栏目 JSONP 列表，再按文章、图集、视频 ID 分别访问央视内容 API。 | 低至中：依赖公开 JSONP/API 与内容 ID 规则，少数未知类型可能只有提示。`china` 首批。 |
| 中国新闻网 | `/chinanews`，支持 `?limit=`（默认 50）；最新滚动列表，不是热榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/chinanews/index.ts) | 否；处理器不读取配置或凭据。 | 解析滚动新闻 HTML，再逐篇抓正文；兼容三种详情页模板。 | 中至高：默认产生 51 次上游请求，且正文模板分支较多。实测成功，首批但应控制刷新频率。 |
| 澎湃新闻 | `/thepaper/sidebar/:sec?`；默认/推荐 `hotNews`，另有 `financialInformationNews`、`morningEveningNews`、`editorHandpicked`；`hotNews` 是明确热榜。[路由](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/thepaper/sidebar.ts)、[详情处理](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/thepaper/utils.tsx) | 否；处理器不读取配置或凭据。 | 从 `contentapi/wwwIndex/rightSidebar` 取榜单，再读取移动详情页 `__NEXT_DATA__`。 | 低至中：依赖未承诺稳定的公开 JSON 字段和 Next.js 页面数据。实测成功，首批。`/thepaper/featured` 也成功，但它是首页头条列表，与热榜重复。 |
| 界面新闻 | `/jiemian/lists/:id`；中国新闻 `71`、综合新闻 `801`，今日热点快报 `1324kb`；栏目/快报列表，不是严格排名榜。[路由](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/jiemian/lists.ts)、[公共提取器](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/jiemian/common.tsx) | 否；处理器不读取配置或凭据。 | 解析栏目 HTML；视页面走 `a.jiemian.com` 加载更多 JSONP 或快讯 API，再逐篇抓正文。 | 中至高：两套列表分支、JSONP 包装和详情 DOM 都可能变化。中国新闻 `71` 实测 20 条并列入首批；`801` 与 `1324kb` 可作替代。 |
| 观察者网 | `/guancha/headline` 为头条列表；`/guancha/:category?` 支持 `redian/gundong/others/story/review/fengwen/all`，其中 `redian` 为热点列表。[头条源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/guancha/headline.ts)、[分类源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/guancha/index.ts) | 否；`requireConfig: false`、`requirePuppeteer: false`。 | 头条走 HTML；热点/滚动走站点 API；两者都逐篇抓详情，部分风闻文章还需二次跳转。 | 中：详情 DOM 和 `_s.shtml` URL 规则较脆弱。`headline`、`redian`、`others` 均成功；内容取向较集中，列为第二批。 |
| 财新 | `/caixin/latest`；基础最新文章列表，非热榜；`?fulltext=true` 才尝试订阅全文。[列表源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/caixin/latest.ts)、[全文鉴权代码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/caixin/utils-fulltext.ts) | 基础列表否；订阅全文需要 `CAIXIN_COOKIE`，因此首批不得启用 `fulltext=true`。 | 从财新滚动 API 取列表，过滤 FM/视频/数据新闻，再抓文章页摘要；全文分支调用鉴权接口。 | 中至高：财经垂直、部分内容付费，全文还依赖用户订阅状态。基础列表成功，但不适合作为首批综合热点。 |
| 腾讯新闻 | 现有 `/qq/news/:uid/:detail?` 只订阅指定作者；`uid` 必填，`detail` 非空时抓全文。没有综合新闻/热榜路由。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/qq/news/user.ts) | 否；`requireConfig: false`、`requirePuppeteer: false`。 | 调作者列表 API；可选逐篇抓 `news.qq.com/rain/a/{id}` 正文。 | 不适配本需求：必须先选定作者，无法代表腾讯新闻综合热点。示例作者路由成功仅证明路由可运行，不建议接入。 |
| 网易新闻 | `/163/news/rank/:category?/:type?/:time?`；默认 `whole/click/day`；类别含 `whole/news/money/tech` 等，类型 `click/follow`，时间 `hour/day/week/month` 有组合限制；明确排行榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/163/news/rank.ts) | 否；`requireConfig: false`、`requirePuppeteer: false`。 | 抓取 GBK 排行页，按表格索引选择榜单，再逐篇访问手机网易正文。 | 中至高：依赖老式表格索引、GBK 编码和移动详情 DOM，且有少数详情失败过滤；冷请求实测约 23 秒，距离本站 30 秒上游超时较近，列为第二批。 |
| 今日头条 | `/toutiao/channel/:category`；热点为 `news_hot`，还支持推荐、科技、财经等；频道流，不是严格排名榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/toutiao/channel.ts) | 不需要用户秘密，但需本地生成 `a_bogus` 请求参数；官方元数据标记 `antiCrawler: true`。 | 调用 PC feed API，并为文章访问移动详情 API补全文。 | 高：签名算法和反爬策略容易变化。当前成功不等于稳定，暂不进入首批。 |
| 百度热搜 | `/baidu/top/:board?`；默认 `realtime`，另有小说、电影、电视剧、汽车、游戏榜；明确热搜榜。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/baidu/top.tsx) | 否；`requireConfig: false`、`requirePuppeteer: false`。 | 抓百度榜单 HTML，从 `#sanRoot` 注释中的 `s-data` JSON 读取卡片。 | 中：强依赖服务端页面中的注释数据结构，但请求少、实测成功。首批。 |
| 微博热搜 | `/weibo/search/hot/:fulltext?`；基础路径返回热搜条目，`fulltext` 补摘要；`pic/fullpic` 控制图片。[源码](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/weibo/search/hot.tsx) | `WEIBO_COOKIES` 标为可选，但路由会尝试 Cookie 流程；官方元数据同时标记 `requirePuppeteer: true`。 | 请求微博移动端 container API；全文模式还会逐个查询话题搜索结果。 | 高：登录/风控、Cookie、浏览器运行时和外链图片限制均会增加运维成本。本实例因缺少 `patchright-core/browsers.json` 返回 503，首批排除。 |

## 公开实例实测记录

| 路由 | HTTP | Content-Type | 条目数 | 结果 / 失败原因 |
| --- | ---: | --- | ---: | --- |
| `/people` | 200 | `application/xml; charset=utf-8` | 30 | 成功，标题“首页头条--人民网” |
| `/news/xhsxw` | 200 | `application/xml; charset=utf-8` | 100 | 成功 |
| `/cctv/china` | 200 | `application/xml; charset=utf-8` | 80 | 成功 |
| `/cctv/news` | 200 | `application/xml; charset=utf-8` | 80 | 成功；综合新闻频道可作为 `china` 的替代 |
| `/chinanews` | 200 | `application/xml; charset=utf-8` | 50 | 成功 |
| `/thepaper/sidebar/hotNews` | 200 | `application/xml; charset=utf-8` | 20 | 成功 |
| `/thepaper/featured` | 200 | `application/xml; charset=utf-8` | 17 | 成功 |
| `/jiemian/lists/71` | 200 | `application/xml; charset=utf-8` | 20 | 成功，中国新闻栏目；首批采用 |
| `/jiemian/lists/801` | 200 | `application/xml; charset=utf-8` | 16 | 成功，综合“新闻”栏目 |
| `/jiemian/lists/1324kb` | 200 | `application/xml; charset=utf-8` | 20 | 成功，“今日热点”快报入口；Feed 标题仍显示“快报” |
| `/guancha/headline` | 200 | `application/xml; charset=utf-8` | 20 | 成功 |
| `/guancha/redian` | 200 | `application/xml; charset=utf-8` | 10 | 成功 |
| `/guancha/others` | 200 | `application/xml; charset=utf-8` | 18 | 成功 |
| `/caixin/latest` | 200 | `application/xml; charset=utf-8` | 19 | 基础列表成功；未测试需 Cookie 的全文模式 |
| `/qq/news/8QMZ2X5a5YUeujw%3D` | 200 | `application/xml; charset=utf-8` | 20 | 官方示例作者成功；不是综合新闻 |
| `/163/news/rank/whole/click/day` | 200 | `application/xml; charset=utf-8` | 88 | 成功 |
| `/toutiao/channel/news_hot` | 200 | `application/xml; charset=utf-8` | 14 | 本次成功，但源码明确标记反爬风险 |
| `/baidu/top/realtime` | 200 | `application/xml; charset=utf-8` | 51 | 成功 |
| `/weibo/search/hot` | 503 | `text/html; charset=UTF-8` | 0 | 当前部署缺少 `patchright-core/browsers.json`；路由依赖浏览器运行时，未进入业务层 |

## 接入建议

首批只存路由路径与展示元数据，不引入任何凭据配置。抓取频率应低于热点源自身刷新节奏，并对中国新闻网、央视、新华这类“列表后逐篇补全文”的路由使用更长缓存或更低轮询频率。实现时应把 5xx、空 Feed、条目骤降视为单来源失败，不能让一个上游拖垮整轮聚合。

第二批按优先级建议：人民网（权威头条补充）→ 网易 24 小时榜（先解决延迟余量）→ 观察者 `redian`
（观点类热点）。今日头条待连续稳定性观测后再启用；微博待实例浏览器运行时修复并确认无需秘密即可
持续工作后再评估；腾讯新闻需先有明确作者选择，财新则只使用不带 `fulltext=true` 的基础列表。
