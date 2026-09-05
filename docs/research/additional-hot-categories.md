# 后续热点分类与 RSSHub 来源调研

> 调研时间：2026-09-05 16:28（Asia/Shanghai）
> 范围：RSSHub 官方仓库 `master`（`bc8757ee58559c3e0b695e77a2cf8dec0ce956a8`）与自建实例
> `https://rss.ljhboard.cn` 的匿名只读探测。未携带 Cookie、Token 或账号凭据，未写入 Supabase，也未配置 Cron。

## 结论

建议下一批优先实现 **财经**，第二优先实现 **游戏**。体育、影视文化、科学研究和生活消费都有可用来源，
但分别存在来源数量不足、缺少发布时间或“热门/最新”语义不一致的问题，应在实现前先确定产品呈现方式。
汽车类当前成功来源太少，暂不建议单独建分区。

本次共探测 41 条候选路由，29 条返回 HTTP 200 和非空 RSS。结果是当前部署在本次时点的快照，不代表
上游长期 SLA。

| 优先级 | 分类 | 匿名成功率 | 数据特征 | 判断 |
| ---: | --- | ---: | --- | --- |
| 1 | 财经 | 7/7 | 108 条全部带时间；热榜、头条和实时快讯语义明确 | 可直接进入实现设计 |
| 2 | 游戏 | 7/9 | 核心四家资讯共 80 条，全部带时间，78 条有图；另有 Steam 热销榜 | 可做，但需保留各来源榜单语义 |
| 3 | 体育 | 2/3 | 119 条全部带时间，118 条有图 | 数据质量好，但目前只有两个稳定综合平台 |
| 4 | 影视文化 | 5/6 | 77 条全部有图，但都不带发布时间 | 适合“榜单快照”，不适合新闻时间线 |
| 5 | 科学研究 | 4/9 | 68 条全部带时间；覆盖趋势论文、期刊和科普 | 可做“科学与研究”，不能统一宣称为热榜 |
| 6 | 生活消费 | 3/4 | 63 条、63 张图，仅 25 条带时间 | 内容混杂，需先收窄定位 |
| 暂缓 | 汽车 | 1/3 | 仅中国汽车工业协会 12 条成功 | 不足以组成独立分区 |

## 推荐首批：财经

以下 6 个不同平台均通过匿名实测，条目标题、原文 URL 和发布时间完整，且不需要浏览器运行时或秘密。
其中真正的排名榜与编辑/实时流会在 UI 中保留原始名称，不构造跨平台综合名次。

| 来源 | 路由 | 类型 | 条目 | 时间 | 图片 |
| --- | --- | --- | ---: | ---: | ---: |
| 华尔街见闻 | [`/wallstreetcn/hot/day`](https://rss.ljhboard.cn/wallstreetcn/hot/day) | 当日最热文章 | 10 | 10 | 8 |
| 财联社 | [`/cls/hot?limit=20`](https://rss.ljhboard.cn/cls/hot?limit=20) | 热门文章排行榜 | 13 | 13 | 13 |
| 金十数据 | [`/jin10/important`](https://rss.ljhboard.cn/jin10/important) | 重要市场快讯 | 5 | 5 | 0 |
| 第一财经 | [`/yicai/headline`](https://rss.ljhboard.cn/yicai/headline) | 编辑头条 | 30 | 30 | 30 |
| 证券时报 | [`/stcn/article/rank/yw`](https://rss.ljhboard.cn/stcn/article/rank/yw) | 要闻热榜 | 10 | 10 | 3 |
| 同花顺财经 | [`/10jqka/realtimenews`](https://rss.ljhboard.cn/10jqka/realtimenews) | 7×24 小时要闻 | 20 | 20 | 0 |

财联社电报 [`/cls/telegraph`](https://rss.ljhboard.cn/cls/telegraph) 也成功返回 20 条并全部带时间，但与财联社
热榜来自同一平台，建议作为替代路线，不占首批六个平台名额。

源码依据：[华尔街见闻热榜](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/wallstreetcn/hot.ts)、
[财联社热榜](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/cls/hot.ts)、
[金十快讯](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/jin10/index.ts)、
[第一财经头条](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/yicai/headline.ts)、
[证券时报热榜](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/stcn/rank.ts)、
[同花顺实时要闻](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/10jqka/realtimenews.ts)。

## 第二批候选：游戏

游戏资讯的核心四路质量很整齐，可再用 indienova 和 Steam 补足六路。Steam 是热销榜而不是新闻，缺少
发布时间；页面必须把它标成榜单快照，不能让其参与新闻时间线。

| 来源 | 路由 | 类型 | 条目 | 时间 | 图片 |
| --- | --- | --- | ---: | ---: | ---: |
| 3DM | [`/3dmgame/news/game`](https://rss.ljhboard.cn/3dmgame/news/game) | 游戏新闻 | 20 | 20 | 20 |
| 机核 | [`/gcores/news?limit=20`](https://rss.ljhboard.cn/gcores/news?limit=20) | 游戏资讯 | 20 | 20 | 19 |
| 游民星空 | [`/gamersky/news`](https://rss.ljhboard.cn/gamersky/news) | 今日推荐 | 20 | 20 | 20 |
| 游侠网 | [`/ali213/news/new`](https://rss.ljhboard.cn/ali213/news/new) | 最新资讯 | 20 | 20 | 19 |
| indienova | [`/indienova/article`](https://rss.ljhboard.cn/indienova/article) | 独立游戏文章 | 12 | 7 | 12 |
| Steam | [`/steam/search/filter=topsellers`](https://rss.ljhboard.cn/steam/search/filter=topsellers) | 商店热销榜 | 50 | 0 | 当前解析器 0 |

Epic 免费游戏路由 `/epicgames/freegames/zh-CN/CN` 成功但当时仅 1 条，可作为补充信号，不适合作为分区
主来源。任天堂中国资讯请求超过 30 秒，盒心光环返回 503，均不进入首批。

源码依据：[3DM](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/3dmgame/news-center.ts)、
[机核](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/gcores/news.ts)、
[游民星空](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/gamersky/news.ts)、
[游侠网](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/ali213/news.ts)、
[Steam 搜索](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/steam/search.ts)。

## 条件候选

### 体育

- 懂球帝 `/dongqiudi/top_news/1`：19 条，19 条带时间，18 张图。
- 直播吧 `/zhibo8/more`：100 条，全部带时间和图片；生产接入时应通过 `?limit=` 限制为 20–30 条，
  避免逐篇详情请求过多。
- 新浪体育 `/sina/sports`：503。

两条成功路线质量高，但平台多样性不足。可先做两路 MVP，或继续寻找至少两个不同平台后再建完整分区。

源码依据：[懂球帝头条](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/dongqiudi/top-news.ts)、
[直播吧滚动新闻](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/zhibo8/more.ts)。

### 影视文化

- 豆瓣一周口碑榜 10 条、热门图书 20 条、实时热门榜单 20 条。
- Bangumi 动画关注榜 15 条。
- 猫眼正在热映 12 条；猫眼实时票房 `/maoyan/box` 返回 503。

5 条成功路线都有封面，但全部没有 RSS 发布时间。适合展示“当前榜单”和排名，不适合复用 AI 新闻时间线；
如果实现，需要把采集时间明确显示为“榜单更新时间”，不能伪装成内容发布时间。

源码依据：[豆瓣一周口碑榜](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/douban/other/weekly-best.tsx)、
[豆瓣热门图书](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/douban/book/rank.ts)、
[Bangumi 关注榜](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/bangumi.tv/other/followrank.ts)、
[猫眼正在热映](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/maoyan/hot.ts)。

### 科学与研究

- PubMed Trending：10 条，全部带时间，是真正的趋势论文列表。
- 果壳科学人：10 条，全部带时间和图片，是科普资讯流。
- Cell 当前期刊：23 条，全部带时间，是期刊当期内容。
- 中科院上海微系统所科研进展：25 条，全部带时间，是机构进展。

Nature、NASA 中文、国家地理和 PNAS 当前均返回 503，科学网精选博客超过 30 秒。成功路线的数据质量
可以支持“科学与研究”分区，但只有 PubMed 属于明确趋势榜，其余是最新发布，必须在名称与排序中保留区别。

源码依据：[PubMed Trending](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/pubmed/trending.tsx)、
[果壳科学人](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/guokr/scientific.ts)、
[Cell 当前期刊](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/cell/cell.ts)、
[中科院科研进展](https://github.com/DIYgod/RSSHub/blob/master/lib/routes/cas/sim/kyjz.ts)。

### 生活消费

- 下厨房 24 小时最佳：18 条，全部有图但无发布时间。
- 豆瓣北京热门活动：20 条，全部有图但无发布时间；路由还依赖城市 ID，不适合作为全国统一来源。
- 消费者报道要闻：25 条，全部带时间和图片。
- 美食天下菜谱当前返回 503；什么值得买排行榜需要 `SMZDM_COOKIE`，不符合匿名来源门禁，未请求。

这个集合把菜谱、同城活动和消费报道混在一起，产品定位过宽。建议先不实现，后续可拆成“吃喝玩乐”或
“消费决策”再分别补足来源。

## 当前不建议：汽车

中国汽车工业协会 `/caam/1` 成功返回 12 条并带时间；汽车工业统计 `/auto-stats` 和乘联会
`/cpcaauto/news/news` 均返回 503。当前只有一个稳定来源，且它属于行业资讯而非大众汽车热点，因此暂缓。

## 失败与边界

| 结果 | 路由 |
| --- | --- |
| HTTP 503 | `/maoyan/box`、`/sina/sports`、`/nature/news`、`/nasa/apod-cn`、`/nationalgeographic/latest-stories`、`/pnas/latest`、`/meishichina/recipe`、`/xboxfan/news`、`/auto-stats`、`/cpcaauto/news/news` |
| 超过 30 秒 | `/sciencenet/blog`、`/nintendo/news/china` |
| 需要秘密，未探测 | `/smzdm/ranking/:rank_type/:rank_id/:hour` 需要 `SMZDM_COOKIE` |

失败路线不能因为源码存在就进入来源注册表；需要在 RSSHub 部署修复后重新匿名探测。缺少发布时间的榜单
可以存储，但必须以采集批次时间表达“观测时点”，不能生成或猜测内容发布时间。

## 后续实施门禁

用户确认分类后再进入实现。每个选中来源仍需逐项执行仓库生产门禁：匿名探测真实上游；完成 API/RSSHub
部署；应用版本化迁移到云端 Supabase；手动调用生产 `POST /cron/signals/:source`；查询云端批次、
`source_status` 和 `hot_items` 字段质量；全部通过后才加入 Supabase Cron，并确认任务 active 且使用 Vault
秘密。不得以本次 RSSHub 只读探测替代云端写入验证。
