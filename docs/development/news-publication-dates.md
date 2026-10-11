# 新闻发布时间补齐与零点兜底

## Background

用户要求先修复新闻 RSSHub 日期，再将非法或缺失日期按抓取当天00:00处理，GitHub排名和Skills不改。采用北京时间 Asia/Shanghai，与现有界面日期格式一致。沿用已验证的真实原页提取方案，无UI改动和新依赖。

## Scope

- news分区六来源保留有效pubDate/published；无效或缺失则用本次采集当天的北京时间00:00，数据库UTC表示为前一天16:00。
- news不把Atom updated当作发布时间；其他分区保持现有行为。
- 新增部署后回填迁移：新闻未人工锁定、published_at为空的文章，取最后采集日北京时间00:00；同步hot_items，已有有效时间不覆盖。
- RSSHub另一个仓库修复中新网正文、视频、图片日期，分支codex/fix-news-publication-dates。

## Out of scope

不处理虎扑、财经日期、Github或Skills；不改首页排序和来源限额，不批量重抓历史原文，不修改Cron配置。缺日期兜底是网站接受的排序时间，不能视为补得了上游真实发布时间。

## Acceptance criteria

北京时间跨日正确；有效日期原样保留；六个新闻来源均有兜底；当天重复采集兜底相同；updated-only新闻不能绕过兜底；GitHub/Skills日期仍空；历史迁移不覆盖有效日期和人工锁定文章。

## Feasibility

可行。ingestSignal统一接收本次采集now，RSS解析将非法日期转为null；使用UTC毫秒偏移计算中国标准时间零点，不依赖运行主机时区。Feed解析选项默认兼容原逻辑，新闻明确禁用updated回退。现有数据表允许空日期，无schema变更。

RSSHub在独立干净工作区修改，以免混入知乎未完成工作。rss-site复用干净工作区，新分支feat/news-publication-dates基于已合并PR36后的origin/master c780969。原工作区未提交图片解析改动保持原样。

## Implementation

采集端在limit之后、写库之前只对news空日期补零点，startedAt/finishedAt继续保留原采集时刻。HTML展示已使用Asia/Shanghai，无需UI调整。

迁移20261012064000必须在API新版本上线后执行：用last_seen_at确定历史记录的最后抓取日，不猜上游发布时间。后续再出现在Feed里的条目如有真实日期会正常更新；不在Feed里的历史文章保留用户指定兜底。迁移保护editorial_locked文章。

## Verification

- 新增跨日用例在原实现失败（2项）；修改后API100项全部通过，类型检查通过，改动文件Biome通过。
- 六来源同日重复采集、Atom updated-only新闻、GitHub和Skills不兜底均有回归验证。
- API wrangler deploy --dry-run成功（仅打包验证，未部署）。
- 云库迁移在实际事务内执行并回滚：6929条新闻缺失时间补齐，未锁定缺失残余0，榜单缺失不同步0；百度示例published_at为2026-10-11T16:00:00Z，对应北京时间10月12日00:00。未应用版本或写入永久数据。
- RSSHub真实路由修复前30条仅3条日期有效，修复后30/30有效；正文数量前后均29，未混入其他正文修复。详情见另仓库docs/development/news-publication-dates.md。

## Review

标准审查与规格审查完成，无阻塞发现。没有新平台/Cron，所以不触发新来源准入门。拒绝把抓取时间写进RSSHub作为上游发布时间；用户接受的零点排序兜底在本站落实。未合并、未部署、未应用迁移，不宣称线上已修复。

## Risks

兜底没有日期来源标志，不能被当作上游时间准确度保证；跨日再次采集会推进缺日期条目的兜底日，这是按本次抓取日的用户规则。零点降低这些条目抢占“刚刚发布”的机会，但真实高频来源仍可独占首页。

## Delivery and follow-up

需要用户创建并合并两仓库PR。顺序：RSSHub修复部署并验Feed；部署rss-site API；执行迁移20261012064000；正常采集及缓存失效后复验云库和首页。

接受的后续工作：部署后的实际数据验收与首页来源均衡。见[路线图](../roadmaps/news-publication-dates.md)。
