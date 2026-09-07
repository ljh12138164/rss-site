# 正文增强路线图

## Context
关联实施：[站内阅读与正文保存](../development/article-reader.md)。本轮首先保留 Feed 已提供的正文；云迁移、写入验证和阅读页验收仍属于当前交付前置条件，不列为可延期优化。

## Next
### 对仅提供摘要的来源验证 RSSHub 全文增强
- Value：让更多站内详情有可读正文。
- Evidence：[RSSHub 研究](../development/rsshub-article-content-research.md)确认 mode=fulltext 是尽力提取，失败返回原摘要；不能全站盲目开启。
- Dependencies：先完成本轮迁移、真实采集及阅读页验收；逐源抽查现有 Feed，再比较全文增强结果，确认内容范围和上游访问限制。
- Completion signal：每个启用来源有原文对照、正文覆盖率、耗时、失败降级证据；摘要回退不能覆盖已保存的可靠正文，生产来源门禁通过后才修改运行配置。
