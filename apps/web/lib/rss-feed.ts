import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  type SignalSource,
  socialSources,
  technologySources
} from '@rss-site/signals'
import {
  compareHotItemsByPublishedAt,
  type FeedResult,
  getAiFeeds,
  getFinanceFeeds,
  getGameFeeds,
  getNewsFeeds,
  getSocialFeeds,
  getTechnologyFeeds,
  type HotItem
} from './hot-feed'

export const RSS_ITEMS_PER_SOURCE = 10

export const rssSectionIds = ['ai', 'technology', 'news', 'social', 'finance', 'games'] as const

export type RssSectionId = (typeof rssSectionIds)[number]

export interface RssSectionConfig {
  id: RssSectionId
  title: string
  description: string
  pagePath: string
  sources: readonly SignalSource[]
}

export interface RssEntry {
  source: SignalSource
  item: HotItem
}

export interface RssSectionData {
  config: RssSectionConfig
  entries: RssEntry[]
  lastBuildDate: Date | null
  unavailable: boolean
}

const rssSections = {
  ai: {
    id: 'ai',
    title: 'AI',
    description: 'OpenAI、ChatGPT、Anthropic、DeepSeek、GLM、Gemini 与 Qwen 的官方动态',
    pagePath: '/ai',
    sources: aiSources
  },
  technology: {
    id: 'technology',
    title: '科技',
    description: '开发者社区、开源项目与科技媒体的当前热点',
    pagePath: '/technology',
    sources: technologySources
  },
  news: {
    id: 'news',
    title: '国内新闻',
    description: '国内新闻媒体与公共热榜的当前内容',
    pagePath: '/news',
    sources: newsSources
  },
  social: {
    id: 'social',
    title: '社交热点',
    description: '视频、问答与社区平台的当前热门内容',
    pagePath: '/social',
    sources: socialSources
  },
  finance: {
    id: 'finance',
    title: '财经',
    description: '市场快讯、商业新闻与财经媒体的当前热点',
    pagePath: '/finance',
    sources: financeSources
  },
  games: {
    id: 'games',
    title: '游戏',
    description: '游戏媒体、编辑内容与商店榜单的当前条目',
    pagePath: '/games',
    sources: gameSources
  }
} as const satisfies Record<RssSectionId, RssSectionConfig>

export function parseRssFeedName(feedName: string): RssSectionId | null {
  const match = /^(ai|technology|news|social|finance|games)\.xml$/.exec(feedName)
  return match ? (match[1] as RssSectionId) : null
}

export function buildRssSectionData<
  SourceId extends SignalSource['id'],
  Source extends SignalSource & { id: SourceId }
>(
  config: Omit<RssSectionConfig, 'sources'> & { sources: readonly Source[] },
  feeds: Record<SourceId, FeedResult>
): RssSectionData {
  const entries: RssEntry[] = []
  const successfulDates: Date[] = []
  let errorCount = 0
  const articleSources = config.sources.filter((source) => source.id !== 'github')

  for (const source of articleSources) {
    const feed = feeds[source.id]

    if (feed.state === 'error') {
      errorCount += 1
      continue
    }

    if (feed.state === 'ready') {
      if (Number.isFinite(feed.status.lastSuccessAt.getTime())) {
        successfulDates.push(feed.status.lastSuccessAt)
      }

      for (const item of feed.items) {
        entries.push({ source, item })
      }
    }
  }

  const lastBuildTimestamp = successfulDates.reduce(
    (latest, date) => Math.max(latest, date.getTime()),
    0
  )
  entries.sort((left, right) => compareHotItemsByPublishedAt(left.item, right.item))

  return {
    config,
    entries,
    lastBuildDate: lastBuildTimestamp > 0 ? new Date(lastBuildTimestamp) : null,
    unavailable: articleSources.length > 0 && errorCount === articleSources.length
  }
}

export async function loadRssSection(section: RssSectionId): Promise<RssSectionData> {
  switch (section) {
    case 'ai':
      return buildRssSectionData(rssSections.ai, await getAiFeeds(RSS_ITEMS_PER_SOURCE))
    case 'technology':
      return buildRssSectionData(
        rssSections.technology,
        await getTechnologyFeeds(RSS_ITEMS_PER_SOURCE)
      )
    case 'news':
      return buildRssSectionData(rssSections.news, await getNewsFeeds(RSS_ITEMS_PER_SOURCE))
    case 'social':
      return buildRssSectionData(rssSections.social, await getSocialFeeds(RSS_ITEMS_PER_SOURCE))
    case 'finance':
      return buildRssSectionData(rssSections.finance, await getFinanceFeeds(RSS_ITEMS_PER_SOURCE))
    case 'games':
      return buildRssSectionData(rssSections.games, await getGameFeeds(RSS_ITEMS_PER_SOURCE))
  }
}

function escapeXml(value: string): string {
  const validXml = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0)
      if (codePoint === undefined) return false

      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      )
    })
    .join('')

  return validXml
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function optionalElement(name: string, value: string | null): string[] {
  const normalized = value?.trim()
  return normalized ? [`      <${name}>${escapeXml(normalized)}</${name}>`] : []
}

function validRssDate(date: Date | null): string | null {
  return date && Number.isFinite(date.getTime()) ? date.toUTCString() : null
}

export function renderRssSectionXml(data: RssSectionData, origin: string): string {
  const pageUrl = new URL(data.config.pagePath, origin).toString()
  const feedUrl = new URL(`/feeds/${data.config.id}.xml`, origin).toString()
  const lastBuildDate = validRssDate(data.lastBuildDate)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`AI 热榜 · ${data.config.title}`)}</title>`,
    `    <link>${escapeXml(pageUrl)}</link>`,
    `    <description>${escapeXml(data.config.description)}</description>`,
    '    <language>zh-CN</language>',
    '    <generator>rss-site</generator>',
    '    <docs>https://www.rssboard.org/rss-specification</docs>',
    '    <ttl>30</ttl>',
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`
  ]

  if (lastBuildDate) {
    lines.push(`    <lastBuildDate>${lastBuildDate}</lastBuildDate>`)
  }

  for (const { source, item } of data.entries) {
    const publishedAt = validRssDate(item.publishedAt)
    lines.push(
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.url)}</link>`,
      `      <guid isPermaLink="false">${escapeXml(`${data.config.id}:${source.id}:${item.sourceKey}`)}</guid>`,
      `      <category>${escapeXml(source.name)}</category>`,
      ...optionalElement('description', item.summary)
    )

    if (publishedAt) {
      lines.push(`      <pubDate>${publishedAt}</pubDate>`)
    }

    lines.push('    </item>')
  }

  lines.push('  </channel>', '</rss>', '')
  return lines.join('\n')
}
