import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  type SignalSource,
  type SignalSourceId,
  socialSources,
  technologyArticleSources,
  technologySources
} from '@rss-site/signals'
import type { HotItem } from './hot-feed'
import type { OutboundReturnPath } from './outbound-link'
import { getPublicSupabaseClient } from './supabase'

const sections = [
  { path: '/ai', sources: aiSources },
  { path: '/technology', sources: technologySources },
  { path: '/news', sources: newsSources },
  { path: '/social', sources: socialSources },
  { path: '/finance', sources: financeSources },
  { path: '/games', sources: gameSources }
] as const

const sources = sections.flatMap(({ path, sources }) => sources.map((source) => ({ source, path })))
const PAGE_SIZE = 30

export interface ArticleFilter {
  section?: Exclude<OutboundReturnPath, '/'>
  source?: SignalSourceId
}

export function parseArticleFilter(section: string | null, source: string | null): ArticleFilter {
  if (section !== null && !sections.some((entry) => entry.path === section))
    throw new Error('Invalid section')
  if (
    source !== null &&
    !sources.some((entry) => entry.source.id === source && (!section || entry.path === section))
  )
    throw new Error('Invalid source')
  return {
    section: (section ?? undefined) as ArticleFilter['section'],
    source: (source ?? undefined) as ArticleFilter['source']
  }
}

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
  filter: ArticleFilter = {}
): Promise<HomeArticlePage> {
  const snapshot = cursor?.snapshot ?? new Date().toISOString()
  const selectedSources = sources.filter(
    ({ source, path }) =>
      (!filter.section || path === filter.section) &&
      (!filter.source || source.id === filter.source)
  )
  if (filter.source === 'github') {
    if (cursor && cursor.position === undefined) throw new Error('Invalid ranking cursor')
    let ranking = getPublicSupabaseClient()
      .from('hot_items')
      .select('article_id,source_key,title,url,summary,position,batch_id')
      .eq('source', 'github')
      .order('position', { ascending: true })
      .limit(PAGE_SIZE + 1)
    if (cursor) ranking = ranking.eq('batch_id', cursor.batchId).gt('position', cursor.position)
    const timeout = AbortSignal.timeout(10000)
    const { data, error } = await ranking.abortSignal(
      signal ? AbortSignal.any([signal, timeout]) : timeout
    )
    if (error) throw error
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
  let query = getPublicSupabaseClient()
    .from('signal_articles')
    .select('id,source,source_key,title,url,summary,published_at')
    .in(
      'source',
      selectedSources.filter(({ source }) => source.id !== 'github').map(({ source }) => source.id)
    )
    .lte('first_seen_at', snapshot)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(PAGE_SIZE + 1)
  if (filter.section) query = query.eq('section', filter.section.slice(1))
  if (cursor) {
    query =
      cursor.publishedAt === null
        ? query.is('published_at', null).gt('id', cursor.id)
        : query.or(
            `published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.gt.${cursor.id}),published_at.is.null`
          )
  }
  const timeout = AbortSignal.timeout(10000)
  const { data, error } = await query.abortSignal(
    signal ? AbortSignal.any([signal, timeout]) : timeout
  )
  if (error) throw error
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
  const timeout = AbortSignal.timeout(10000)
  let query = getPublicSupabaseClient()
    .from('signal_articles')
    .select('id,source,source_key,title,url,summary,published_at')
    .in('source', sourceIds)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit)
  if (section) query = query.eq('section', section)
  const { data, error } = await query.abortSignal(
    signal ? AbortSignal.any([signal, timeout]) : timeout
  )
  if (error) throw error
  return (data ?? []).map((row, index) => {
    const platform = sources.find(({ source }) => source.id === row.source)
    if (!platform) throw new Error(`Unknown article source: ${row.source}`)
    return {
      articleId: row.id,
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
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
