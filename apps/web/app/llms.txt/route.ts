import { siteUrl } from '../../lib/site-url'

export const revalidate = 86400

export async function GET() {
  if (!process.env.SITE_URL) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  const link = (path: string) => siteUrl(path)
  const body = `# 今日热点
> 每日聚合 AI、科技、新闻、社交、财经与游戏热点，保留来源与发布时间，并提供分区 RSS。

## 关键事实 (Key Facts)
- **定位**：专注 AI、科技、新闻、社交、财经与游戏六大维度的轻量化热点聚合与 RSS 订阅平台。
- **更新机制**：AI 平台区每 2 小时更新，科技、国内新闻、社交、财经、游戏各分区每 6 小时错峰获取最新公开内容。
- **信源覆盖**：收录 35+ 官方订阅与知名媒体源（涵盖 OpenAI、Anthropic、DeepSeek、Google AI、GitHub Trending、Hacker News、新华社、央视等）。
- **内容属性**：所有条目保留上游信源名称、原始发布时间与原文链接，不做二道事实改写或主观编造。
- **接口与订阅**：提供全分区标准 RSS 2.0 订阅源、/mcp 端点与 /llms.txt，支持 AI Agent 与自动化工作流安全读取。

## 主要页面
- [首页](${link('/')}): 每日热点摘要与内容分区入口
- [AI 最新动态](${link('/ai')}): AI 平台官方文章与产品动态
- [AI 时间轴](${link('/ai/events')}): 按事件整理的 AI 行业动态
- [科技热点](${link('/technology')}): 开发者社区与科技媒体内容
- [国内新闻](${link('/news')}): 国内新闻来源聚合
- [社交热点](${link('/social')}): 公开社区热榜
- [财经热点](${link('/finance')}): 财经媒体与市场快讯
- [游戏热点](${link('/games')}): 游戏媒体与行业内容
- [关于本站](${link('/about')}): 内容来源、更新方式与使用说明
- [隐私说明](${link('/privacy')}): 访问、搜索与外部链接的数据说明

## RSS 订阅
- [AI RSS](${link('/feeds/ai.xml')})
- [科技 RSS](${link('/feeds/technology.xml')})
- [新闻 RSS](${link('/feeds/news.xml')})
- [社交 RSS](${link('/feeds/social.xml')})
- [财经 RSS](${link('/feeds/finance.xml')})
- [游戏 RSS](${link('/feeds/games.xml')})

## 内容说明
- 文章页面标注原始来源，并提供原文链接。
- 聚合内容可能是摘要或节选；事实与后续更新以原始来源为准。
- 完整信源与详细文档：${link('/llms-full.txt')}
- 站点地图：${link('/sitemap.xml')}
`

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
