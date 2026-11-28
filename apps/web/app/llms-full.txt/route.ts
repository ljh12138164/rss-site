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
  const allSources = listSignalSources()
  const sections = listSignalSections().filter((section) => section.hasArticles)

  const sourcesMarkdown = sections
    .map((sec) => {
      const sources = allSources.filter((source) => source.section === sec.id)
      const sourceLines = sources
        .map(
          (s) =>
            `  - **${s.name}** (\`${s.id}\`): ${s.description} -> [查看动态](${link(`/${sec.id}/${s.id}`)})`
        )
        .join('\n')
      return `### ${sec.title}专区 (${link(sec.path)})\n${sec.description}\n\n**收录信源 (${sources.length} 路)：**\n${sourceLines}`
    })
    .join('\n\n')

  const body = `# 今日热点 - 完整信源与技术规范文档 (llms-full.txt)
> 动态汇总全站 ${allSources.length} 路公开信源、每日 AI 日报、模型评测榜、Skills 目录与机器订阅接口。

## 核心定位与原则
- **定位**：专注 AI、科技、开源项目、模型评测与多频道热点的免登录资讯聚合与数据中枢。
- **事实与权威**：保留所有原始信源出处与发布时间，直接跳转原始来源；AI 日报与摘要明确标注自动整理，事实以原文为准。
- **实时更新**：各频道按定时任务错峰采集；模型评测榜每 4 小时刷新；日报按日固化为 /daily/YYYY-MM-DD 归档页。
- **开放与机器友好**：提供每日日报 RSS、分区 RSS 2.0、/mcp 端点与 /llms.txt。

## 核心专题与数据中枢
- [今日日报](${link('/daily')})：每日精选要闻汇总与历史归档（\`/daily/YYYY-MM-DD\`）
- [AI 模型评测榜](${link('/leaderboard')})：综合、编程、逻辑科研、办公 Agent 与知识问答公开基准排名及单模型证据链（\`/leaderboard/[slug]\`）
- [AI 时间轴](${link('/ai/events')})：按时间脉络聚合的 AI 行业事件详情与一手出处
- [热门 Skills](${link('/skills')})：skills.sh 热门与趋势 AI Agent Skills 榜单与安装命令
- [GitHub 中文开源排行](${link('/github')})：GitHub Trending 中文开源项目周榜

## 完整专区与信源目录（共 ${allSources.length} 路）
${sourcesMarkdown}

## 订阅与集成接口
### RSS 2.0 订阅源
- [每日日报 RSS](${link('/feeds/daily.xml')})
- [AI 动态 RSS](${link('/feeds/ai.xml')})
- [科技热点 RSS](${link('/feeds/technology.xml')})
- [社交热点 RSS](${link('/feeds/social.xml')})
- [游戏热点 RSS](${link('/feeds/games.xml')})
- [新闻 RSS](${link('/feeds/news.xml')})
- [财经热点 RSS](${link('/feeds/finance.xml')})

### 机器与智能体接口
- **简洁上下文**：[llms.txt](${link('/llms.txt')})
- **完整规格文档**：[llms-full.txt](${link('/llms-full.txt')})
- **Model Context Protocol (MCP)**：[MCP 接入文档](${link('/mcp')})
- **站点地图**：${link('/sitemap.xml')}

## 访问与隐私
- 浏览本站无需登录或授权。
- 详细说明参见 [关于本站](${link('/about')}) 与 [隐私说明](${link('/privacy')})。
`

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
