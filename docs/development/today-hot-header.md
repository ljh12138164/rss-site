# 今日热点头部

## Background
用户要求继续当前分支，优化共享头部并将站名改成“今日热点”，同时解释文章为何进入离站页。

## Scope
共享头部的品牌、导航层级、当前页状态和浏览器标题。沿用已有路由、冷蓝语义色、React Aria、Tailwind 和明暗主题，不新增依赖。

## Out of scope
第三方全文采集、扩展文章详情路由、部署和推送。

## Acceptance criteria
站名与默认浏览器标题为今日热点；分类及 AI 时间轴正确高亮；手机导航横向滚动，桌面品牌、导航、工具清晰分组；保留搜索和主题切换。

## Feasibility
复用原有组件。仅头部需要 usePathname，SiteShell 保持服务端组件。用户已授权本次头部细化，复用此前确认的页面范围和视觉系统。UI Skills 工具未暴露，以 frontend-design 和仓库 UI quality 指南回退。

## Implementation
站名使用较强无衬线字重和冷蓝竖线标识。导航使用底线显示当前分类；时间轴单独留白，且排除 AI 分类同时高亮。桌面一行，较窄屏幕两行。默认 metadata 同步新站名。

文章入口检查：HotList 仅在 internalArticles 或 news 分区时生成站内新闻详情链接，其余使用 /out。新闻详情查询限定 news，只展示保存的摘要、时间、作者和原文入口，不保存第三方全文。此轮仅解释现状，不擅自扩展内容模型。

## Verification
本地首页 HTTP 200。git diff --check 通过。限定文件的 Biome 检查因缺少 biome 可执行文件未运行；类型检查因 node_modules 缺失 @types/react 和 @types/react-dom 文件失败。尚未完成浏览器视觉验收。

## Risks
需在本地服务中复核桌面、手机和明暗主题。不能将代码完成当作视觉验收完成。
