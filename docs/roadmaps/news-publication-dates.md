# 新闻日期后续路线图

实现记录：[新闻发布时间补齐与零点兜底](../development/news-publication-dates.md)。

## Now

### 按顺序发布并验证新闻日期

- Value: 修复正式采集并让旧缺失日期更新。
- Evidence: API100项、RSSHub30条真实路由及云库回滚验证通过，尚未上线。
- Dependencies: 两仓库用户合并PR；RSSHub部署后验证有效日期；API部署后才执行回填迁移。
- Completion signal: 中新网Feed不含Invalid Date，news缺失日期进入当天北京时间00:00，真实日期保持，榜单和文章一致，首页缓存更新。

## Next

### 依据正确日期评估来源均衡

- Value: 避免高频来源长期占满首页速览。
- Evidence: 已审计的虎扑前30条独占来自错误热帖时间；新闻修复并不修复这个社交源，也不改变按时间排序。
- Dependencies: 另行确认社交源修复及首页来源限额规则，当前用户只要求新闻日期。
- Completion signal: 日期核验后，基于实际首页来源分布决定是否增加每来源限额，不伪造发布时间改善版面。
