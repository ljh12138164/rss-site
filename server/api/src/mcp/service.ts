import { desc, eq } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import { signalArticles } from '../db/schema.js'
import { signalSources } from '../technology/sources.js'

export interface McpNewsItem {
  id: string
  title: string
  url: string
  source: string
  sourceName?: string
  section: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
  firstSeenAt: Date
}

export interface FetchNewsOptions {
  platform?: string
  limit?: number
}

const sourceNameMap = new Map<string, string>(
  signalSources.map((source) => [source.id, source.name])
)

const knownSections = new Set<string>([
  'technology',
  'ai',
  'news',
  'social',
  'finance',
  'games',
  'skills'
])

export async function fetchMcpNews(
  db: Database,
  options: FetchNewsOptions = {}
): Promise<McpNewsItem[]> {
  const limit = Math.min(Math.max(1, options.limit ?? 100), 100)
  const platform = options.platform?.trim().toLowerCase()

  let query = db
    .select({
      id: signalArticles.id,
      title: signalArticles.title,
      url: signalArticles.url,
      source: signalArticles.source,
      section: signalArticles.section,
      summary: signalArticles.summary,
      author: signalArticles.author,
      publishedAt: signalArticles.publishedAt,
      firstSeenAt: signalArticles.firstSeenAt
    })
    .from(signalArticles)
    .$dynamic()

  if (platform) {
    if (knownSections.has(platform)) {
      query = query.where(eq(signalArticles.section, platform))
    } else {
      query = query.where(eq(signalArticles.source, platform))
    }
  }

  const rows = await query
    .orderBy(desc(signalArticles.publishedAt), desc(signalArticles.firstSeenAt))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    sourceName: sourceNameMap.get(row.source) ?? row.source
  }))
}

export function formatMcpNewsResponse(items: McpNewsItem[], platform?: string): string {
  if (items.length === 0) {
    return platform ? `未找到平台或分类 "${platform}" 相关的最新新闻。` : '当前数据库暂无新闻记录。'
  }

  const filterDesc = platform ? `平台/分类 "${platform}"` : '全平台'
  const lines: string[] = [`共获取到 ${items.length} 条最新新闻（筛选条件：${filterDesc}）：\n`]

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const dateStr = item.publishedAt
      ? new Date(item.publishedAt).toISOString().replace('T', ' ').slice(0, 16)
      : new Date(item.firstSeenAt).toISOString().replace('T', ' ').slice(0, 16)
    const sourceLabel = item.sourceName ? `${item.sourceName} (${item.source})` : item.source
    lines.push(`${i + 1}. [${item.title}](${item.url})`)
    lines.push(`   - 平台: ${sourceLabel} | 分类: ${item.section} | 时间: ${dateStr}`)
    if (item.summary) {
      const cleanSummary = item.summary.replace(/\s+/g, ' ').trim()
      const truncated =
        cleanSummary.length > 180 ? `${cleanSummary.slice(0, 180)}...` : cleanSummary
      lines.push(`   - 摘要: ${truncated}`)
    }
  }

  return lines.join('\n')
}
