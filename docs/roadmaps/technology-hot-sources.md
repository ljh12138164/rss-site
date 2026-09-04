# 科技多来源热点 roadmap

## Context

Related development document: [科技多来源热点与 React Aria 迁移](../development/technology-hot-sources.md)

## Now

当前 PR 无可安全后移的阻塞项。

## Next

### 建立来源契约防漂移检查

- Value: 防止 Web 路由、API RSSHub 注册表和数据库来源白名单在后续新增平台时不一致。
- Evidence: 本期同一组六个来源需要在两个 TypeScript 边界与一条 SQL 迁移中表达，审查确认存在维护漂移风险。
- Dependencies: 先完成本 PR 的六来源上线；方案不得让浏览器依赖服务端模块或让迁移读取运行时代码。
- Completion signal: CI 能在任一来源 ID、slug 或白名单不一致时失败，并有一条文档化的新增来源流程。

## Later

### 按真实运行质量调整来源采集节奏

- Value: 减少慢源和上游限流对新鲜度的影响，同时避免无依据地提高请求频率。
- Evidence: 上线前公开 RSS 验证显示来源响应时间与条目数量不同，当前统一采用约五小时窗口和错峰触发。
- Dependencies: 至少积累两周 `ingestion_runs` 成功/失败记录，并补充不含密钥或正文的采集耗时指标。
- Completion signal: 每个来源都有可观察的成功率与延迟基线，并用数据决定维持或调整独立 Cron 周期。
