# 今日热点（AI 热榜）设计契约 — 午夜搪瓷线网中枢（Transit Hub）

## 1. 设计方向与原则

采用**午夜搪瓷线网中枢（Midnight Enamel Transit Hub）**系统，把全站（`/`、`/latest`、频道列表、日报、AI 时间轴、模型评测榜、Skills 榜、文章阅读器与工具页）统一在同一套轨交线路导览架构下：

- **默认深色首屏（`defaultTheme="dark"`）**：午夜蓝搪瓷底与白瓷墨水文字对比清晰，支持实时切换浅色「地铁白瓷板」主题。
- **信息优先，零装饰废话**：去掉英文 Decorative Eyebrow（如 `Section`、`Signal lost`）、无图占位块、括号线路后缀、状态冗语与多余引导段落。
- **双端一致导览**：桌面端 `216px` 固定左轨交目录 + `56px`（`h-14`）顶栏 + 主工作区；移动端紧凑顶栏 + 底部固定 4 项导览（热点 / 日报 / 频道 / 关注）+ 抽屉目录。不设登录入口或用户头像占位。

## 2. 色彩与语义令牌（`apps/web/app/globals.css`）

### 深色模式 `.dark`（午夜蓝搪瓷 · 默认）

| 令牌 | 色值 | 用途 |
| --- | --- | --- |
| `--background` | `#0b1224` | 主画布底色 |
| `--rail` | `#091020` | 左侧线网导航栏与移动端底部条底色 |
| `--card` / `--popover` | `#111b33` / `#14203b` | 站点卡片、清单行、弹窗表面 |
| `--secondary` / `--muted` | `#172444` / `#15213d` | 次级按钮、分段控件底槽、代码框 |
| `--foreground` / `--muted-foreground` | `#f8fafc` / `#94a3b8` | 主白瓷文本与元信息文本 |
| `--primary` / `--primary-foreground` | `#10b981` / `#051b14` | 主操作、焦点环与激活态强调色 |
| `--border` / `--strong` | `rgb(248 250 252 / 13%)` / `rgb(248 250 252 / 24%)` | 细发丝分割线与强化边框 |

### 浅色模式 `:root`（地铁白瓷）

| 令牌 | 色值 | 用途 |
| --- | --- | --- |
| `--background` / `--rail` | `#eef2f7` / `#f8fafd` | 主画布与导览底板 |
| `--card` / `--popover` | `#ffffff` | 高对比白瓷卡片 |
| `--secondary` / `--muted` | `#e3eaf3` / `#e5ebf4` | 次级面与输入底层 |
| `--foreground` / `--muted-foreground` | `#0b1224` / `#475569` | 深墨主文与辅助元信息 |
| `--primary` / `--primary-foreground` | `#1e5bff` / `#ffffff` | 钴蓝主操作、焦环与激活指示 |
| `--border` / `--strong` | `#cbd5e1` / `#94a3b8` | 明确边界线 |

### 六条轨交频道色彩编码

| 频道 | 路径 | 深色令牌（`--line-*`） | 浅色令牌（`--line-*`） |
| --- | --- | --- | --- |
| AI | `/ai` | `#10b981` | `#059669` |
| 科技 | `/technology` | `#3b82f6` | `#1e5bff` |
| 新闻 | `/news` | `#ffc20e` | `#b45309` |
| 社交 | `/social` | `#ec4899` | `#db2777` |
| 财经 | `/finance` | `#a78bfa` | `#6d28d9` |
| 游戏 | `/games` | `#fb7185` | `#e11d48` |

## 3. 排版、几何与无障碍约束

- **字体角色**：正文无衬线（`--font-sans`）、标题使用紧字距建筑无衬线 `.headline-display`、站内长文阅读可选 `--font-serif`、排名数字/评分/时间戳固定使用 `--font-mono` 与 `tabular-nums`。
- **切角与焦环安全**：卡片与交互控件半径统一收紧为 `--radius: 0.25rem`（`rounded-sm`），绝不在可点击 `<button>` / `<a>` 上使用 `clip-path`，防止 Chromium 裁切 `:focus-visible` 2px 实线焦环。
- **单行与防溢出**：导航项统一单行防折行；所有水平滚动带（频道快切条、来源筛选条、评测与 Skills `TabList`）统一配置 `overflow-x-auto overflow-y-hidden` 并避免滚动容器内的 `-mb-px` 负边距，防止出现 `1px` 纵向裁剪或滚动条。
- **语义地标**：全局由 `SiteShell` 渲染唯一 `<main id="main-content">`，页面内部不得嵌套额外 `<main>`。
