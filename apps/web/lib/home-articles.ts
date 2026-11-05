import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  type SignalSource,
  socialSources,
  technologyArticleSources,
  technologySources
} from '@rss-site/signals'
import { sql } from 'drizzle-orm'
import { type ArticleFilter, articleSections } from './article-filter'
import { readBusinessRows } from './business-db'
import type { HotItem } from './hot-feed'
import { getCachedList } from './list-cache'
import { articleListScope } from './list-cache-scopes'
import type { OutboundReturnPath } from './outbound-link'

export type { ArticleFilter } from './article-filter'
export { parseArticleFilter } from './article-filter'

const sources = articleSections.flatMap(({ path, sources }) =>
  sources.map((source) => ({ source, path }))
)
const PAGE_SIZE = 30

interface Cursor {
  id: string
  publishedAt: string | null
  snapshot: string
  position?: number
  batchId?: string
}
export interface HomeArticle extends Omit<HotItem, 'publishedAt'> {
  articleId: string
  publishedAt: string | null
  platform: SignalSource
  section: OutboundReturnPath
}
export interface HomeArticlePage {
  items: HomeArticle[]
  nextCursor: string | null
}

export function parseHomeCursor(value: string): Cursor {
  if (value.length > 512) throw new Error('Invalid cursor')
  const cursor = JSON.parse(value)
  const validDate = (date: unknown) =>
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(date) &&
    Number.isFinite(Date.parse(date))
  if (
    !cursor ||
    typeof cursor.id !== 'string' ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(cursor.id) ||
    !validDate(cursor.snapshot) ||
    (cursor.publishedAt !== null && !validDate(cursor.publishedAt))
  )
    throw new Error('Invalid cursor')
  if (
    cursor.position !== undefined &&
    (!Number.isInteger(cursor.position) ||
      cursor.position < 1 ||
      typeof cursor.batchId !== 'string' ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(cursor.batchId))
  )
    throw new Error('Invalid ranking cursor')
  return cursor
}

export async function getHomeArticles(
  cursor: Cursor | null = null,
  signal?: AbortSignal,
  filter: ArticleFilter = {},
  refresh = false
): Promise<HomeArticlePage> {
  const scope = cursor ? null : articleListScope(filter)
  if (!scope) return queryHomeArticles(cursor, signal, filter)
  // A shared fill has its own database deadline, independent of any visitor's cancellation.
  return getCachedList(
    scope,
    isHomeArticlePage,
    () => queryHomeArticles(null, undefined, filter),
    refresh
  )
}

function isHomeArticlePage(value: unknown): value is HomeArticlePage {
  if (!value || typeof value !== 'object') return false
  const page = value as HomeArticlePage
  if (!Array.isArray(page.items) || page.items.length > PAGE_SIZE) return false
  if (page.nextCursor !== null) {
    if (typeof page.nextCursor !== 'string') return false
    try {
      parseHomeCursor(page.nextCursor)
    } catch {
      return false
    }
  }
  return page.items.every((item) => {
    if (!item || typeof item !== 'object') return false
    const source = sources.find(({ source }) => source.id === item.platform?.id)
    return (
      !!source &&
      item.section === source.path &&
      typeof item.articleId === 'string' &&
      typeof item.sourceKey === 'string' &&
      typeof item.title === 'string' &&
      typeof item.url === 'string' &&
      (item.summary === null || typeof item.summary === 'string') &&
      (item.author === null || typeof item.author === 'string') &&
      (item.imageUrl === undefined ||
        item.imageUrl === null ||
        typeof item.imageUrl === 'string') &&
      (item.publishedAt === null ||
        (typeof item.publishedAt === 'string' && Number.isFinite(Date.parse(item.publishedAt)))) &&
      Number.isInteger(item.position) &&
      item.position > 0
    )
  })
}

async function queryHomeArticles(
  cursor: Cursor | null,
  signal: AbortSignal | undefined,
  filter: ArticleFilter
): Promise<HomeArticlePage> {
  const snapshot = cursor?.snapshot ?? new Date().toISOString()
  const selectedSources = sources.filter(
    ({ source, path }) =>
      (!filter.section || path === filter.section) &&
      (!filter.source || source.id === filter.source) &&
      (!filter.sources || filter.sources.includes(source.id))
  )
  if (!selectedSources.length) return { items: [], nextCursor: null }
  if (filter.source === 'github') {
    if (cursor && cursor.position === undefined) throw new Error('Invalid ranking cursor')
    signal?.throwIfAborted()
    const data = await readBusinessRows<{
      article_id: string
      source_key: string
      title: string
      url: string
      summary: string | null
      position: number
      batch_id: string
    }>(sql`select article_id,source_key,title,url,summary,position,batch_id
      from hot_items where source='github'
      ${cursor ? sql`and batch_id=${cursor.batchId}::uuid and position>${cursor.position}` : sql``}
      order by position limit ${PAGE_SIZE + 1}`)
    const rows = (data ?? []).slice(0, PAGE_SIZE)
    const last = rows.at(-1)
    return {
      items: rows.map((row) => ({
        articleId: row.article_id ?? row.source_key,
        sourceKey: row.source_key,
        title: row.title,
        url: row.url,
        summary: row.summary?.trim() || null,
        author: null,
        publishedAt: null,
        position: row.position,
        platform: technologySources[0],
        section: '/technology'
      })),
      nextCursor:
        data && data.length > PAGE_SIZE && last
          ? JSON.stringify({
              id: last.batch_id,
              publishedAt: null,
              snapshot,
              position: last.position,
              batchId: last.batch_id
            })
          : null
    }
  }
  if (cursor?.position !== undefined) throw new Error('Invalid article cursor')
  signal?.throwIfAborted()
  const sourceIds = selectedSources
    .filter(({ source }) => source.id !== 'github')
    .map(({ source }) => source.id)
  if (!sourceIds.length) return { items: [], nextCursor: null }
  const after = !cursor
    ? sql``
    : cursor.publishedAt === null
      ? sql`and published_at is null and id>${cursor.id}::uuid`
      : sql`and (published_at<${cursor.publishedAt}::timestamptz or
        (published_at=${cursor.publishedAt}::timestamptz and id>${cursor.id}::uuid) or published_at is null)`
  const data = await readBusinessRows<{
    id: string
    source: string
    source_key: string
    title: string
    url: string
    image_url: string | null
    summary: string | null
    published_at: string | null
  }>(sql`select id,source,source_key,title,url,image_url,summary,published_at from signal_articles
    where source in (${sql.join(
      sourceIds.map((id) => sql`${id}`),
      sql`, `
    )})
      and first_seen_at<=${snapshot}::timestamptz
      ${filter.section ? sql`and section=${filter.section.slice(1)}` : sql``}
      ${after} order by published_at desc nulls last,id limit ${PAGE_SIZE + 1}`)
  const rows = (data ?? []).slice(0, PAGE_SIZE)
  const last = rows.at(-1)
  return {
    items: rows.map((row, index) => {
      const platform = sources.find(({ source }) => source.id === row.source)
      if (!platform) throw new Error(`Unknown article source: ${row.source}`)
      return {
        articleId: row.id,
        sourceKey: row.source_key,
        title: row.title,
        url: row.url,
        imageUrl: row.image_url,
        summary: row.summary?.trim().slice(0, 240) || null,
        author: null,
        publishedAt: row.published_at,
        position: index + 1,
        platform: platform.source,
        section: platform.path
      }
    }),
    nextCursor:
      data && data.length > PAGE_SIZE && last
        ? JSON.stringify({ id: last.id, publishedAt: last.published_at, snapshot })
        : null
  }
}

/** Section metadata for the homepage digest (path matches OutboundReturnPath). */
export const homeSections = [
  { path: '/ai', name: 'AI', tagline: '模型发布与产品动态', sources: aiSources },
  {
    path: '/technology',
    name: '科技',
    tagline: '技术讨论与开源趋势',
    sources: technologyArticleSources
  },
  { path: '/news', name: '国内新闻', tagline: '要闻与即时消息', sources: newsSources },
  { path: '/social', name: '社交热点', tagline: '社区与视频热议', sources: socialSources },
  { path: '/finance', name: '财经', tagline: '市场快讯与宏观', sources: financeSources },
  { path: '/games', name: '游戏', tagline: '新作与行业动态', sources: gameSources }
] as const

export interface HomeSectionPreview {
  path: (typeof homeSections)[number]['path']
  name: string
  tagline: string
  items: HomeArticle[]
}

export interface HomeDigest {
  /** Latest items across all sections, ranked by recency. */
  top: HomeArticle[]
  /** Per-section preview (latest 3 each), in homeSections order. */
  sections: HomeSectionPreview[]
}

async function fetchLatestBySection(
  section: string | null,
  sourceIds: string[],
  limit: number,
  signal?: AbortSignal
): Promise<HomeArticle[]> {
  signal?.throwIfAborted()
  if (!sourceIds.length) return []
  const data = await readBusinessRows<{
    id: string
    source: string
    source_key: string
    title: string
    url: string
    image_url: string | null
    published_at: string | null
  }>(sql`select id,source,source_key,title,url,image_url,published_at from signal_articles
    where source in (${sql.join(
      sourceIds.map((id) => sql`${id}`),
      sql`, `
    )})
    ${section ? sql`and section=${section}` : sql``}
    order by published_at desc nulls last,id limit ${limit}`)
  return (data ?? []).map((row, index) => {
    const platform = sources.find(({ source }) => source.id === row.source)
    if (!platform) throw new Error(`Unknown article source: ${row.source}`)
    return {
      articleId: row.id,
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
      imageUrl: row.image_url,
      summary: null,
      author: null,
      publishedAt: row.published_at,
      position: index + 1,
      platform: platform.source,
      section: platform.path
    }
  })
}

/**
 * Homepage digest: top items across every section plus a 3-item preview per section.
 * Single source of truth for the editorial homepage so it never touches the
 * infinite-scroll article feed.
 */
export async function getHomeDigest(signal?: AbortSignal): Promise<HomeDigest> {
  const allIds = sources
    .filter(({ source }) => source.id !== 'github')
    .map(({ source }) => source.id)
  const [top, ...previews] = await Promise.all([
    fetchLatestBySection(null, allIds, 5, signal).catch(() => [] as HomeArticle[]),
    ...homeSections.map(({ path, sources: sectionSources }) =>
      fetchLatestBySection(
        path.slice(1),
        sectionSources.map((source) => source.id),
        3,
        signal
      ).catch(() => [] as HomeArticle[])
    )
  ])
  return {
    top,
    sections: homeSections.map((section, index) => ({
      path: section.path,
      name: section.name,
      tagline: section.tagline,
      items: previews[index] ?? []
    }))
  }
}
