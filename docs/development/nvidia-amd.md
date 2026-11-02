# NVIDIA 与 AMD 中文来源接入

## 范围

科技分区新增 NVIDIA、AMD 两个平台，各自汇总中文文章，不按新闻站、博客站拆分入口。

| 平台 | Feed | 用途 |
| --- | --- | --- |
| NVIDIA | `https://rss.ljhboard.cn/nvidia/developer/zh-CN?limit=20` | 中文技术博客，经 RSSHub 补全文 |
| NVIDIA | `https://blogs.nvidia.cn/feed/` | 中文企业博客，官方 Feed 已含全文 |
| AMD | `https://rss.ljhboard.cn/amd/newsroom/all/zh-CN?limit=20` | 中文新闻、博客与新闻稿，经 RSSHub 补全文 |

只订阅中文版本，不加入英文新闻中心、英文开发者博客及英文投资者新闻稿。AMD 中文新闻稿已在中文汇总源中，不重复请求子分类。

## 采集行为

- 同一平台并行读取配置的 Feed，按原文 URL 去重；重复文章保留正文较长的一份
- 合并后按发布时间倒序排列，最多保留 30 篇，重新生成连续排名
- 任一 Feed 请求失败、解析失败或为空时，记录失败，保留上次成功的数据
- 单 Feed 来源继续保留原有排序；已有来源配置与刷新周期不变
- 页面入口、归档、详情及来源图标沿用共享来源注册表

## 验证记录

2026-11-02，从最新 `origin/master`（`e18ec4f`）创建 `feat/nvidia-amd-sources`。

匿名实测：NVIDIA 技术博客 20 篇、企业博客 18 篇，合并截取后 30 篇；AMD 16 篇。所选 Feed 均能读取正文与发布时间。

检查通过：Signals 8 项、API 163 项、Web 360 项测试，全仓类型检查、变更文件 Biome 检查、Worker dry-run 与 Web 生产构建。Web 构建中的第一财经查询首次超时，自动重试后构建成功。

已部署 API Worker `rss-site-api`，版本 `a8ba2b9b-d0c0-44ca-8db5-c6615d3090dd`，保留线上变量与机密。云端已应用 `20261102133210_add_nvidia_amd_sources.sql`，只扩展四个来源约束。

使用生产 `POST /cron/signals/:source` 手动采集：

| 平台 | HTTP | 数量 | Batch ID | 云端成功时间（UTC） |
| --- | --- | --- | --- | --- |
| NVIDIA | 200 | 30 | `43e7cfa1-1e4c-48cf-9ca8-928187134c80` | 2026-11-02 13:33:26.358 |
| AMD | 200 | 16 | `ab2df3de-123a-41a4-bf9b-938ca9f91e6f` | 2026-11-02 13:33:52.897 |

云端 `ingestion_runs` 均为 `succeeded`，`source_status` 指向对应批次，`hot_items` 与正文归档均已写入。两个来源均属于 `technology`，排名分别为 1–30、1–16；重复链接、缺失日期、缺失正文和无效标题或链接均为 0。最短正文分别为 1844、2006 字符。

抽查：NVIDIA 首篇为“两台桌面设备，承载一个科室的‘数字员工编制’”，发布时间 2026-11-02；AMD 首篇为“AMD 为嵌入式设计与开发全周期注入 Agentic AI 强大能力”，发布时间 2026-10-23。AMD 当前 Feed 最新日期较早，未以采集时间替换。

入库验证后才启用两个 Supabase Cron，均为 active，命令通过 Vault 读取 `signal_ingest_base_url` 与 `signal_cron_secret`：

| 任务 | Cron（UTC） | 北京时间 |
| --- | --- | --- |
| `signal-ingest-nvidia` | `40 4,10,16,22 * * *` | 每日 00:40、06:40、12:40、18:40 |
| `signal-ingest-amd` | `50 4,10,16,22 * * *` | 每日 00:50、06:50、12:50、18:50 |

只新增这两个任务，未运行会重新配置所有来源的 `setup:cron`。

## 待合入后的检查

生产采集的 `publication` 为 `failed`。使用 Worker 实际生产凭据复核，线上 Web 的 `/api/revalidate` 对这两个新来源返回 HTTP 400（`Invalid section or source`）；当前 Web 尚未部署新注册表。

由用户创建并合并 `feat/nvidia-amd-sources` → `master` 的 PR，现有 CI 会部署 Web。部署后检查 `/technology` 及两个平台的列表、详情页，再复测刷新接口。合入前不能将页面上线和刷新通知标记为完成。

Supabase 安全检查前后无新增告警；现有 Auth 泄漏密码保护未启用，见 [Supabase 密码安全说明](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。本次未修改 Auth 配置。
