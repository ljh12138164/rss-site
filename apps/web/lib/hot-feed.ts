import { getPublicSupabaseClient } from './supabase'
import { type TechnologySourceId, technologySources } from './technology-sources'

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

async function queryTechnologyFeeds(): Promise<FeedCollectionQueryResult> {
  try {
    const supabase = getPublicSupabaseClient()
    const sourceIds = technologySources.map((source) => source.id)
    const [itemsResult, statusesResult] = await Promise.all([
      supabase
        .from('hot_items')
        .select('source,source_key,title,url,summary,author,published_at,position')
        .eq('section', 'technology')
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

function buildFeed(
  source: TechnologySourceId,
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
