import { siteUrl } from '../../lib/site-url'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  signalSections,
  socialSources,
  technologySources
} from '../../lib/technology-sources'

export const revalidate = 86400

export async function GET() {
  if (!process.env.SITE_URL) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  const link = (path: string) => siteUrl(path)

  const sectionSourcesMap: Record<string, readonly { id: string; name: string; description: string }[]> = {
    ai: aiSources,
    technology: technologySources,
    news: newsSources,
    social: socialSources,
    finance: financeSources,
    games: gameSources
  }

  const sourcesMarkdown = signalSections
    .filter((sec) => sec.hasArticles && sectionSourcesMap[sec.id])
    .map((sec) => {
      const sources = sectionSourcesMap[sec.id] ?? []
      const sourceLines = sources
        .map(
          (s) =>
            `  - **${s.name}** (\`${s.id}\`): ${s.description} -> [查看动态](${link(`/${sec.id}/${s.id}`)})`
        )
        .join('\n')
      return `### ${sec.title}专区 (${link(sec.path)})\n${sec.description}\n\n**收录信源 (${sources.length}路)：**\n${sourceLines}`
    })
    .join('\n\n')

  const body = `# 今日热点 - 完整信源与技术规范文档 (llms-full.txt)
> 每日聚合 AI、科技、新闻、社交、财经与游戏热点，保留来源与发布时间，并提供分区 RSS。

## 核心定位与原则
- **定位**：专注 AI、科技、新闻、社交、财经与游戏六大维度的轻量化热点聚合与 RSS 订阅平台。
- **事实与权威**：保留所有原始信源出处与发布时间，直接跳转原始来源，不做二道事实改写或主观编造。
- **错峰采集**：AI 平台专区每 2 小时自动同步，其余分区每 6 小时错峰获取最新内容。
- **开放与机器友好**：提供全分区标准 RSS 2.0 订阅源、/mcp 端点与 /llms.txt 规范接口，支持 AI Agent 自主读取。

## 完整专区与信源目录
${sourcesMarkdown}

## 订阅与集成接口
### RSS 2.0 订阅源
- [AI 动态 RSS](${link('/feeds/ai.xml')})
- [科技热点 RSS](${link('/feeds/technology.xml')})
- [新闻 RSS](${link('/feeds/news.xml')})
- [社交热点 RSS](${link('/feeds/social.xml')})
- [财经热点 RSS](${link('/feeds/finance.xml')})
- [游戏热点 RSS](${link('/feeds/games.xml')})

### 机器与智能体接口
- **简洁上下文**：[llms.txt](${link('/llms.txt')})
- **完整规格文档**：[llms-full.txt](${link('/llms-full.txt')})
- **Model Context Protocol (MCP)**：[WebMCP 端点](${link('/mcp')})
- **站点地图**：${link('/sitemap.xml')}

## 访问与隐私
- 浏览本站无需登录或授权，无任何跨站追踪器。
- 详细说明参见 [关于本站](${link('/about')}) 与 [隐私说明](${link('/privacy')})。
`

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
