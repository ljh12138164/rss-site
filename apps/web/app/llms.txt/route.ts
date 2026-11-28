import { listSignalSections, listSignalSources } from '@rss-site/signals'
import { siteUrl } from '../../lib/site-url'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!process.env.SITE_URL) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  const link = (path: string) => siteUrl(path)
  const sources = listSignalSources()
  const sections = listSignalSections().filter((section) => section.hasArticles)
  const sectionLines = sections.map((section) => {
    const count = sources.filter((source) => source.section === section.id).length
    return `- [${section.title}](${link(section.path)}): ${section.description}（${count} 路信源）`
  })

  const body = `# 今日热点（AI 热榜）
> 面向中文开发者与 AI 从业者的公开资讯聚合、每日 AI 日报、大模型评测榜与 Skills/RSS/MCP 数据中枢。

## 关键事实 (Key Facts)
- **定位**：聚合 AI、科技、开源项目、模型评测、Agent Skills 与多频道公开资讯的免登录聚合与订阅平台。
- **信源覆盖**：动态接入 ${sources.length} 路公开官方博客、技术社区与媒体源（含 OpenAI、Anthropic、DeepSeek、Google AI、GitHub Trending、Hacker News 等）。
- **更新频次**：各分区按定时任务错峰采集；模型评测榜每 4 小时更新；AI 日报每日归档生成独立日期页。
- **内容属性**：所有条目保留上游信源名称、原始发布时间与原文链接，AI 摘要与日报均标注依据站内收录自动整理，事实以原文为准。
- **接口与订阅**：提供每日日报 RSS（/feeds/daily.xml）、全分区 RSS 2.0、/mcp 端点与 /llms.txt。

## 核心数据与功能页面
- [首页](${link('/')}): 每日热点摘要、今日日报与模型榜速览
- [今日日报](${link('/daily')}): 每日精选要闻汇总与历史日期归档（/daily/YYYY-MM-DD）
- [AI 模型评测榜](${link('/leaderboard')}): 前沿大模型综合、编程、科研推理与办公 Agent 基准实测排名
- [AI 时间轴](${link('/ai/events')}): 按事件脉络整理的 AI 行业关键动态
- [热门 Skills](${link('/skills')}): skills.sh 热门与趋势 AI Agent Skills 榜单与安装指南
- [GitHub 中文开源排行](${link('/github')}): GitHub Trending 中文开源项目周榜
- [MCP 接入文档](${link('/mcp')}): Streamable HTTP MCP 服务接入配置与工具说明
${sectionLines.join('\n')}
- [关于本站](${link('/about')}): 内容来源、更新方式与使用说明
- [隐私说明](${link('/privacy')}): 访问、搜索与外部链接的数据说明

## RSS 订阅
- [每日日报 RSS](${link('/feeds/daily.xml')})
- [AI RSS](${link('/feeds/ai.xml')})
- [科技 RSS](${link('/feeds/technology.xml')})
- [社交 RSS](${link('/feeds/social.xml')})
- [游戏 RSS](${link('/feeds/games.xml')})
- [新闻 RSS](${link('/feeds/news.xml')})
- [财经 RSS](${link('/feeds/finance.xml')})

## 完整目录与索引
- 完整信源与技术规范文档：${link('/llms-full.txt')}
- 站点地图：${link('/sitemap.xml')}
`

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
