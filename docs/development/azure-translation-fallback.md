# Azure 优先翻译与本地回退

## Background

用户选择 Azure Translator F0 为英文文章和 AI 事件翻译首选，现有 MTran 为回退。复用 [免费接口调研](../research/free-translation-api.md)、现有文章翻译和 Redis 缓存设计；用户已确认供应商与回退策略，不再重复设计确认。

## Scope

- Azure Text Translation v3 英译简体中文，保留 HTML、双语显示、Hono RPC 和服务端内容读取。
- 未配置密钥、超长正文或 Azure 超时、限流、配额、鉴权、响应异常时回退本地。
- Azure 请求失败后，当前进程 60 秒内跳过 Azure；本地失败仍向上返回失败，不写入缓存。
- 配置 Azure 后，启动跳过本地模型预热；第一次回退按需加载模型，复用持久卷。

## Out of scope

Azure 资源创建、生产凭据配置、生产部署、多语言、分段翻译、数据库与采集/Cron 变更。

## Acceptance criteria

1. 正常 Azure 翻译不调用 MTran；文章和事件共用策略。
2. Azure 请求含服务端密钥头、可选 region 头、20 秒超时；正文使用 HTML 模式，输出继续清洗。
3. 失败、无密钥及单次超过 50,000 字符限制时可用本地回退；失败冷却后可恢复 Azure。
4. 7 天结果缓存和两任务并发限制保持，缓存版本区分新旧策略；缓存命中不调用任一引擎。
5. Azure 模式启动不导入或预热 MTran；未配置 Azure 时保持既有启动准备。
6. 覆盖云端成功、回退、冷却、HTML、缓存及启动分支的测试、类型与格式检查通过；推送分支由用户创建和合并 PR。

## Feasibility

可行。Next 服务端原生 fetch 可调用正式 REST API，无需 SDK；已阅读安装版 Next 的环境变量指南。复用本地动态导入、HTML 白名单清洗和 Redis 缓存，无 schema 变更或视觉布局变更。当前分支从已 fetch 的 `origin/master` `3630fcd` 创建；未提交的调研文档来自同一用户任务，随本次提交。仓库没有 CONTEXT.md。

Azure [认证文档](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication)要求 regional resource 的 region 头；global resource 可省略。采用固定官方全球 Text Translation endpoint，避免引入自定义 endpoint 配置。[Translate 文档](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate)支持完整 HTML 元素；正文临时包裹 div，响应移除包裹后再清洗。[请求限制](https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits)为每次 50,000 字符，超长直接本地回退，避免为少量长文引入 HTML 拆分逻辑。使用 UTF-16 length 保守判断限制。

## Implementation

操作步骤见 [Azure Translator F0 配置指南](../azure-translator-setup.md)，包括门户创建资源、服务器实际配置路径、容器重新创建、直接接口验证、本地配置与排查。

- `apps/web/lib/azure-translation.ts` 使用原生 fetch、固定官方全球 endpoint、20 秒超时，校验目标语言、非空译文及 HTML 包裹。失败仅输出固定日志，不输出上游正文、错误对象或凭据；60 秒进程内冷却后恢复尝试。
- `article-translation.ts` 的共享翻译函数优先 Azure，返回不可用时才调用动态加载的 MTran；文章和事件复用同一策略。更新缓存版本为 `azure-v3-mtran-4.0.33-en-zh-v1`，保留缓存、去重、两任务并发限制和清洗。
- 准备脚本在配置 Azure 密钥时跳过 MTran 动态导入及预热，未配置时继续下载/校验模型并关闭引擎。要主动预热回退模型，可只在准备命令进程中清空 `AZURE_TRANSLATOR_KEY` 再执行 `translation:prepare`；不需要修改持久配置。
- 服务器配置 `AZURE_TRANSLATOR_KEY` 和 regional resource 的 `AZURE_TRANSLATOR_REGION`；均不使用 NEXT_PUBLIC_ 前缀。F0 是 Azure 资源的计费层级，应用不能将已创建的收费资源转换为 F0。开发和部署示例、README 已更新。
- 复用已确认的文章/事件三态阅读界面；只把两处超时提示改为“翻译超时”，无新界面、布局或组件库变更。
- 用户本轮明确选择本地自动回退，覆盖调研阶段为最大程度释放资源提出的“不默认回退”建议。

## Verification

- 定向 Vitest：Azure、文章/事件、Hono、Redis、准备脚本 5 文件 51 项通过；Web 全量 73 文件 291 项通过。
- `node node_modules/typescript/bin/tsc --noEmit`（Web）：通过。
- 修改范围 Biome、暂存文件的同等 pre-commit Biome 检查和 `git diff --check`：通过。pnpm 包装器触发依赖同步后在 registry 请求停滞，终止该命令并直接调用已安装的相同 Biome/Vitest/TypeScript 工具完成检查；未修改依赖声明或锁文件。提交时仅跳过会再次调用此包装器的钩子，已执行其相同的 `check --write --staged --no-errors-on-unmatched` 检查。
- Bun 真实启动准备：模拟配置 Azure 时跳过模型准备、退出 0；未配置 Azure 时真实 MTran 下载/校验、短句翻译及关闭完成、退出 0。
- Next 生产构建：编译和 TypeScript 阶段通过；预渲染 `/news/xinhua`、`/ai/openai` 请求 Supabase 时 `ECONNRESET`，三次内置重试后退出 1，未声称完整构建通过。没有修改与本任务无关的数据读取逻辑；CI 需完成真实网络环境的完整构建和 Linux 容器验证。
- 本地环境未配置 Azure 密钥；真实 F0 请求、质量、配额及生产连通性尚未验证。生产配置密钥/区域并重启后，应按真实文章验证 Azure 译文、HTML 结构及回退；此项未执行。

## Review and roadmap

完成需求和规范自审：供应商边界、响应验证、密钥服务端范围、失败日志、冷却、缓存版本、无密钥兼容、启动准备及正文清洗已检查，无代码阻塞项。超长正文直接走本地、回退译文缓存 7 天及固定公网 endpoint 是本次有意选择的简单实现，限制见 Risks。没有证据支持额外代码后续项，不创建空 roadmap。真实 Azure/CI 验证仍是发布验收要求。

## Risks

- 超额后会恢复本地 CPU/内存负载，沿用两任务并发限制；首次回退可能下载模型。
- 60 秒冷却只作用于当前进程；配额耗尽后每分钟仍可能探测一次。没有引入跨实例熔断系统。
- 7 天缓存会复用本地回退译文，Azure 恢复不会立即重译；正文不同片段可能分别来自两个引擎。
- 固定全球 endpoint 适用于 Azure 公有云 global/regional 资源，不覆盖世纪互联或专用 VNet endpoint。
- 真实供应商及 Linux 容器验证需在凭据和部署环境中完成；不能用 mock 测试声称线上已生效。
