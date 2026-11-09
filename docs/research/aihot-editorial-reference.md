# AIHOT 热点指数与日报排序参考

研究日期：2026-11-09。用户目标为“根据热点指数排序新闻”，随后通过截图明确主要替换 `/latest`「全部」页的“今日速览”；当前实施建议见 [热点排行方案](home-hot-ranking-plan.md)，不改日报。下文日报部分作为与 AIHOT 的机制对照保留。通过 `git ls-remote` 核对 AIHOT 默认分支 `main` 的当前提交为 [`ad3e934d376e4399ce350d981b4b5eb7a61f860e`](https://github.com/KKKKhazix/AIHOT/tree/ad3e934d376e4399ce350d981b4b5eb7a61f860e)，以下链接固定到该提交。GitHub API 本次返回 403，使用公开 Git 引用及固定提交的原始源码核查，未克隆项目。

## 1. 核实结果：热点指数由代码计算

AIHOT 的热榜按**事件**计热度。在统计时点 `T` 的前 48 小时内，每个独立参与方只保留最新一条源时间 `tᵢ`，计算：

```text
H(event, T) = Σᵢ 0.5 ^ ((T - tᵢ) / 24小时)
公开指数 = round(H × 100) / 10
```

即公开指数使用原始热度的 10 倍尺度、保留一位小数。没有除以全部来源数，也没有按阅读量、点赞量、厂商身份或模型编辑分加权。48 小时为硬窗口，24 小时为半衰期。可由代码推出：一个刚报道的独立参与方贡献约 10.0；24 小时前为 5.0；同一参与方的十篇报道不会变成十份贡献。源时间优先取发布时间，无发布时间时回退发现时间。[窗口与公式，hot.ts L57–61、L139–181](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/hot.ts#L57-L181)，[信号时间赋值，group.ts L295–300](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/group.ts#L295-L300)。

独立参与方不简单等于 RSS 源：DEV/HN 按作者识别；否则优先运营矩阵组、同一所有者，再回退来源 ID。撤回、隔离或强制独立的材料不参与。热榜还要求至少两个参与方且至少一个属于编辑来源，按未舍入热度降序，同分看最新时间，最多十件。涨跌与六小时前的可比来源群体比较，避免新增来源或采集落后被误读为热度变化。[身份与过滤，hot.ts L106–130](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/hot.ts#L106-L130)，[入榜与排序 L183–189](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/hot.ts#L183-L189)，[趋势比较 L218–239](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/hot.ts#L218-L239)。

## 2. 必须区分：AIHOT 的日报不是直接按这个指数排序

它的日报排序是另一套编辑重要性计算：最高入选稿分数，加 `5 × log₂(1 + 当日独立参与方数)`，有一手动作再加 5，旧事件跟进减 6。主文最多十二件、每代表来源最多两件，之后最多十件快讯；近期已报事实排除，跟进另设资格。[importance，edition.ts L326–334](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/reports/edition.ts#L326-L334)，[编排 L415–453](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/reports/edition.ts#L415-L453)。

每日成刊无需再调模型：使用已准备好的事件摘要，第一件作头条，空栏目被过滤。正文少时，今日看点可从未入正文但达到最低编辑分的报道中补充，这些 `picks` 不计入报头事件数；因此“一件大事”与“三个额外看点”可以同时出现。已判断且无新事件可以出安静刊；没有任何材料经过判断则视为上游失败，不能伪装成平静的一天。[composeDaily，compose.ts L83–123](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/reports/compose.ts#L83-L123)，[看点补位，edition.ts L220–245](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/reports/edition.ts#L220-L245)。

## 3. 可借鉴的编辑前提

- **先确认是否同一事件，再统计参与方。** AIHOT 区分同次发生、直接后续、无关事件和多主题汇总；同公司或同产品不是自动合并条件。其现有架构使用候选召回、模型关系判断及必要复核，不是标题相似就合并。[关系定义，relate.ts L1–9](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/relate.ts#L1-L9)，[归组链路，group.ts L1–18](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/packages/backend/src/events/group.ts#L1-L18)。
- **编辑评分不等于热度。** 评分判断信息价值，聚簇后的独立传播面才决定热度；两次评分及来源门槛只用于精选资格，不应把模型的主观分命名为热点指数。[精选流程，docs/selection.md L3–19](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/docs/selection.md#L3-L19)。
- **摘要先说清主体、动作和结果。** 事件综述面向第一次了解事件的读者，可补必要背景，但不写报道篇数来代替事实，不补造影响；限制条件必须与具体主张绑定。[事件写作提示词](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/industry/prompts/story-digest.md#L1-L12)。

## 4. 本站缺口与建议方案（建议，不是已实现）

本站当前日报候选在 SQL 中先按时间取每来源最多四篇、每分区八篇、总计四十八篇；随后清洗、去重和字节预算还会淘汰材料。这属于时间采样，不能保证覆盖最热事件。来源引用最多三篇，属于展示证据上限，也不能当成参与方统计上限。[候选查询](/D:/code/rss-site/apps/web/lib/daily-repository.ts:77)，[材料冻结](/D:/code/ai-base/apps/agent-service/src/daily-report/materials.ts:43)，[引用约束](/D:/code/rss-site/shared/daily-report.ts:131)。

建议最小落地顺序：

1. **保留本站前一自然日覆盖范围，冻结统计时点。** 取 `T = windowEnd`，热度证据读取 `(T−48h,T]`；任务重试复用同一统计结果，不能按实际重试时刻重算。入刊还应要求覆盖日有新事实，避免前天热闻持续霸榜。以上是本站方案，AIHOT 自身日报窗口默认为前日 08:00 至当日 08:00。
2. **先形成有界事件短名单。** 在有界标题、摘要和元数据中识别同一主体、动作、产品/版本和阶段，再读取入选事件正文。不同事件宁可拆开；不要直接把本站逐篇自动创建的 `ai_events` 当成已完成跨源聚簇，也不要求先迁入 AIHOT 的全部向量/图谱体系。
3. **代码计算热度后固定顺序。** 按上述独立参与方衰减公式排序，模型只写事件摘要，不重新评分或决定顺序。同源重复与同一运营主体多渠道应折叠。对暂未配置所有者的数据，只能诚实标为“本站来源热度”，不能宣称全网热度。
4. **统计集合与引用集合分开。** 热度统计事件的全部合格证据；摘要可只引用最有支持力的一至三篇站内文章，不能因为只显示三篇就把更广的传播面截断。统计后保留可审计的来源 ID、时间和规则版本。
5. **允许少，但区分原因。** 单一来源可保留低传播热度的可信事件，不必照抄 AIHOT 热榜“至少两参与方”来禁止日报刊载。空数据、生成失败与真正没有合格新闻分别记录；不靠编造事件、放松未知引用检查或空分区占位填满版面。

这会让读者看到“发生了什么，以及它在本站材料中的关注程度”，而不是让模型在一份按时间截取的材料里凭感觉挑几个标题。候选完整性、聚簇误合并和来源身份映射，比把公式翻译成代码更值得先验收。

## 5. 验收与未验证项

- 本轮是源码研究，没有修改生成代码、数据库、任务或生产发布。父任务另行查看了 AIHOT 线上日报；开源快照不包含其真实来源名单和运营数据，不能据此宣称复制生产效果。[项目边界，README](https://github.com/KKKKhazix/AIHOT/blob/ad3e934d376e4399ce350d981b4b5eb7a61f860e/README.md#L45-L56)。
- 公式示例为源码推导，未运行 AIHOT 数据库；未验证其生产事件关系或来源所有者映射质量。
- 若进入实现，至少锁定：重复采集不增热、同主体多渠道只计一次、24小时贡献减半、48小时边界、同公司不同事件不合并、引用三篇不截断热度、重试排序稳定、单源事件和数据故障分别处理。
