# 精简测试套件与修复 lint

## Background

用户要求删减大部分测试，保留关键业务覆盖，并修复 lint 后准备 PR。沿用已确认的精简方向，无新增架构或视觉决策。

## Scope

- 删除静态展示、样式、固定文案和重复来源测试，压缩重复参数组合
- 保留采集、认证、内容安全、缓存一致性、数据库与关键交互回归
- 为两个 SVG 添加描述性标题，将文章来源判断改为等价可选链

## Out of scope

不改变采集、缓存、数据库与页面功能，不修改 CI 门禁，不部署或操作生产数据。

## Acceptance criteria

- Vitest 用例从 634 项减至 313 项，文件从 132 个减至 57 个
- 全仓 lint 无错误或警告，类型检查与剩余测试通过
- 原有 16 项 Redis/PostgreSQL 集成测试继续保留，不以 skip 或配置排除替代删除
- 推送可审阅分支，由用户按仓库规则创建并合并 PR

## Feasibility

可行。测试为独立 Vitest 文件；删除测试不改变产品运行时依赖。主要风险是缩小回归覆盖，故保留故障防护、权限、持久化和缓存竞态测试。SVG 标题不改变图形，可选链与原判断等价。

## Implementation

- 删除 75 个测试文件，精简剩余文件的重复场景并清理新增的未使用导入
- 保留全部 16 项依赖测试服务的集成测试，以及 SQL 和部署脚本检查
- 修复 `article-cover-default.svg`、`source-icons/geekpark.svg` 的可访问性错误，以及 `article-route.ts` 的可选链警告
- 当前分支继承 `feat/fix-feed-upstreams` 的已部署修复；远端 master 尚缺少该分支最后 3 个提交，因此本 PR 以 `feat/fix-feed-upstreams` 为 base。上游修复合入 master 后可将 base 改为 master

## Verification

- 精简前：634 项，其中 618 项通过、16 项因本地未配置测试服务跳过
- 精简后：313 项，其中 297 项通过、相同的 16 项跳过
- `pnpm check-types`：通过
- `pnpm lint`：331 个文件检查通过，无错误或警告
- `git diff --check`：通过
- 差异核对：无新增 skip/todo、无测试配置排除；服务集成测试、SQL 检查、部署脚本和 CI 配置均未修改

## Risks

静态页面、样式和部分次要边界不再有自动回归覆盖。16 项服务集成测试仍须由配置了 Redis/PostgreSQL 的 CI 验证；本地跳过不代表通过。

## Review

最终差异已按仓库规范与验收条件复查，无阻塞项。仅三个产品文件因 lint 修改，行为判断等价，SVG 图形未变。无接受的范围外跟进，不创建空 roadmap。

## Delivery

Head：`feat/simplify-test-suite`；base：`feat/fix-feed-upstreams`。用户按仓库规则创建并合并 PR；此前上游修复合入 master 后，可将本 PR 的 base 调整为 master。未执行部署。
