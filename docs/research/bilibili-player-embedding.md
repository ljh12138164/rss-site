# B 站官方外链播放器接入调研

调研日期为 2026-11-28。目标是在 rss-site 的 Next.js 阅读页播放 RSS 条目对应的公开视频。

## 结论

优先在现有阅读页挂载一个 React iframe，地址由验证过的 B 站视频标识生成。B 站官方已经提供 HTTPS 外链播放器，内置播放控件。对当前需求，第三方播放器不会改善上游视频的权限、地区或登录限制。第三方库可以作为 URL 参数和延迟加载的实现参考。[B 站外链播放器使用说明](https://player.bilibili.com/)

## 官方播放器与数据边界

- 官方播放器固定为 `https://player.bilibili.com/player.html`。UGC 可用 `bvid` 或 `aid`，分 P 可传 `p`，有 `cid` 时 `p` 不生效。播放器文档还列出了 `autoplay`、`muted`、`t`、`danmaku` 和 OGV 条目的 `episodeId`。适合阅读页的默认值是显式设置 `autoplay=0`。官方示例视频为 `BV1B7411m7LV`。[官方播放器说明](https://player.bilibili.com/)
- 播放器地址由固定域名和小范围参数组成。用明确的 B 站视频 URL 或已验证的 Feed 参数提取 ID，保留对应原视频外链。RSS 原始 iframe 和它的属性属于外部输入，应用可以生成自己的 iframe 节点并沿用现有的 HTML 清理边界。[阅读正文清理](../../apps/web/lib/article-content.ts) · [现有 CCTV 媒体挂载方式](../../apps/web/components/article-html-body.tsx)
- 交互可使用带标题的 16:9 iframe 和原文入口，按需懒加载或点封面再挂载。父页面能知道 iframe 已载入，实际起播则需要用浏览器观察。官方文档未提供 UGC iframe 的跨域播放控制 API。[官方播放器说明](https://player.bilibili.com/) · [HTML iframe 文档](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/iframe)

## 开源方案对比

| 方案 | 已核对的能力 | 对当前接入的价值 |
| --- | --- | --- |
| React 原生 iframe | 直接接官方播放器，参数、标题、加载策略和权限由站点控制。 | 当前首选。实现规模小，可保留分 P 和原文链接。 |
| `react-bilibili-embed-renderer` 1.3.0 | MIT，仓库已归档。构建产物封装官方 iframe，支持 BV/av、尺寸、全屏和弹幕选项。源码输出协议相对 URL，分集用 `page`，官方当前文档用 `p`。组件未提供 `autoplay` 和 `cid` 查询参数。 | 可参考其 React Props 和宽高比处理。[源码仓库](https://github.com/zeffon/bilibili-embed-renderer) · [1.3.0 发布代码](https://unpkg.com/react-bilibili-embed-renderer@1.3.0/dist/index.es.jsx) |
| `vplayer-react` 1.6.1 | MIT，React 18+。React Client Component，支持多个平台。已发布的 B 站解析代码识别 BV/av，并生成官方 iframe。解析没有保留 `p` 和 `cid`，挂载 iframe 时附加 `autoplay=1`。 | 有统一多平台 React 组件需求时值得评估。当前单一来源不需要这些额外能力。[源码仓库](https://github.com/ardaydilek/vplayer-react) · [1.6.1 发布代码](https://unpkg.com/vplayer-react@1.6.1/dist/index.mjs) |
| `@lichi.tech/link-to-embed` 0.1.4 | GPL-3.0-only。框架无关 URL 转换器。B 站内置规则接受 BV/av，转发 `p`，设置 `autoplay=0`，输出 iframe HTML 字符串。 | 适合参考转换逻辑。React 阅读器直接管理结构和安全属性更清楚。[源码仓库](https://github.com/lichitech/link-to-embed) · [0.1.4 发布代码](https://unpkg.com/@lichi.tech/link-to-embed@0.1.4/dist/index.mjs) |
| Vue/Astro 示例 | VuePress 的 `BiliBiliEmbed` 和 VitePress 插件提供官方 iframe 的框架专用封装。Justin3go 能核对到的是博客内嵌示例，未找到可确认的对应 npm 库。 | 只参考响应式布局和参数。项目现有阅读页使用 React。[VuePress 文档](https://ecosystem.vuejs.press/plugins/features/media.html#bilibiliembed) · [VitePress 插件说明](https://www.wwvo.fun/vaultkit-%E5%8C%85%E6%8C%87%E5%8D%97/17-bilibili-b-%E7%AB%99%E8%A7%86%E9%A2%91%E5%B5%8C%E5%85%A5%E5%AE%8C%E5%85%A8%E6%8C%87%E5%8D%97) · [Justin3go 源文档](https://github.com/Justin3go/justin3go.com/blob/0d9756571a94774aebdef2003b71e69b55c13a22/docs/posts/2022/05/05前端程序员搭建自己的CodeIDE（code-server教程）.md) |
| ReactPlayer 3.4.0 | 内置播放器有 YouTube、Vimeo 和 HLS/DASH 等。发布代码的 provider 列表没有 Bilibili。可扩展自定义播放器，但仍要自己实现 B 站 iframe。 | 对当前场景没有额外收益。[官方仓库](https://github.com/cookpete/react-player#supported-media) · [3.4.0 provider 列表](https://unpkg.com/react-player@3.4.0/dist/players.js) |
| ArtPlayer 5.4.0 / DPlayer 1.27.1 | 两个项目都用 HTML5 播放媒体源。ArtPlayer 的 iframe 插件针对嵌入 ArtPlayer 实例，DPlayer 的 B 站相关文档是弹幕接入。 | 适合自有 MP4、HLS、DASH 地址的播放场景。B 站官方播放器允许只靠视频 ID 嵌入，当前无需获取直链。[ArtPlayer 文档](https://artplayer.org/document/en/) · [DPlayer 文档](https://dplayer.diygod.dev/guide.html#bilibili-danmaku) |

在公开仓库和 npm 检索中未能用 `PlayerReact` 这个名称确定具体的 B 站依赖，因此上述核对以可定位版本的 `vplayer-react` 和 `ReactPlayer` 为准。

## 实际播放

从现有 B 站 Feed 取两条公开稿件，用独立页面嵌入官方播放器。页面 CSP 设置为 `default-src 'self'; frame-src https://player.bilibili.com`。桌面 Chromium 点击播放后，两条视频分别前进约 2.59 秒和 2.58 秒，持续时间为 684 秒和 149 秒，未报媒体错误。Pixel 7 模拟中官方 iframe 初次请求返回 HTTP 200，随后尝试在框架内导航到 `https://www.bilibili.com/`，被只允许播放器域名的 CSP 拦截。未出现 video 元素。后续把 CSP 收窄到两个明确的播放器路径，即 `frame-src https://player.bilibili.com/player.html https://www.bilibili.com/blackboard/webplayer/mbplayer.html`。桌面播放仍正常，两个样本在 Pixel 7 模拟中均加载移动播放器，浏览器调用 video.play() 后各推进约 2.56 秒。真实手机、移动端点击交互和全屏仍需在站内验收。[桌面样本一](https://www.bilibili.com/video/BV1G91WzWEH8) · [桌面样本二](https://www.bilibili.com/video/BV13T1JzuEeJ)

## 后续验收

用真实 Feed 条目和带 `p` 的分集视频验证，覆盖阅读页窄屏、正常点击播放、全屏和不可播放时的原文入口。HTTP 200、iframe 出现和视频实际开始播放应分别记录。本次依赖评估查看了官方文档和发布代码，未安装候选依赖，也未改动阅读页。
