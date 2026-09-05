import { getPublicSupabaseClient } from './supabase'
import {
  type AiSourceId,
  aiSources,
  isAiSourceId,
  type NewsSourceId,
  newsSources,
  type SignalSourceId,
  type TechnologySourceId,
  technologySources
} from './technology-sources'

export interface HotItemRow {
  source: string
  source_key: string
  title: string
  url: string
  summary: string | null
  author: string | null
  published_at: string | null
  position: number
}

export interface SourceStatusRow {
  source: string
  item_count: number
  last_success_at: string
}

export interface FeedCollectionQueryResult {
  items: HotItemRow[] | null
  statuses: SourceStatusRow[] | null
  error: string | null
}

export type FeedCollectionQuery = () => Promise<FeedCollectionQueryResult>

export interface HotItem {
  sourceKey: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
  position: number
}

export type FeedResult =
  | {
      state: 'ready'
      items: HotItem[]
      status: {
        itemCount: number
        lastSuccessAt: Date
      }
    }
  | { state: 'empty' }
  | { state: 'error' }

export type TechnologyFeeds = Record<TechnologySourceId, FeedResult>
export type NewsFeeds = Record<NewsSourceId, FeedResult>
export type AiFeeds = Record<AiSourceId, FeedResult>

export interface AiTimelineItem extends HotItem {
  source: AiSourceId
}

export type AiTimelineResult =
  | { state: 'ready'; items: AiTimelineItem[] }
  | { state: 'empty' }
  | { state: 'error' }

async function querySectionFeeds(
  section: 'technology' | 'news' | 'ai',
  sourceIds: SignalSourceId[]
): Promise<FeedCollectionQueryResult> {
  try {
    const supabase = getPublicSupabaseClient()
    const [itemsResult, statusesResult] = await Promise.all([
      supabase
        .from('hot_items')
        .select('source,source_key,title,url,summary,author,published_at,position')
        .eq('section', section)
        .in('source', sourceIds)
        .order('position', { ascending: true }),
      supabase
        .from('source_status')
        .select('source,item_count,last_success_at')
        .in('source', sourceIds)
    ])

    return {
      items: itemsResult.data as HotItemRow[] | null,
      statuses: statusesResult.data as SourceStatusRow[] | null,
      error: itemsResult.error?.message ?? statusesResult.error?.message ?? null
    }
  } catch {
    return { items: null, statuses: null, error: 'Supabase is unavailable' }
  }
}

const queryTechnologyFeeds = () =>
  querySectionFeeds(
    'technology',
    technologySources.map((source) => source.id)
  )

const queryNewsFeeds = () =>
  querySectionFeeds(
    'news',
    newsSources.map((source) => source.id)
  )

const queryAiFeeds = () =>
  querySectionFeeds(
    'ai',
    aiSources.map((source) => source.id)
  )

const queryAiTimeline =
  (limit: number): FeedCollectionQuery =>
  async () => {
    try {
      const supabase = getPublicSupabaseClient()
      const result = await supabase
        .from('hot_items')
        .select('source,source_key,title,url,summary,author,published_at,position')
        .eq('section', 'ai')
        .in(
          'source',
          aiSources.map((source) => source.id)
        )
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('position', { ascending: true })
        .limit(limit)

      return {
        items: result.data as HotItemRow[] | null,
        statuses: null,
        error: result.error?.message ?? null
      }
    } catch {
      return { items: null, statuses: null, error: 'Supabase is unavailable' }
    }
  }

function buildFeed(
  source: SignalSourceId,
  result: FeedCollectionQueryResult,
  limit?: number
): FeedResult {
  if (result.error) return { state: 'error' }

  const rows = (result.items ?? [])
    .filter((row) => row.source === source)
    .sort((left, right) => left.position - right.position)
    .slice(0, limit)

  if (rows.length === 0) return { state: 'empty' }

  const status = (result.statuses ?? []).find((candidate) => candidate.source === source)
  if (!status) return { state: 'error' }

  return {
    state: 'ready',
    items: rows.map((row) => ({
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
      summary: row.summary,
      author: row.author,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      position: row.position
    })),
    status: {
      itemCount: status.item_count,
      lastSuccessAt: new Date(status.last_success_at)
    }
  }
}

export async function getTechnologyFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryTechnologyFeeds
): Promise<TechnologyFeeds> {
  const result = await query()

  return Object.fromEntries(
    technologySources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as TechnologyFeeds
}

export async function getTechnologyFeed(
  source: TechnologySourceId,
  limit?: number,
  query: FeedCollectionQuery = queryTechnologyFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getNewsFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryNewsFeeds
): Promise<NewsFeeds> {
  const result = await query()

  return Object.fromEntries(
    newsSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as NewsFeeds
}

export async function getNewsFeed(
  source: NewsSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryNewsFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getAiFeeds(
  limitPerSource?: number,
  query: FeedCollectionQuery = queryAiFeeds
): Promise<AiFeeds> {
  const result = await query()

  return Object.fromEntries(
    aiSources.map((source) => [source.id, buildFeed(source.id, result, limitPerSource)])
  ) as AiFeeds
}

export async function getAiFeed(
  source: AiSourceId,
  limit?: number,
  query: FeedCollectionQuery = queryAiFeeds
): Promise<FeedResult> {
  return buildFeed(source, await query(), limit)
}

export async function getAiTimeline(
  limit = 30,
  query?: FeedCollectionQuery
): Promise<AiTimelineResult> {
  const result = await (query ?? queryAiTimeline(limit))()
  if (result.error) return { state: 'error' }

  const items = (result.items ?? [])
    .filter((row): row is HotItemRow & { source: AiSourceId } => isAiSourceId(row.source))
    .map((row) => ({
      source: row.source,
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
      summary: row.summary,
      author: row.author,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      position: row.position
    }))
    .sort((left, right) => {
      const leftTime = left.publishedAt?.getTime()
      const rightTime = right.publishedAt?.getTime()

      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
        return (rightTime as number) - (leftTime as number) || left.position - right.position
      }
      if (Number.isFinite(leftTime)) return -1
      if (Number.isFinite(rightTime)) return 1
      return left.position - right.position
    })
    .slice(0, limit)

  return items.length > 0 ? { state: 'ready', items } : { state: 'empty' }
}
